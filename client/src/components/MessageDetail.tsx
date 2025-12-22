import React from 'react';

export function MessageDetail({ onBack, user }: { onBack?: () => void; user?: any }) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="text-sm text-blue-600 mb-2">Back</button>
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h3 className="font-semibold">{user?.name || 'Conversation'}</h3>
        <p className="text-sm text-gray-500">Message thread preview (stub)</p>
      </div>
    </div>
  );
}
