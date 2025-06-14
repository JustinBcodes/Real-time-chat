import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime-chat';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let isConnected = false;

/**
 * Connect to MongoDB
 */
export async function connectToMongoDB() {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    await client.connect();
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

/**
 * Get MongoDB database
 */
export function getDb() {
  return client.db();
}

/**
 * Close MongoDB connection
 */
export async function closeMongoDB() {
  if (!isConnected) {
    return;
  }

  try {
    await client.close();
    isConnected = false;
    console.log('Closed MongoDB connection');
  } catch (error) {
    console.error('Failed to close MongoDB connection', error);
    throw error;
  }
}

export const collections = {
  messages: 'messages',
  rooms: 'rooms',
}; 