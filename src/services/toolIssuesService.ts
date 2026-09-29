/**
 * OnlineTools Tool Issues & Bug Reporting Service
 * Stores user-reported bugs, non-working functions, or issues for any tool.
 */

export interface ToolIssue {
  id: string;
  toolSlug: string;
  toolName: string;
  issueType: 'calculation_incorrect' | 'button_not_working' | 'layout_broken' | 'performance_slow' | 'other';
  description: string;
  inputValues?: string;
  expectedBehavior?: string;
  userEmail?: string;
  createdAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
}

const STORAGE_KEY = 'onlinetools_tool_issues_v1';
export const TOOL_ISSUES_CHANGED_EVENT = 'onlinetools_tool_issues_changed';

export function getAllToolIssues(): ToolIssue[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read tool issues', err);
    return [];
  }
}

export function submitToolIssue(data: {
  toolSlug: string;
  toolName: string;
  issueType: ToolIssue['issueType'];
  description: string;
  inputValues?: string;
  expectedBehavior?: string;
  userEmail?: string;
}): ToolIssue {
  const issues = getAllToolIssues();
  const newIssue: ToolIssue = {
    id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    toolSlug: data.toolSlug,
    toolName: data.toolName,
    issueType: data.issueType,
    description: data.description,
    inputValues: data.inputValues,
    expectedBehavior: data.expectedBehavior,
    userEmail: data.userEmail,
    createdAt: new Date().toISOString(),
    status: 'open',
  };

  const updated = [newIssue, ...issues];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(TOOL_ISSUES_CHANGED_EVENT, { detail: { issue: newIssue } }));
  }
  return newIssue;
}

export function updateToolIssueStatus(id: string, status: ToolIssue['status'], adminNotes?: string): void {
  const issues = getAllToolIssues();
  const updated = issues.map((iss) => {
    if (iss.id === id) {
      return {
        ...iss,
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      };
    }
    return iss;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(TOOL_ISSUES_CHANGED_EVENT));
  }
}

export function deleteToolIssue(id: string): void {
  const issues = getAllToolIssues();
  const updated = issues.filter((iss) => iss.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(TOOL_ISSUES_CHANGED_EVENT));
  }
}
