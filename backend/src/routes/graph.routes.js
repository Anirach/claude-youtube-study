const express = require('express');
const ragService = require('../services/rag.service');

const router = express.Router();

/**
 * GET /api/graph - Get knowledge graph data
 */
router.get('/', async (req, res) => {
  try {
    const graphData = await ragService.buildKnowledgeGraph();
    res.json(graphData);
  } catch (error) {
    console.error('Error getting knowledge graph:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/relationships - Get video relationships
 */
router.get('/relationships', async (req, res) => {
  try {
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const relationships = await ragService.getRelationships(videoId);
    res.json({ videoId, relationships });
  } catch (error) {
    console.error('Error getting relationships:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
