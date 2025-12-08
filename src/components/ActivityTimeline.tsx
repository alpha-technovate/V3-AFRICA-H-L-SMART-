"use client";

import { Clock, FileText, Stethoscope, HeartPulse, Bot, Upload } from "lucide-react";

interface TimelineItem {
  id?: string;
  type: string;
  title: string;
  description: string;
  timestamp: string | Date;
}

export default function ActivityTimeline({ items = [] }: { items: TimelineItem[] }) {
  if (!Array.isArray(items)) items = [];

  const icons: any = {
    note: FileText,
    consultation: Stethoscope,
    vitals: HeartPulse,
    ai: Bot,
    upload: Upload,
    default: Clock,
  };

  return (
    <div className="space-y-6">
      {items.length === 0 && (
        <div className="text-gray-400 text-sm">No recent activity recorded.</div>
      )}

      {items.map((item, idx) => {
        const Icon = icons[item.type] || icons.default;

        return (
          <div key={idx} className="flex gap-4 items-start">
            {/* Icon */}
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600 shadow-inner">
              <Icon size={22} />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{item.title}</h4>
              <p className="text-gray-600 text-sm">{item.description}</p>
              <p className="text-gray-400 text-xs mt-1">
                {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
