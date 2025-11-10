const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ragService = require('../services/rag.service');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/chat - Start a new chat session
 */
router.post('/', async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!videoIds || !Array.isArray(videoIds)) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }

    const chatSession = await prisma.chatSession.create({
      data: {
        videoIds: JSON.stringify(videoIds),
        messages: JSON.stringify([]),
        contextSummary: null
      }
    });

    res.status(201).json({
      ...chatSession,
      videoIds: JSON.parse(chatSession.videoIds),
      messages: []
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/:id/message - Send a message to chat session
 */
router.post('/:id/message', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chatSession = await prisma.chatSession.findUnique({
      where: { id }
    });

    if (!chatSession) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const videoIds = JSON.parse(chatSession.videoIds);
    const messages = JSON.parse(chatSession.messages);

    // Add user message
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Query RAG system
    const queryResult = await ragService.query(message, videoIds);

    // Add assistant response
    const assistantMessage = {
      role: 'assistant',
      content: queryResult.answer || 'Sorry, I could not find relevant information.',
      sources: queryResult.sources || [],
      timestamp: new Date().toISOString()
    };

    messages.push(assistantMessage);

    // Update chat session
    const updatedSession = await prisma.chatSession.update({
      where: { id },
      data: {
        messages: JSON.stringify(messages)
      }
    });

    res.json({
      ...updatedSession,
      videoIds: JSON.parse(updatedSession.videoIds),
      messages: JSON.parse(updatedSession.messages)
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/:id - Get chat session history
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const chatSession = await prisma.chatSession.findUnique({
      where: { id }
    });

    if (!chatSession) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({
      ...chatSession,
      videoIds: JSON.parse(chatSession.videoIds),
      messages: JSON.parse(chatSession.messages)
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat - List all chat sessions
 */
router.get('/', async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json(
      sessions.map(s => ({
        ...s,
        videoIds: JSON.parse(s.videoIds),
        messageCount: JSON.parse(s.messages).length
      }))
    );
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
