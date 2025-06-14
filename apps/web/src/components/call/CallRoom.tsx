import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/auth';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface PeerConnection {
  peerId: string;
  stream: MediaStream;
}

export function CallRoom({ roomId }: { roomId: string }) {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

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
      stopCall();
    };
  }, [user]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setIsCallActive(true);

      if (socket && user) {
        socket.emit('join_call', {
          roomId,
          userId: user.id,
          username: user.username,
        });
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const stopCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    setPeers([]);
    setIsCallActive(false);

    if (socket && user) {
      socket.emit('leave_call', { roomId, userId: user.id });
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('user_joined_call', async ({ userId, username }) => {
      if (!localStreamRef.current) return;

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      peerConnectionsRef.current.set(userId, peerConnection);

      // Add local stream
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });

      // Handle incoming stream
      peerConnection.ontrack = (event) => {
        setPeers((prev) => [
          ...prev,
          { peerId: userId, stream: event.streams[0] },
        ]);
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('signal', {
        roomId,
        userId: user?.id,
        username: user?.username,
        signal: offer,
      });
    });

    socket.on('signal', async ({ userId, signal }) => {
      const peerConnection = peerConnectionsRef.current.get(userId);
      if (!peerConnection) return;

      if (signal.type === 'offer') {
        await peerConnection.setRemoteDescription(signal);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal', {
          roomId,
          userId: user?.id,
          username: user?.username,
          signal: answer,
        });
      } else if (signal.type === 'answer') {
        await peerConnection.setRemoteDescription(signal);
      } else if (signal.type === 'candidate') {
        await peerConnection.addIceCandidate(signal);
      }
    });

    socket.on('user_left_call', ({ userId }) => {
      const peerConnection = peerConnectionsRef.current.get(userId);
      if (peerConnection) {
        peerConnection.close();
        peerConnectionsRef.current.delete(userId);
      }
      setPeers((prev) => prev.filter((p) => p.peerId !== userId));
    });

    return () => {
      socket.off('user_joined_call');
      socket.off('signal');
      socket.off('user_left_call');
    };
  }, [socket, user, roomId]);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Video Call</h2>
        {!isCallActive ? (
          <Button onClick={startCall}>Start Call</Button>
        ) : (
          <Button variant="destructive" onClick={stopCall}>
            End Call
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {localStreamRef.current && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={(video) => {
                if (video) video.srcObject = localStreamRef.current;
              }}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              You
            </div>
          </div>
        )}

        {peers.map((peer) => (
          <div
            key={peer.peerId}
            className="relative aspect-video bg-black rounded-lg overflow-hidden"
          >
            <video
              ref={(video) => {
                if (video) video.srcObject = peer.stream;
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {peer.peerId}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 