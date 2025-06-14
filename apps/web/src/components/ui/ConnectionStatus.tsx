import { useEffect, useState } from 'react';
import { socket, connectSockets, disconnectSockets } from '../../lib/socket';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onPong() {
      setLastPong(new Date().toISOString());
    }

    // Connect to socket
    connectSockets();

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('pong', onPong);

    // Ping every 10 seconds
    const interval = setInterval(() => {
      socket.emit('ping');
    }, 10000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('pong', onPong);
      clearInterval(interval);
      disconnectSockets();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-md text-xs">
      <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      {lastPong && <p>Last pong: {lastPong}</p>}
    </div>
  );
} 