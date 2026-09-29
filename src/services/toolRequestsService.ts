/**
 * OnlineTools Tool Requests Service
 * Manages user-submitted tool requests from /request-a-tool and the admin dashboard.
 * Supports individual submissions, status tracking, internal admin notes,
 * and grouping by tool name to count duplicate demand.
 */

export type ToolRequestStatus = 'new' | 'in_progress' | 'completed' | 'declined';

export interface ToolRequestNote {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface ToolRequest {
  id: string;
  toolName: string;
  description: string;
  requesterEmail?: string;
  requesterName?: string;
  category?: string;
  useCase?: string;
  createdAt: string; // ISO 8601 string
  status: ToolRequestStatus;
  adminNotes: ToolRequestNote[];
  ipAddress?: string;
}

export interface GroupedToolRequest {
  groupKey: string;
  toolName: string;
  category?: string;
  count: number;
  requests: ToolRequest[];
  latestDate: string;
  requesters: string[];
  statusBreakdown: Record<ToolRequestStatus, number>;
  primaryStatus: ToolRequestStatus;
  totalNotesCount: number;
}

export interface ToolRequestsStats {
  total: number;
  newCount: number;
  inProgress: number;
  completed: number;
  declined: number;
  uniqueToolsCount: number;
  topRequestedTool?: string;
}

const STORAGE_KEY = 'onlinetools_tool_requests_v1';
export const TOOL_REQUESTS_CHANGED_EVENT = 'onlinetools_tool_requests_changed';
import {
  submitToolRequest as submitToSupabase,
  updateToolRequestStatus as updateInSupabase,
  deleteToolRequest as deleteInSupabase,
} from './supabaseDataService';

/**
 * Realistic seed data: 37 requests matching ADMIN_STATS_SUMMARY (37 total, 9 new)
 * with realistic duplicates to demonstrate duplicate request grouping and popularity ranking.
 */
const INITIAL_SEED_REQUESTS: ToolRequest[] = [];

/**
 * Normalizes tool name for grouping (lowercases, removes punctuation, trims spaces)
 */
export function normalizeToolNameKey(rawName: string): string {
  return rawName
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Loads requests from localStorage or seeds initial database
 */
export function getToolRequests(): ToolRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_REQUESTS));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn('Failed to load tool requests from storage:', error);
    return [];
  }
}

/**
 * Saves requests to localStorage and broadcasts event
 */
function saveToolRequests(requests: ToolRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent(TOOL_REQUESTS_CHANGED_EVENT, { detail: requests }));
  } catch (error) {
    console.error('Failed to save tool requests to storage:', error);
  }
}

/**
 * Submits a new tool request from public /request-a-tool or admin
 */
export function submitToolRequest(input: {
  toolName: string;
  description: string;
  requesterEmail?: string;
  requesterName?: string;
  category?: string;
  useCase?: string;
}): ToolRequest {
  const current = getToolRequests();
  const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newRequest: ToolRequest = {
    id,
    toolName: input.toolName.trim(),
    description: input.description.trim(),
    requesterEmail: input.requesterEmail?.trim() || undefined,
    requesterName: input.requesterName?.trim() || (input.requesterEmail ? input.requesterEmail.split('@')[0] : 'Community User'),
    category: input.category || 'General Utility',
    useCase: input.useCase?.trim() || undefined,
    createdAt: new Date().toISOString(),
    status: 'new',
    adminNotes: [],
  };

  const updated = [newRequest, ...current];
  saveToolRequests(updated);

  // Sync to Supabase in background
  submitToSupabase({
    tool_name: newRequest.toolName,
    category: newRequest.category,
    email: newRequest.requesterEmail,
    use_case: newRequest.description || newRequest.useCase || '',
  }).catch(() => {});

  return newRequest;
}

/**
 * Updates status of a tool request
 */
export function updateToolRequestStatus(id: string, newStatus: ToolRequestStatus): boolean {
  const current = getToolRequests();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return false;

  current[index].status = newStatus;
  saveToolRequests([...current]);

  const supabaseStatusMap: Record<ToolRequestStatus, any> = {
    new: 'pending',
    in_progress: 'in-review',
    completed: 'completed',
    declined: 'declined',
  };
  updateInSupabase(id, supabaseStatusMap[newStatus]).catch(() => {});

  return true;
}

/**
 * Adds an internal admin note to a tool request
 */
export function addToolRequestAdminNote(id: string, noteText: string, author = 'Admin'): ToolRequestNote | null {
  const trimmed = noteText.trim();
  if (!trimmed) return null;

  const current = getToolRequests();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const newNote: ToolRequestNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    text: trimmed,
    createdAt: new Date().toISOString(),
    author,
  };

  if (!current[index].adminNotes) {
    current[index].adminNotes = [];
  }
  current[index].adminNotes.push(newNote);
  saveToolRequests([...current]);
  return newNote;
}

/**
 * Deletes an admin note from a tool request
 */
