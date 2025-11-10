const express = require('express');
const { PrismaClient } = require('@prisma/client');
const youtubeService = require('../services/youtube.service');
const transcriptionService = require('../services/transcription.service');
const llmService = require('../services/llm.service');
const ragService = require('../services/rag.service');
const autoCategorizationService = require('../services/auto-categorization.service');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/videos - Add a new video by URL
 */
router.post('/', async (req, res) => {
  try {
    const { url, categoryId, tags } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Extract video ID
    const videoId = youtubeService.extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Check if video already exists
    const existing = await prisma.video.findUnique({
      where: { youtubeId: videoId }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Video already exists',
        video: existing
      });
    }

    // Get video metadata
    const metadata = await youtubeService.getVideoMetadata(videoId);

    // Create video record
    const video = await prisma.video.create({
      data: {
        youtubeId: metadata.youtubeId,
        url: metadata.url,
        title: metadata.title,
        author: metadata.author,
        duration: metadata.duration,
        uploadDate: metadata.uploadDate,
        categoryId: categoryId || null,
        tags: JSON.stringify(tags || []),
        watchStatus: 'unwatched'
      },
      include: { category: true }
    });

    res.status(201).json(video);
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/videos - List all videos with filters
 */
router.get('/', async (req, res) => {
  try {
    const { categoryId, watchStatus, search, limit = 50, offset = 0 } = req.query;

    const where = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (watchStatus) {
      where.watchStatus = watchStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } }
      ];
    }

    const videos = await prisma.video.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.video.count({ where });

    res.json({
      videos: videos.map(v => ({
        ...v,
        tags: JSON.parse(v.tags || '[]'),
        summaryJson: v.summaryJson ? JSON.parse(v.summaryJson) : null
      })),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/videos/:id - Get video details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({
      ...video,
      tags: JSON.parse(video.tags || '[]'),
      summaryJson: video.summaryJson ? JSON.parse(video.summaryJson) : null
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/videos/:id - Update video metadata
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, tags, watchStatus } = req.body;

    const updateData = {};

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    if (tags !== undefined) {
      updateData.tags = JSON.stringify(tags);
    }

    if (watchStatus !== undefined) {
      updateData.watchStatus = watchStatus;
    }

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
      include: { category: true }
    });

    res.json({
      ...video,
      tags: JSON.parse(video.tags || '[]'),
      summaryJson: video.summaryJson ? JSON.parse(video.summaryJson) : null
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/videos/:id - Delete video
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete knowledge graph entry if exists
    await prisma.knowledgeGraph.deleteMany({
      where: { videoId: id }
    });

    // Delete video
    await prisma.video.delete({
      where: { id }
    });

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/videos/:id/process - Process video (transcription + summarization)
 */
router.post('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get transcription
    const transcriptResult = await transcriptionService.getTranscript(video.youtubeId);

    if (!transcriptResult.success) {
      return res.status(400).json({
        error: 'Failed to get transcript',
        message: transcriptResult.message
      });
    }

    // Generate summary
    const summary = await llmService.generateSummary(
      transcriptResult.fullText,
      video.title
    );

    // Update video with transcription and summary
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        transcription: transcriptResult.fullText,
        summaryJson: JSON.stringify(summary)
      },
      include: { category: true }
    });

    // Index in RAG system
    await ragService.indexVideo(id, transcriptResult.fullText, {
      title: video.title,
      author: video.author
    });

    res.json({
      ...updatedVideo,
      tags: JSON.parse(updatedVideo.tags || '[]'),
      summaryJson: summary
    });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/videos/batch - Batch import from playlist (placeholder)
 */
router.post('/batch', async (req, res) => {
  try {
    const { playlistId } = req.body;

    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }

    // This would require YouTube Data API
    res.status(501).json({
      error: 'Playlist import not yet implemented',
      message: 'This feature requires YouTube Data API key'
    });
  } catch (error) {
    console.error('Error batch importing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/videos/:id/auto-categorize - Auto-categorize a video
 */
router.post('/:id/auto-categorize', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const categories = await prisma.category.findMany();

    const suggestion = await autoCategorizationService.suggestCategoryAndTags(
      {
        title: video.title,
        description: video.author,
        transcription: video.transcription
      },
      categories
    );

    res.json(suggestion);
  } catch (error) {
    console.error('Error auto-categorizing video:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/videos/bulk/categorize - Bulk categorize videos
 */
router.post('/bulk/categorize', async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!videoIds || !Array.isArray(videoIds)) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }

    const videos = await prisma.video.findMany({
      where: { id: { in: videoIds } },
      include: { category: true }
    });

    const categories = await prisma.category.findMany();

    const suggestions = await autoCategorizationService.batchCategorize(videos, categories);

    res.json({ suggestions });
  } catch (error) {
    console.error('Error bulk categorizing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/videos/bulk/update - Bulk update videos
 */
router.put('/bulk/update', async (req, res) => {
  try {
    const { videoIds, updates } = req.body;

    if (!videoIds || !Array.isArray(videoIds)) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }

    const updateData = {};
    if (updates.categoryId !== undefined) {
      updateData.categoryId = updates.categoryId;
    }
    if (updates.watchStatus !== undefined) {
      updateData.watchStatus = updates.watchStatus;
    }
    if (updates.tags !== undefined) {
      updateData.tags = JSON.stringify(updates.tags);
    }

    await prisma.video.updateMany({
      where: { id: { in: videoIds } },
      data: updateData
    });

    const updatedVideos = await prisma.video.findMany({
      where: { id: { in: videoIds } },
      include: { category: true }
    });

    res.json({
      updated: updatedVideos.map(v => ({
        ...v,
        tags: JSON.parse(v.tags || '[]')
      }))
    });
  } catch (error) {
    console.error('Error bulk updating videos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/videos/bulk/delete - Bulk delete videos
 */
router.delete('/bulk/delete', async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!videoIds || !Array.isArray(videoIds)) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }

    // Delete knowledge graph entries
    await prisma.knowledgeGraph.deleteMany({
      where: { videoId: { in: videoIds } }
    });

    // Delete videos
    const result = await prisma.video.deleteMany({
      where: { id: { in: videoIds } }
    });

    res.json({
      message: 'Videos deleted successfully',
      count: result.count
    });
  } catch (error) {
    console.error('Error bulk deleting videos:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
