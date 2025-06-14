import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/auth';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface IncomingCallProps {
  onAccept: (roomId: string) => void;
  onReject: (roomId: string) => void;
}

export function IncomingCall({ onAccept, onReject }: IncomingCallProps) {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    roomId: string;
    callerId: string;
    callerName: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:4000/webrtc', {
      auth: {
        token: user.id,
      },
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
    });

    return () => {
      socket.off('incoming_call');
    };
  }, [socket]);

  const handleAccept = () => {
    if (incomingCall) {
      onAccept(incomingCall.roomId);
      setIncomingCall(null);
    }
  };

  const handleReject = () => {
    if (incomingCall) {
      onReject(incomingCall.roomId);
      setIncomingCall(null);
    }
  };

  if (!incomingCall) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 w-80 bg-white shadow-lg z-50">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-semibold">Incoming Call</h3>
          <p className="text-sm text-gray-600">
            From: {incomingCall.callerName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={handleAccept}
          >
            Accept
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleReject}
          >
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
} 