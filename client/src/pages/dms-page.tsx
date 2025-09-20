import { useState, useEffect, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import io, { Socket } from 'socket.io-client';
import { User } from "@shared/schema";

export default function DMsPage() {
  const { userId: userIdFromUrl } = useParams<{ userId: string }>() ?? {};
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  
  // Get current user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false
  });

  // Fetch user conversations (simple list for now)
  useEffect(() => {
    if (!user?.id) return;
    
    // For demo purposes, create a simple conversation list
    // In a real app, this would come from an API endpoint
    setConversations([
      { id: "1", name: "John Doe", lastMessage: "Hey there!" },
      { id: "2", name: "Jane Smith", lastMessage: "How are you?" },
      { id: "15", name: "Admin", lastMessage: "Welcome to The Connection!" }
    ]);

    // If there's a userId in the URL, automatically select that conversation
    if (userIdFromUrl) {
      setSelectedUserId(userIdFromUrl);
    }
  }, [user?.id, userIdFromUrl]);

  // Fetch DMs when user is selected
  useEffect(() => {
    if (!selectedUserId) return;
    
    fetch(`/api/dms/${selectedUserId}`)
      .then((res) => res.json())
      .then(setMessages)
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setMessages([]);
      });
  }, [selectedUserId]);

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
      if (selectedUserId && (message.senderId.toString() === selectedUserId || message.receiverId.toString() === selectedUserId)) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('message_error', (error: any) => {
      console.error('Message error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, selectedUserId]);

  // Send message
  async function sendMessage() {
    if (!content.trim() || !user?.id || !selectedUserId || !socketRef.current) return;

    // Use Socket.IO for real-time messaging
    socketRef.current.emit('send_message', {
      senderId: user.id,
      receiverId: selectedUserId,
      content: content.trim()
    });

    setContent("");
  }

  return (
    <div className="flex h-[calc(100vh-280px)] max-w-6xl mx-auto p-4 gap-4">
      {/* Conversations List */}
      <div className="w-1/3 border rounded-lg p-4 bg-white">
        <h2 className="text-xl font-bold mb-4">Conversations</h2>
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setSelectedUserId(conv.id)}
              className={`p-3 rounded cursor-pointer border ${
                selectedUserId === conv.id 
                  ? 'bg-blue-100 border-blue-300' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold">{conv.name}</div>
              <div className="text-sm text-gray-600 truncate">{conv.lastMessage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 border rounded-lg bg-white flex flex-col">
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">
                {conversations.find(c => c.id === selectedUserId)?.name || `User ${selectedUserId}`}
              </h3>
              {userIdFromUrl && (
                <p className="text-sm text-gray-600">Direct conversation</p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
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
            <div className="p-4 border-t">
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
                  disabled={!content.trim() || !user?.id || !selectedUserId}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}