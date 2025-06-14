import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { initializeWebRTC } from './services/webrtc';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3001';

async function bootstrap() {
  try {
    // Create Express app
    const app = express();

    // Middleware
    app.use(cors({
      origin: CLIENT_ORIGIN,
      credentials: true,
    }));
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_, res) => res.send('OK'));

    // API routes
    app.get('/api', (req, res) => {
      res.json({ message: 'API is running' });
    });

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Handle socket connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('ping', () => {
        console.log('Received ping from', socket.id);
        socket.emit('pong');
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Initialize WebRTC service
    initializeWebRTC(io);

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap(); 