export function deleteToolRequestAdminNote(requestId: string, noteId: string): boolean {
  const current = getToolRequests();
  const index = current.findIndex((item) => item.id === requestId);
  if (index === -1) return false;

  if (!current[index].adminNotes) return false;
  current[index].adminNotes = current[index].adminNotes.filter((n) => n.id !== noteId);
  saveToolRequests([...current]);
  return true;
}

/**
 * Deletes a tool request
 */
export function deleteToolRequest(id: string): boolean {
  const current = getToolRequests();
  const filtered = current.filter((item) => item.id !== id);
  if (filtered.length === current.length) return false;

  saveToolRequests(filtered);
  deleteInSupabase(id).catch(() => {});
  return true;
}

/**
 * Bulk updates status for multiple requests
 */
export function bulkUpdateToolRequestStatus(ids: string[], newStatus: ToolRequestStatus): number {
  if (ids.length === 0) return 0;
  const set = new Set(ids);
  const current = getToolRequests();
  let count = 0;

  for (const item of current) {
    if (set.has(item.id)) {
      item.status = newStatus;
      count++;
    }
  }

  if (count > 0) {
    saveToolRequests([...current]);
  }
  return count;
}

/**
 * Bulk deletes multiple requests
 */
export function bulkDeleteToolRequests(ids: string[]): number {
  if (ids.length === 0) return 0;
  const set = new Set(ids);
  const current = getToolRequests();
  const filtered = current.filter((item) => !set.has(item.id));
  const removed = current.length - filtered.length;

  if (removed > 0) {
    saveToolRequests(filtered);
  }
  return removed;
}

/**
 * Groups duplicate requests by normalized tool name.
 * Sorts them with most requested first by default.
 */
export function getGroupedToolRequests(requestsList?: ToolRequest[]): GroupedToolRequest[] {
  const source = requestsList || getToolRequests();
  const groupsMap = new Map<string, GroupedToolRequest>();

  for (const req of source) {
    const key = normalizeToolNameKey(req.toolName);
    const existing = groupsMap.get(key);

    if (existing) {
      existing.count += 1;
      existing.requests.push(req);
      existing.statusBreakdown[req.status] = (existing.statusBreakdown[req.status] || 0) + 1;
      existing.totalNotesCount += req.adminNotes?.length || 0;

      if (req.requesterEmail && !existing.requesters.includes(req.requesterEmail)) {
        existing.requesters.push(req.requesterEmail);
      }

      if (new Date(req.createdAt).getTime() > new Date(existing.latestDate).getTime()) {
        existing.latestDate = req.createdAt;
      }

      // Decide primary status priority: in_progress > new > completed > declined
      if (req.status === 'in_progress' || existing.primaryStatus !== 'in_progress') {
        if (req.status === 'in_progress') {
          existing.primaryStatus = 'in_progress';
        } else if (req.status === 'new' && existing.primaryStatus !== 'in_progress') {
          existing.primaryStatus = 'new';
        }
      }
    } else {
      const breakdown: Record<ToolRequestStatus, number> = {
        new: 0,
        in_progress: 0,
        completed: 0,
        declined: 0,
      };
      breakdown[req.status] = 1;

      groupsMap.set(key, {
        groupKey: key,
        toolName: req.toolName,
        category: req.category,
        count: 1,
        requests: [req],
        latestDate: req.createdAt,
        requesters: req.requesterEmail ? [req.requesterEmail] : [],
        statusBreakdown: breakdown,
        primaryStatus: req.status,
        totalNotesCount: req.adminNotes?.length || 0,
      });
    }
  }

  const grouped = Array.from(groupsMap.values());
  // Sort descending by count, then by latestDate
  grouped.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
  });

  return grouped;
}

/**
 * Returns aggregated statistics for the tool requests module
 */
export function getToolRequestsStats(): ToolRequestsStats {
  const requests = getToolRequests();
  const stats: ToolRequestsStats = {
    total: requests.length,
    newCount: 0,
    inProgress: 0,
    completed: 0,
    declined: 0,
    uniqueToolsCount: 0,
  };

  const nameSet = new Set<string>();

  for (const r of requests) {
    nameSet.add(normalizeToolNameKey(r.toolName));
    if (r.status === 'new') stats.newCount++;
    else if (r.status === 'in_progress') stats.inProgress++;
    else if (r.status === 'completed') stats.completed++;
    else if (r.status === 'declined') stats.declined++;
  }

  stats.uniqueToolsCount = nameSet.size;

  const grouped = getGroupedToolRequests(requests);
  if (grouped.length > 0) {
    stats.topRequestedTool = `${grouped[0].toolName} (${grouped[0].count} requests)`;
  }

  return stats;
}

/**
 * Resets storage back to initial seeds (useful for testing)
 */
export function resetToolRequestsToDefault(): void {
  saveToolRequests(INITIAL_SEED_REQUESTS);
}
