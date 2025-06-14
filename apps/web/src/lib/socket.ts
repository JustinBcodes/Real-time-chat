import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001';

// Create a socket instance for general communication
export const socket = io(SERVER_URL, {
  transports: ['websocket'],
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Create a socket instance for WebRTC communication
export const webRTCSocket = io(`${SERVER_URL}/webrtc`, {
  transports: ['websocket'],
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connect to sockets
export const connectSockets = () => {
  socket.connect();
  webRTCSocket.connect();
};

// Disconnect from sockets
export const disconnectSockets = () => {
  socket.disconnect();
  webRTCSocket.disconnect();
};

// Check if sockets are connected
export const areSocketsConnected = () => {
  return socket.connected && webRTCSocket.connected;
}; 