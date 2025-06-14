import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
const clientId = process.env.KAFKA_CLIENT_ID || 'realtime-chat-server';

const kafka = new Kafka({
  clientId,
  brokers,
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: `${clientId}-group` });

export const topics = {
  messages: 'chat-messages',
  presence: 'user-presence',
  notifications: 'notifications',
};

let isInitialized = false;

/**
 * Initialize Kafka producer and consumer
 */
export async function initializeKafka() {
  if (isInitialized) {
    console.log('Kafka is already initialized');
    return;
  }

  try {
    await producer.connect();
    await consumer.connect();
    isInitialized = true;
    console.log('Connected to Kafka');
  } catch (error) {
    console.error('Failed to connect to Kafka', error);
    // Don't throw error to allow server to start without Kafka
    console.warn('Server will run without Kafka support');
  }
}

/**
 * Send message to Kafka topic
 */
export async function sendMessage(topic: string, message: any) {
  if (!isInitialized) {
    console.warn('Kafka is not initialized');
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) },
      ],
    });
  } catch (error) {
    console.error(`Failed to send message to topic ${topic}:`, error);
  }
}

/**
 * Subscribe to Kafka topic
 */
export async function subscribeToTopic(topic: string, callback: (message: any) => void) {
  if (!isInitialized) {
    console.warn('Kafka is not initialized');
    return;
  }

  try {
    await consumer.subscribe({ topic, fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (message.value) {
          const parsedMessage = JSON.parse(message.value.toString());
          callback(parsedMessage);
        }
      },
    });
  } catch (error) {
    console.error(`Failed to subscribe to topic ${topic}:`, error);
  }
}

/**
 * Close Kafka connections
 */
export async function closeKafka() {
  if (!isInitialized) {
    return;
  }

  try {
    await producer.disconnect();
    await consumer.disconnect();
    isInitialized = false;
    console.log('Closed Kafka connections');
  } catch (error) {
    console.error('Failed to close Kafka connections', error);
  }
} 