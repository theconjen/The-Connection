import { useState, useEffect } from "react";

export default function DMs({ otherUserId }: { otherUserId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");

  // Fetch DMs
  useEffect(() => {
    fetch(`/api/dms/${otherUserId}`)
      .then((res) => res.json())
      .then(setMessages);
  }, [otherUserId]);

  // Send message
  async function sendMessage() {
    await fetch("/api/dms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: otherUserId, content }),
    });
    setContent("");
    const res = await fetch(`/api/dms/${otherUserId}`);
    setMessages(await res.json());
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Direct Messages</h2>
      <div className="border rounded p-2 mb-3 max-h-80 overflow-y-auto bg-gray-50">
        {messages.map((m) => (
          <div key={m.id} className={`p-2 mb-1 ${m.senderId === "currentUserId" ? "text-right" : ""}`}>
            <span className="block">{m.content}</span>
            <span className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-2 flex-1 rounded-l"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded-r">
          Send
        </button>
      </div>
    </div>
  );
}