const { PrismaClient } = require('@prisma/client');
const llmService = require('./llm.service');

const prisma = new PrismaClient();

class RAGService {
  constructor() {
    // This is a simplified RAG implementation
    // In production, you would use LightRAG or a proper vector database
    this.embeddings = new Map();
  }

  /**
   * Index video content for RAG
   * @param {string} videoId - Video ID
   * @param {string} transcript - Video transcript
   * @param {Object} metadata - Video metadata
   * @returns {Promise<Object>} - Indexing result
   */
  async indexVideo(videoId, transcript, metadata) {
    try {
      // In a full implementation, this would:
      // 1. Split transcript into chunks
      // 2. Generate embeddings for each chunk
      // 3. Store in vector database
      // 4. Create knowledge graph relationships

      // For now, we'll store a simplified version in the database
      const chunks = this.splitIntoChunks(transcript, 500);

      // Create or update knowledge graph entry
      const knowledgeGraph = await prisma.knowledgeGraph.upsert({
        where: { videoId },
        update: {
          embeddings: JSON.stringify({
            chunkCount: chunks.length,
            indexed: true,
            timestamp: new Date().toISOString()
          }),
          relationships: JSON.stringify({
            title: metadata.title,
            author: metadata.author,
            topics: [] // Would be populated by topic extraction
          })
        },
        create: {
          videoId,
          embeddings: JSON.stringify({
            chunkCount: chunks.length,
            indexed: true,
            timestamp: new Date().toISOString()
          }),
          relationships: JSON.stringify({
            title: metadata.title,
            author: metadata.author,
            topics: []
          }),
          ragIndexRef: `index_${videoId}`
        }
      });

      return {
        success: true,
        videoId,
        chunkCount: chunks.length,
        indexed: true
      };
    } catch (error) {
      console.error('Error indexing video:', error.message);
      throw error;
    }
  }

  /**
   * Query the knowledge base
   * @param {string} query - User query
   * @param {Array} videoIds - Optional: Limit search to specific videos
   * @returns {Promise<Object>} - Query results
   */
  async query(query, videoIds = []) {
    try {
      // In a full implementation, this would:
      // 1. Generate query embedding
      // 2. Find similar chunks using vector similarity
      // 3. Retrieve relevant context
      // 4. Use LLM to generate answer

      // For now, simple keyword matching and LLM completion
      let videos;

      if (videoIds.length > 0) {
        videos = await prisma.video.findMany({
          where: { id: { in: videoIds } },
          include: { category: true }
        });
      } else {
        // Get all videos with transcriptions
        videos = await prisma.video.findMany({
          where: {
            transcription: { not: null }
          },
          include: { category: true },
          take: 10 // Limit for performance
        });
      }

      if (videos.length === 0) {
        return {
          success: false,
          message: 'No indexed videos found',
          answer: null
        };
      }

      // Combine relevant transcripts as context
      const context = videos
        .map(v => `[${v.title}]\n${v.transcription?.substring(0, 2000)}`)
        .join('\n\n---\n\n');

      // Use LLM to answer question
      const answer = await llmService.answerQuestion(query, context);

      return {
        success: true,
        answer,
        sources: videos.map(v => ({
          id: v.id,
          title: v.title,
          url: v.url
        }))
      };
    } catch (error) {
      console.error('Error querying knowledge base:', error.message);
      throw error;
    }
  }

  /**
   * Get relationships between videos
   * @param {string} videoId - Video ID
   * @returns {Promise<Array>} - Related videos
   */
  async getRelationships(videoId) {
    try {
      // In a full implementation, this would use the knowledge graph
      // to find semantically related videos

      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { category: true }
      });

      if (!video) {
        return [];
      }

      // Simple similarity: same category or shared tags
      const relatedVideos = await prisma.video.findMany({
        where: {
          OR: [
            { categoryId: video.categoryId },
            // Could add tag matching here
          ],
          id: { not: videoId }
        },
        take: 5,
        include: { category: true }
      });

      return relatedVideos.map(v => ({
        id: v.id,
        title: v.title,
        similarity: 0.75, // Placeholder
        reason: v.categoryId === video.categoryId ? 'Same category' : 'Related content'
      }));
    } catch (error) {
      console.error('Error getting relationships:', error.message);
      return [];
    }
  }

  /**
   * Split text into chunks
   * @param {string} text - Text to split
   * @param {number} chunkSize - Size of each chunk
   * @returns {Array} - Array of text chunks
   */
  splitIntoChunks(text, chunkSize = 500) {
    const words = text.split(/\s+/);
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    return chunks;
  }

  /**
   * Build knowledge graph for all videos
   * @returns {Promise<Object>} - Graph data
   */
  async buildKnowledgeGraph() {
    try {
      const videos = await prisma.video.findMany({
        include: { category: true }
      });

      // Simple graph structure
      const nodes = videos.map(v => ({
        id: v.id,
        label: v.title,
        category: v.category?.name || 'Uncategorized',
        watchStatus: v.watchStatus
      }));

      // Create edges based on categories
      const edges = [];
      const categoryGroups = {};

      videos.forEach(v => {
        const cat = v.categoryId || 'none';
        if (!categoryGroups[cat]) {
          categoryGroups[cat] = [];
        }
        categoryGroups[cat].push(v.id);
      });

      // Connect videos in same category
      Object.values(categoryGroups).forEach(group => {
        for (let i = 0; i < group.length - 1; i++) {
          edges.push({
            from: group[i],
            to: group[i + 1],
            type: 'same_category'
          });
        }
      });

      return {
        nodes,
        edges,
        stats: {
          videoCount: nodes.length,
          edgeCount: edges.length,
          categories: Object.keys(categoryGroups).length
        }
      };
    } catch (error) {
      console.error('Error building knowledge graph:', error.message);
      throw error;
    }
  }
}

module.exports = new RAGService();
