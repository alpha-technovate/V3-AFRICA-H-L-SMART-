"use client";

export default function MessagesPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-teal-700">Messages</h1>
      <p className="text-gray-600">Direct messages, AI chats, reminders and notifications will appear here.</p>
      <div className="p-4 border rounded text-gray-500">
        No messages yet.
      </div>
    </div>
  );
}
