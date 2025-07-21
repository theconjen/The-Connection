import { useState, useEffect, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import io, { Socket } from 'socket.io-client';

export default function DMs() {
  const params = useParams();
  const userIdFromUrl = params.userId;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const socketRef = useRef<Socket | null>(null);
  
  // Get current user data
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    retry: false
  });

  // Fetch DMs when component mounts or userId changes
  useEffect(() => {
    if (!userIdFromUrl) return;
    
    fetch(`/api/dms/${userIdFromUrl}`)
      .then((res) => res.json())
      .then(setMessages)
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setMessages([]);
      });
  }, [userIdFromUrl]);

  // Socket.IO connection
  useEffect(() => {
    if (!user?.id) return;

    const socket = io({
      path: '/socket.io/'
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket.IO');
      socket.emit('join', user.id);
    });

    socket.on('new_message', (message: any) => {
      // Only add message if it's from the current conversation
      if (userIdFromUrl && (message.senderId.toString() === userIdFromUrl || message.receiverId.toString() === userIdFromUrl)) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('message_error', (error: any) => {
      console.error('Message error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, userIdFromUrl]);

  // Send message
  async function sendMessage() {
    if (!content.trim() || !user?.id || !userIdFromUrl || !socketRef.current) return;

    // Use Socket.IO for real-time messaging
    socketRef.current.emit('send_message', {
      senderId: user.id,
      receiverId: userIdFromUrl,
      content: content.trim()
    });

    setContent("");
  }

  if (!userIdFromUrl) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Direct Messages</h2>
        <p className="text-gray-600">No user specified for conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-bold">Chat with User {userIdFromUrl}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex ${m.senderId.toString() === user?.id?.toString() ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  m.senderId.toString() === user?.id?.toString()
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <div>{m.content}</div>
                <div className={`text-xs mt-1 ${
                  m.senderId.toString() === user?.id?.toString() 
                    ? "text-blue-100" 
                    : "text-gray-500"
                }`}>
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            disabled={!user?.id}
          />
          <button 
            onClick={sendMessage} 
            disabled={!content.trim() || !user?.id || !userIdFromUrl}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}