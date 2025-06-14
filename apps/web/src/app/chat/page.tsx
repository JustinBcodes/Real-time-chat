'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth';
import { ChatLayout } from '../../components/layout/ChatLayout';
import { StartCall } from '../../components/call/StartCall';
import { IncomingCall } from '../../components/call/IncomingCall';

export default function ChatIndexPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  const handleCallStarted = (roomId: string) => {
    router.push(`/call/${roomId}`);
  };

  const handleAcceptCall = (roomId: string) => {
    router.push(`/call/${roomId}`);
  };

  const handleRejectCall = (roomId: string) => {
    // Handle call rejection
  };

  if (isLoading || !user) {
    return null;
  }

  return (
    <ChatLayout>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to the Chat App</h1>
          <p className="mt-2 text-gray-600">
            Select a chat from the sidebar or start a new one
          </p>
          <div className="mt-6">
            <StartCall onCallStarted={handleCallStarted} />
          </div>
        </div>
        <IncomingCall
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      </div>
    </ChatLayout>
  );
} 