const ytdl = require('ytdl-core');
const axios = require('axios');

class YouTubeService {
  /**
   * Extract YouTube video ID from URL
   * @param {string} url - YouTube video URL or ID
   * @returns {string|null} - Video ID or null if invalid
   */
  extractVideoId(url) {
    try {
      // If it's already a video ID
      if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
        return url;
      }

      const urlPatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
      ];

      for (const pattern of urlPatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  }

  /**
   * Get video metadata using ytdl-core (no API key required)
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} - Video metadata
   */
  async getVideoMetadata(videoId) {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await ytdl.getInfo(url);

      const videoDetails = info.videoDetails;

      return {
        youtubeId: videoId,
        url: url,
        title: videoDetails.title,
        author: videoDetails.author?.name || videoDetails.ownerChannelName,
        duration: parseInt(videoDetails.lengthSeconds),
        uploadDate: videoDetails.uploadDate ? new Date(videoDetails.uploadDate) : null,
        thumbnail: videoDetails.thumbnails?.[0]?.url || null,
        description: videoDetails.description || '',
        viewCount: parseInt(videoDetails.viewCount) || 0,
        likes: videoDetails.likes || 0
      };
    } catch (error) {
      console.error('Error fetching video metadata:', error.message);

      // Fallback: Basic metadata extraction
      return {
        youtubeId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: `Video ${videoId}`,
        author: 'Unknown',
        duration: null,
        uploadDate: null,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        description: '',
        viewCount: 0,
        likes: 0,
        error: error.message
      };
    }
  }

  /**
   * Validate YouTube URL or ID
   * @param {string} input - YouTube URL or video ID
   * @returns {boolean} - True if valid
   */
  isValidYouTubeUrl(input) {
    const videoId = this.extractVideoId(input);
    return videoId !== null && videoId.length === 11;
  }

  /**
   * Get playlist videos (placeholder for YouTube Data API)
   * @param {string} playlistId - YouTube playlist ID
   * @returns {Promise<Array>} - Array of video IDs
   */
  async getPlaylistVideos(playlistId) {
    // This would require YouTube Data API key
    // For now, return placeholder
    throw new Error('Playlist import requires YouTube Data API key (not implemented yet)');
  }
}

module.exports = new YouTubeService();
