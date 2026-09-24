import { useState } from 'react';
import { RECENT_ACTIVITIES, AdminActivity, ActivityType } from '../../data/adminOverviewData';
import { MessageSquare, Sparkles, PlusCircle, CheckCircle, Clock } from 'lucide-react';

export function RecentActivityFeed() {
  const [filter, setFilter] = useState<'all' | ActivityType>('all');

  const filteredActivities = filter === 'all'
    ? RECENT_ACTIVITIES
    : RECENT_ACTIVITIES.filter((a) => a.type === filter);

  const getStatusBadge = (status: AdminActivity['status']) => {
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
            <span>Needs Review</span>
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
            <span>Published</span>
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
          <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center shrink-0">
            <PlusCircle className="w-3.5 h-3.5" />
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
            Real-time submissions, user reviews, and system events
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
            All Activity
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
            Comments
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
            Requests
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
            Tools Added
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-[#EDE9FE]">
        {filteredActivities.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6D6582]">
            No activity found for selected filter.
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
