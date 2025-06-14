import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import { useAuthStore } from './store/auth';

interface Message {
  content: string;
  userId: string;
  username: string;
  timestamp: string;
}

interface User {
  userId: string;
  username: string;
}

function HomePage() {
  const { user, isLoading, signOut } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:4001');
    setSocket(newSocket);
    setConnectionStatus('connecting');

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionStatus('disconnected');
    });

    // Chat event listeners
    newSocket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('user_joined', (user: User) => {
      setUsers((prev) => [...prev, user]);
    });

    newSocket.on('user_left', (user: User) => {
      setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
    });

    newSocket.on('room_users', (roomUsers: User[]) => {
      setUsers(roomUsers);
    });

    // Join general room for testing
    newSocket.emit('join_room', { 
      roomId: 'general', 
      username: user?.username || 'Anonymous' 
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    socket.emit('send_message', {
      content: message,
      roomId: 'general',
      userId: socket.id,
      username: user?.username || 'Anonymous',
    });

    setMessage('');
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-400';
      case 'connecting': return 'bg-amber-400';
      case 'disconnected': return 'bg-red-400';
      default: return 'bg-slate-400';
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected': return { text: 'Connected', color: 'text-emerald-600' };
      case 'connecting': return { text: 'Connecting...', color: 'text-amber-600' };
      case 'disconnected': return { text: 'Disconnected', color: 'text-red-600' };
      default: return { text: 'Unknown', color: 'text-slate-600' };
    }
  };

  const status = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg sm:text-xl font-bold">💬</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                RealTime Chat
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm hidden sm:block">Connect and chat in real-time</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-full border border-white/50 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${getConnectionColor()} animate-pulse`}></div>
              <span className={`text-xs sm:text-sm font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>
            
            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-full border border-white/50">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                    👋 {user.username}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  className="bg-white/70 backdrop-blur-sm border-white/50 hover:bg-white/90 text-xs sm:text-sm px-3 sm:px-4"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                asChild
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg text-xs sm:text-sm px-4 sm:px-6"
              >
                <a href="/auth">Sign In</a>
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile Status Bar */}
        <div className="lg:hidden mb-4">
          <Card className="bg-white/70 backdrop-blur-sm border-white/50 shadow-sm">
            <div className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getConnectionColor()} animate-pulse`}></div>
                  <span className={`font-medium ${status.color}`}>{status.text}</span>
                </div>
                <div className="text-slate-600">
                  {users.length} {users.length === 1 ? 'user' : 'users'} online
                </div>
              </div>
              <div className="text-slate-500">
                {messages.length} messages
              </div>
            </div>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-16rem)] sm:h-[calc(100vh-12rem)]">
          {/* Chat Area */}
          <div className="lg:col-span-8 order-1">
            <Card className="h-full flex flex-col bg-white/70 backdrop-blur-sm border-white/50 shadow-xl animate-slideUp">
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">General Chat</h2>
                    <p className="text-sm text-slate-500">
                      {users.length} {users.length === 1 ? 'person' : 'people'} online
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600">Live</span>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-white text-2xl">💬</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No messages yet</h3>
                    <p className="text-slate-500 max-w-sm">
                      Start the conversation! Your messages will appear here in real-time.
                    </p>
                    <div className="mt-4 flex items-center space-x-2 text-sm text-slate-400">
                      <span>Status: {connectionStatus}</span>
                      <span>•</span>
                      <span>{users.length} online</span>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.userId === socket?.id ? 'justify-end' : 'justify-start'} message-appear`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                          msg.userId === socket?.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'bg-white border border-slate-200'
                        }`}
                      >
                        <div className={`text-xs font-medium mb-1 ${
                          msg.userId === socket?.id ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {msg.username}
                        </div>
                        <div className={`${
                          msg.userId === socket?.id ? 'text-white' : 'text-slate-800'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`text-xs mt-1 ${
                          msg.userId === socket?.id ? 'text-blue-200' : 'text-slate-400'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-6 border-t border-slate-200/50">
                <form onSubmit={sendMessage} className="flex space-x-3">
                  <div className="flex-1">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={connectionStatus === 'connected' ? "Type your message..." : "Connecting..."}
                      disabled={connectionStatus !== 'connected'}
                      className="bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl px-4 py-3"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={connectionStatus !== 'connected' || !message.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg px-6 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Send
                  </Button>
                </form>
              </div>
            </Card>
          </div>
          
          {/* Sidebar - Hidden on mobile, shown on lg+ */}
          <div className="hidden lg:block lg:col-span-4 order-2 lg:order-2 space-y-4 lg:space-y-6">
            {/* Online Users */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/50 shadow-xl animate-fadeIn">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">Online Users</h3>
                  <div className="bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {users.length}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-slate-400 text-xl">👥</span>
                      </div>
                      <p className="text-sm text-slate-500">No users online</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl border border-white/50 hover:bg-white/70 transition-colors"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white text-sm font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-800">{user.username}</div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span className="text-xs text-slate-500">Online</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
            
            {/* Status Dashboard */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/50 shadow-xl animate-fadeIn" style={{animationDelay: '0.2s'}}>
              <div className="p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Status Dashboard</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 text-sm">🔗</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">Connection</span>
                    </div>
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">👤</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">Authentication</span>
                    </div>
                    <span className={`text-sm font-medium ${user ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {user ? 'Signed In' : 'Anonymous'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-sm">💬</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">Messages</span>
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {messages.length}
                    </span>
                  </div>
                  
                  {socket?.id && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                      <div className="text-xs text-slate-500 mb-1">Socket ID</div>
                      <div className="text-xs font-mono text-slate-600 break-all">
                        {socket.id}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const { user } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="bg-white/70 backdrop-blur-sm border-white/50 shadow-2xl">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-2xl">🔐</span>
            </div>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Authentication
            </h1>
            
            <p className="text-slate-600 mb-6">
              {user ? `Welcome back, ${user.username}!` : 'Sign in to unlock all features'}
            </p>
            
            <div className="bg-blue-50 border border-blue-200/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                🚀 Authentication components coming soon. For now, you can chat anonymously!
              </p>
            </div>
            
            <Button 
              asChild
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              <a href="/">← Back to Chat</a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App; 