import { useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface StartCallProps {
  onCallStarted: (roomId: string) => void;
}

export function StartCall({ onCallStarted }: StartCallProps) {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [recipientId, setRecipientId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleStartCall = () => {
    if (!user || !recipientId) return;

    const roomId = [user.id, recipientId].sort().join('-');
    
    if (!socket) {
      const newSocket = io('http://localhost:4000/webrtc', {
        auth: {
          token: user.id,
        },
      });
      setSocket(newSocket);
    }

    socket?.emit('start_call', {
      roomId,
      recipientId,
      callerId: user.id,
      callerName: user.username,
    });

    onCallStarted(roomId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Start Call</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient ID</Label>
            <Input
              id="recipient"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Enter recipient's ID"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleStartCall}
            disabled={!recipientId}
          >
            Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 