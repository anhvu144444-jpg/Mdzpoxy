import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageSquare, SendHorizontal, X, MessageCircle } from 'lucide-react';
import { syncService } from '../lib/syncService';

export default function ChatWidget({ username, chatMessages, setChatMessages, isAdmin = false }: { username: string, chatMessages: any[], setChatMessages: React.Dispatch<React.SetStateAction<any[]>>, isAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [fakeMessages, setFakeMessages] = useState<any[]>([]);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(chatMessages?.length || 0);

  useEffect(() => {
    const fakeUsers = ['Hải Dứt', 'GameThucTri', 'Bé Chanh', 'NamBlue', 'Linh Ngọc', '******99', 'SátThủ***', 'Gà Rừng', 'Khá Bảnh', 'Độ MixiFake', 'Thầy Giáo***'];
    const fakeTexts = [
        'Mod xịn quá admin ơi',
        'Có ai hướng dẫn tải không ạ',
        'Đã đổi thành công mod súng',
        'Bao giờ có mod skin FF nạp thẻ?',
        'Ad duyệt nạp cho em với',
        'Vừa làm xong nhiệm vụ',
        'Test thử xem ok ko',
        '10 điểm cho hệ thống',
        'Hôm nay đông ghê',
        'Ai kéo rank với',
        'Uy tín nha mn'
    ];

    const generateFakeMessage = () => {
        const sender = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
        const content = fakeTexts[Math.floor(Math.random() * fakeTexts.length)];
        const now = new Date();
        const time = now.toLocaleTimeString('vi-VN');
        return {
            id: `fake-${Date.now()}-${Math.random()}`,
            sender,
            content,
            time,
            isAdmin: false,
            isFake: true
        };
    };

    const interval = setInterval(() => {
        setFakeMessages(prev => {
            const newMsg = generateFakeMessage();
            if (!isOpen) {
               setUnreadCount(c => c + 1);
            }
            return [...prev, newMsg].slice(-50); // Keep last 50 fake messages to avoid memory leak
        });
    }, 6000); // 1 message every 6 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && chatMessages?.length > prevMessagesLength.current) {
        setUnreadCount(c => c + (chatMessages.length - prevMessagesLength.current));
    }
    prevMessagesLength.current = chatMessages?.length || 0;
  }, [chatMessages, isOpen]);

  const displayMessages = useMemo(() => {
      const realMsgs = chatMessages || [];
      const combined = [...realMsgs, ...fakeMessages].sort((a, b) => {
          if (a.created_at && !b.created_at) return -1;
          if (!a.created_at && b.created_at) return 1;
          return 0; 
      });
      return combined.sort((a, b) => a.time.localeCompare(b.time));
  }, [chatMessages, fakeMessages]);

  useEffect(() => {
    if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [displayMessages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !username) return;
    
    const content = inputValue.trim();
    setInputValue('');
    
    const senderIsAdmin = !!isAdmin;
    await syncService.sendChatMessage(username, content, senderIsAdmin);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleChat = () => {
      setIsOpen(!isOpen);
      if (!isOpen) {
          setUnreadCount(0);
      }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {isOpen && (
           <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-80 h-[500px] max-h-[80vh] mb-4 animate-in slide-in-from-bottom-5">
              <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
                  <h3 className="font-bold flex items-center text-sm">
                      <MessageSquare size={16} className="mr-2 text-cyan-400" />
                      Box Chat Cộng Đồng
                  </h3>
                  <div className="flex items-center space-x-2">
                       <span className="text-[10px] text-green-400 font-mono">142 online</span>
                      <button onClick={toggleChat} className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                          <X size={18} />
                      </button>
                  </div>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-3" ref={chatBoxRef}>
                  {displayMessages?.map((msg) => (
                      <div key={msg.id} className={`flex items-start space-x-2 ${msg.sender === username ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-black text-[10px] ${msg.isAdmin ? 'bg-blue-500' : (msg.sender === username ? 'bg-cyan-500' : 'bg-white')}`}>
                              {msg.sender?.[0]?.toUpperCase()}
                          </div>
                          <div className={`${msg.isAdmin ? 'bg-white rounded-tl-none' : (msg.sender === username ? 'bg-cyan-900/30 border border-cyan-500/30 rounded-tr-none' : 'bg-white rounded-tl-none')} p-2 rounded-xl text-sm max-w-[85%]`}>
                              <div className="flex justify-between items-center mb-1 space-x-2">
                                  <p className={`text-[11px] font-bold ${msg.isAdmin ? 'text-blue-400' : (msg.sender === username ? 'text-cyan-400' : 'text-gray-600')}`}>
                                      {msg.isAdmin ? 'ADMIN MDZPX' : (msg.sender === username ? msg.sender : (`${'*'.repeat(Math.max(0, (msg.sender?.length || 0) - 2))}${msg.sender?.slice(-2)}`))} {msg.isAdmin && '✓'}
                                  </p>
                                  <p className="text-[9px] text-gray-500">{msg.time}</p>
                              </div>
                              <p className="text-xs break-words">{msg.content}</p>
                          </div>
                      </div>
                  ))}
              </div>
              
              <div className="p-3 bg-white border-t border-gray-200 flex space-x-2">
                  <input 
                      type="text" 
                      placeholder={username ? "Nhập tin nhắn..." : "Đăng nhập để chat..."} 
                      className="flex-1 bg-white rounded-full px-3 py-1.5 text-xs focus:outline-none border border-gray-200 focus:border-cyan-500 transition-colors"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!username}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!username || !inputValue.trim()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${(!username || !inputValue.trim()) ? 'bg-white text-gray-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer'}`}
                  >
                      <SendHorizontal size={14} />
                  </button>
              </div>
          </div>
        )}
        <button 
           onClick={toggleChat}
           className="w-14 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-full shadow-lg flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 relative"
        >
           <MessageCircle size={28} />
           {unreadCount > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                 {unreadCount > 99 ? '99+' : unreadCount}
              </span>
           )}
        </button>
      </div>
    </>
  );
}
