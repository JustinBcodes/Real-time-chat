import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create test users
    const password = await hash('password123', 10);
    
    const user1 = await prisma.user.upsert({
      where: { email: 'test1@example.com' },
      update: {},
      create: {
        email: 'test1@example.com',
        username: 'testuser1',
        password,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test1',
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'test2@example.com' },
      update: {},
      create: {
        email: 'test2@example.com',
        username: 'testuser2',
        password,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test2',
      },
    });

    // Create a test chat
    const chat = await prisma.chat.create({
      data: {
        name: 'Test Chat',
        participants: {
          connect: [{ id: user1.id }, { id: user2.id }],
        },
      },
    });

    // Create some test messages
    await prisma.message.createMany({
      data: [
        {
          content: 'Hello!',
          senderId: user1.id,
          receiverId: user2.id,
          chatId: chat.id,
        },
        {
          content: 'Hi there!',
          senderId: user2.id,
          receiverId: user1.id,
          chatId: chat.id,
        },
      ],
    });

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 