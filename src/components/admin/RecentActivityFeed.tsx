import { useState, useEffect } from 'react';
import { getAllDBCustomTools } from '../../services/toolStorageDB';
import { getToolRequests, TOOL_REQUESTS_CHANGED_EVENT } from '../../services/toolRequestsService';
import { getAllCommentsFromStorage, COMMENTS_CHANGED_EVENT } from '../../services/commentModerationService';
import { MessageSquare, Sparkles, PlusCircle, CheckCircle, Clock, FolderArchive } from 'lucide-react';

export type ActivityType = 'comment' | 'request' | 'tool_added';

export interface RealActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  targetName: string;
  description: string;
  authorName: string;
  timestamp: string;
  rawDate: number;
  status: 'approved' | 'pending' | 'in_review' | 'active';
}

export function RecentActivityFeed() {
  const [filter, setFilter] = useState<'all' | ActivityType>('all');
  const [activities, setActivities] = useState<RealActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRealActivities = async () => {
    try {
      const [customTools, requests, comments] = await Promise.all([
        getAllDBCustomTools(),
        Promise.resolve(getToolRequests()),
        Promise.resolve(getAllCommentsFromStorage()),
      ]);

      const items: RealActivityItem[] = [];

      // 1. Real custom tools added
      for (const tool of customTools) {
        const createdDate = new Date(tool.createdAt || Date.now());
        items.push({
          id: `tool-${tool.id || tool.slug}`,
          type: 'tool_added',
          title: `Tool Added: ${tool.name}`,
          targetName: tool.category,
          description: tool.description || 'Custom embedded utility package uploaded.',
          authorName: 'Admin',
          timestamp: createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          rawDate: createdDate.getTime(),
          status: tool.status === 'active' ? 'active' : 'pending',
        });
      }

      // 2. Real user requests
      for (const req of requests) {
        const reqDate = new Date(req.createdAt || Date.now());
        items.push({
          id: `req-${req.id}`,
          type: 'request',
          title: `Requested: ${req.toolName}`,
          targetName: req.category || 'General',
          description: req.useCase || 'User requested new utility.',
          authorName: req.requesterName || req.requesterEmail || 'Site Visitor',
          timestamp: reqDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawDate: reqDate.getTime(),
          status: req.status === 'completed' ? 'approved' : req.status === 'in_progress' ? 'in_review' : 'pending',
        });
      }

      // 3. Real user comments
      for (const com of comments) {
        const comDate = new Date(com.createdAt || Date.now());
        items.push({
          id: `com-${com.id}`,
          type: 'comment',
          title: `Comment on ${com.toolSlug}`,
          targetName: com.toolSlug,
          description: com.commentText,
          authorName: com.authorName,
          timestamp: comDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawDate: comDate.getTime(),
          status: com.status === 'approved' ? 'approved' : 'pending',
        });
      }

      // Sort newest first
      items.sort((a, b) => b.rawDate - a.rawDate);
      setActivities(items);
    } catch (err) {
      console.warn('Failed to load recent activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRealActivities();

    const handleUpdate = () => loadRealActivities();
    window.addEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleUpdate);
    window.addEventListener(COMMENTS_CHANGED_EVENT, handleUpdate);
    window.addEventListener('onlinetools_tools_updated', handleUpdate);

    return () => {
      window.removeEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleUpdate);
      window.removeEventListener(COMMENTS_CHANGED_EVENT, handleUpdate);
      window.removeEventListener('onlinetools_tools_updated', handleUpdate);
    };
  }, []);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter((a) => a.type === filter);

  const getStatusBadge = (status: RealActivityItem['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-full border border-[#DDD6FE]">
            <Clock className="w-3 h-3" />
            <span>In Review</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-full border border-[#DDD6FE]">
            <CheckCircle className="w-3 h-3" />
            <span>Live Active</span>
          </span>
        );
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'comment':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        );
      case 'request':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        );
      case 'tool_added':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
            <FolderArchive className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div
      id="recent-activity-feed-card"
      className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-xs transition-colors"
    >
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-heading font-bold text-[#1E1035]">
            Recent Activity Feed
          </h2>
          <p className="text-xs text-[#6D6582] mt-0.5">
            Real-time live submissions, tool uploads, and requests
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#7C3AED] text-[#FFFFFF]'
                : 'text-[#6D6582] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
            }`}
          >
            All Activity ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('comment')}
            className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-colors cursor-pointer ${
              filter === 'comment'
                ? 'bg-[#7C3AED] text-[#FFFFFF]'
                : 'text-[#6D6582] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
            }`}
          >
            Comments ({activities.filter((a) => a.type === 'comment').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('request')}
            className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-colors cursor-pointer ${
              filter === 'request'
                ? 'bg-[#7C3AED] text-[#FFFFFF]'
                : 'text-[#6D6582] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
            }`}
          >
            Requests ({activities.filter((a) => a.type === 'request').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('tool_added')}
            className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-colors cursor-pointer ${
              filter === 'tool_added'
                ? 'bg-[#7C3AED] text-[#FFFFFF]'
                : 'text-[#6D6582] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
            }`}
          >
            Tools Added ({activities.filter((a) => a.type === 'tool_added').length})
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-[#EDE9FE]">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#6D6582]">
            Loading real activity records...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6D6582] space-y-1">
            <p className="font-heading font-semibold text-[#1E1035]">No activity logged yet</p>
            <p className="text-[11px] text-[#9D95B3]">
              Real activities (tool uploads, visitor requests, and comments) will appear here live.
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="py-3 flex items-start justify-between gap-3 hover:bg-[#FAF9FE] px-2 rounded-xl transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                {getActivityIcon(activity.type)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-heading font-semibold text-[#1E1035]">
                      {activity.title}
                    </span>
                    <span className="text-[11px] text-[#9D95B3]">
                      in <span className="text-[#6D6582] font-medium">{activity.targetName}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#6D6582] mt-0.5 line-clamp-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9D95B3]">
                    <span>By {activity.authorName}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-0.5">
                {getStatusBadge(activity.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
