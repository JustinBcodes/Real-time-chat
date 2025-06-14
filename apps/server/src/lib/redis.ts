import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient({ url: redisUrl });

let isConnected = false;

/**
 * Connect to Redis
 */
export async function connectToRedis() {
  if (isConnected) {
    console.log('Redis is already connected');
    return;
  }

  try {
    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();
    isConnected = true;
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis', error);
    throw error;
  }
}

/**
 * Get Redis client
 */
export function getRedisClient() {
  if (!isConnected) {
    throw new Error('Redis is not connected');
  }
  return client;
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (!isConnected) {
    return;
  }

  try {
    await client.quit();
    isConnected = false;
    console.log('Closed Redis connection');
  } catch (error) {
    console.error('Failed to close Redis connection', error);
    throw error;
  }
}

export async function setUserPresence(userId: string, roomId: string) {
  const key = `presence:${roomId}`;
  await client.sAdd(key, userId);
  await client.expire(key, 3600); // Expire after 1 hour
}

export async function removeUserPresence(userId: string, roomId: string) {
  const key = `presence:${roomId}`;
  await client.sRem(key, userId);
}

export async function getRoomUsers(roomId: string) {
  const key = `presence:${roomId}`;
  return await client.sMembers(key);
}

export async function cacheMessage(roomId: string, message: any) {
  const key = `messages:${roomId}`;
  await client.lPush(key, JSON.stringify(message));
  await client.lTrim(key, 0, 99); // Keep last 100 messages
  await client.expire(key, 86400); // Expire after 24 hours
}

export async function getCachedMessages(roomId: string) {
  const key = `messages:${roomId}`;
  const messages = await client.lRange(key, 0, -1);
  return messages.map((msg) => JSON.parse(msg));
} 