'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatWindow } from '../../../components/chat/ChatWindow';
import { IncomingCall } from '../../../components/call/IncomingCall';
import { StartCall } from '../../../components/call/StartCall';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);

  const handleCallStarted = (roomId: string) => {
    setActiveCallRoomId(roomId);
    router.push(`/call/${roomId}`);
  };

  const handleAcceptCall = (roomId: string) => {
    setActiveCallRoomId(roomId);
    router.push(`/call/${roomId}`);
  };

  const handleRejectCall = (roomId: string) => {
    setActiveCallRoomId(null);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <StartCall onCallStarted={handleCallStarted} />
      </div>
      <ChatWindow chatId={chatId} />
      <IncomingCall
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </div>
  );
} 