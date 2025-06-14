import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LogOut, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Chat {
  id: string;
  name: string;
  lastMessage?: string;
  updatedAt: string;
}

export function Sidebar() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch user's chats
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      setChats(data || []);
    };

    fetchChats();

    // Subscribe to chat updates
    const channel = supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user1_id=eq.${user.id} OR user2_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setChats((prev) => [payload.new as Chat, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === payload.new.id ? (payload.new as Chat) : chat
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setChats((prev) => prev.filter((chat) => chat.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  const handleNewChat = () => {
    router.push('/new-chat');
  };

  if (!user) return null;

  return (
    <div className="w-80 border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.username}</span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-1 p-2">
          {chats.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => router.push(`/chat/${chat.id}`)}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {chat.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{chat.name}</span>
                {chat.lastMessage && (
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {chat.lastMessage}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 