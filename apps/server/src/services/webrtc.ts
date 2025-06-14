import { Server } from 'socket.io';
import { z } from 'zod';

const callSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
  username: z.string(),
  signal: z.any(),
});

export function initializeWebRTC(io: Server) {
  const activeCalls = new Map<string, Set<string>>();

  io.of('/webrtc').on('connection', (socket) => {
    console.log('WebRTC client connected:', socket.id);

    socket.on('join_call', async ({ roomId, userId, username }) => {
      socket.join(roomId);
      
      // Add user to active calls
      if (!activeCalls.has(roomId)) {
        activeCalls.set(roomId, new Set());
      }
      activeCalls.get(roomId)?.add(userId);

      // Notify others in the room
      socket.to(roomId).emit('user_joined_call', {
        userId,
        username,
        timestamp: new Date().toISOString(),
      });

      // Send list of users in the call
      const usersInCall = Array.from(activeCalls.get(roomId) || []);
      socket.emit('users_in_call', usersInCall);
    });

    socket.on('signal', async (data) => {
      try {
        const { roomId, userId, username, signal } = callSchema.parse(data);
        socket.to(roomId).emit('signal', {
          userId,
          username,
          signal,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit('error', 'Invalid signal data');
      }
    });

    socket.on('leave_call', ({ roomId, userId }) => {
      socket.leave(roomId);
      activeCalls.get(roomId)?.delete(userId);
      
      if (activeCalls.get(roomId)?.size === 0) {
        activeCalls.delete(roomId);
      }

      socket.to(roomId).emit('user_left_call', {
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      // Clean up any active calls
      for (const [roomId, users] of activeCalls.entries()) {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          if (users.size === 0) {
            activeCalls.delete(roomId);
          }
          socket.to(roomId).emit('user_left_call', {
            userId: socket.id,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  });
} 