'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { ChatLayout } from '../../../components/layout/ChatLayout';

export default function NewChatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username) return;

    setIsLoading(true);
    setError('');

    try {
      // Find user by username
      const { data: otherUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (userError || !otherUser) {
        setError('User not found');
        return;
      }

      if (otherUser.id === user.id) {
        setError('Cannot start a chat with yourself');
        return;
      }

      // Check if chat already exists
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUser.id}),and(user1_id.eq.${otherUser.id},user2_id.eq.${user.id})`)
        .single();

      if (chatError && chatError.code !== 'PGRST116') {
        throw chatError;
      }

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
        return;
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          user1_id: user.id,
          user2_id: otherUser.id,
          name: username,
        })
        .select()
        .single();

      if (createError) throw createError;

      router.push(`/chat/${newChat.id}`);
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatLayout>
      <div className="container max-w-2xl mx-auto p-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">New Chat</h1>
            <p className="text-muted-foreground">
              Start a new conversation with another user
            </p>
          </div>

          <form onSubmit={handleCreateChat} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !username}
            >
              {isLoading ? 'Creating...' : 'Start Chat'}
            </Button>
          </form>
        </div>
      </div>
    </ChatLayout>
  );
} 