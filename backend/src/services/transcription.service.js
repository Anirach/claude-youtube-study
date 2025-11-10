const { YoutubeTranscript } = require('youtube-transcript');

class TranscriptionService {
  /**
   * Fetch transcript for a YouTube video
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} - Transcript data
   */
  async getTranscript(videoId) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcript || transcript.length === 0) {
        return {
          success: false,
          message: 'No transcript available for this video',
          transcript: null,
          fullText: null
        };
      }

      // Combine all transcript segments into full text
      const fullText = transcript
        .map(segment => segment.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        success: true,
        transcript: transcript,
        fullText: fullText,
        segments: transcript.length,
        language: transcript[0]?.lang || 'unknown'
      };
    } catch (error) {
      console.error('Error fetching transcript:', error.message);

      // Handle different error types
      if (error.message.includes('Transcript is disabled')) {
        return {
          success: false,
          message: 'Transcripts are disabled for this video',
          transcript: null,
          fullText: null
        };
      }

      if (error.message.includes('Could not find')) {
        return {
          success: false,
          message: 'No transcript available for this video',
          transcript: null,
          fullText: null
        };
      }

      return {
        success: false,
        message: `Error fetching transcript: ${error.message}`,
        transcript: null,
        fullText: null
      };
    }
  }

  /**
   * Get available transcript languages
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Array>} - Array of available languages
   */
  async getAvailableLanguages(videoId) {
    try {
      // Note: youtube-transcript library doesn't directly expose language list
      // This is a placeholder for future enhancement
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      if (transcript && transcript.length > 0) {
        return [transcript[0]?.lang || 'en'];
      }

      return [];
    } catch (error) {
      console.error('Error getting available languages:', error.message);
      return [];
    }
  }

  /**
   * Extract key timestamps from transcript
   * @param {Array} transcript - Transcript segments
   * @returns {Array} - Key timestamps
   */
  extractKeyTimestamps(transcript) {
    if (!transcript || transcript.length === 0) {
      return [];
    }

    // Sample every Nth segment to get key timestamps
    const sampleRate = Math.max(1, Math.floor(transcript.length / 10));
    const keyTimestamps = [];

    for (let i = 0; i < transcript.length; i += sampleRate) {
      const segment = transcript[i];
      keyTimestamps.push({
        time: segment.offset,
        text: segment.text,
        formattedTime: this.formatTimestamp(segment.offset)
      });
    }

    return keyTimestamps;
  }

  /**
   * Format timestamp in seconds to HH:MM:SS
   * @param {number} seconds - Timestamp in seconds
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Generate timestamp-linked highlights using LLM
   * @param {Array} transcript - Transcript segments with timestamps
   * @param {string} title - Video title
   * @returns {Promise<Array>} - Array of highlights with timestamps
   */
  async generateHighlights(transcript, title) {
    if (!transcript || transcript.length === 0) {
      return [];
    }

    try {
      // Import LLM service dynamically to avoid circular dependency
      const llmService = require('./llm.service');

      // Group transcript into time windows (every 5 minutes or so)
      const windowSize = 60; // 60 segments approximately
      const windows = [];

      for (let i = 0; i < transcript.length; i += windowSize) {
        const windowSegments = transcript.slice(i, i + windowSize);
        const startTime = windowSegments[0].offset;
        const endTime = windowSegments[windowSegments.length - 1].offset;
        const text = windowSegments.map(s => s.text).join(' ');

        windows.push({
          startTime,
          endTime,
          text
        });
      }

      // Generate highlights for each window
      const highlights = [];

      for (const window of windows.slice(0, 5)) { // Limit to first 5 windows for efficiency
        const prompt = `
Analyze this segment from a YouTube video titled "${title}" and identify the most important highlight or key point.

Time Range: ${this.formatTimestamp(window.startTime)} - ${this.formatTimestamp(window.endTime)}

Transcript:
${window.text.substring(0, 1000)}

If there's a key point, respond with JSON:
{
  "highlight": "brief description of the key point (max 100 chars)",
  "important": true/false
}

If this segment doesn't contain important information, respond with:
{
  "highlight": null,
  "important": false
}
`;

        try {
          const response = await llmService.generateCompletion(prompt, {
            temperature: 0.3,
            maxTokens: 200,
            systemPrompt: 'You identify key moments in video transcripts. Respond with valid JSON.'
          });

          const result = JSON.parse(response);

          if (result.highlight && result.important) {
            highlights.push({
              timestamp: window.startTime,
              formattedTime: this.formatTimestamp(window.startTime),
              text: result.highlight,
              youtubeLink: `https://www.youtube.com/watch?v=${window.videoId}&t=${Math.floor(window.startTime)}s`
            });
          }
        } catch (error) {
          console.error('Error generating highlight for window:', error.message);
        }
      }

      return highlights;
    } catch (error) {
      console.error('Error generating highlights:', error.message);
      return this.extractKeyTimestamps(transcript).slice(0, 5);
    }
  }

  /**
   * Get transcript with searchable timestamps
   * @param {Array} transcript - Transcript segments
   * @returns {Array} - Formatted transcript with timestamps
   */
  getTimestampedTranscript(transcript) {
    if (!transcript || transcript.length === 0) {
      return [];
    }

    return transcript.map(segment => ({
      timestamp: segment.offset,
      formattedTime: this.formatTimestamp(segment.offset),
      text: segment.text,
      duration: segment.duration || 0
    }));
  }
}

module.exports = new TranscriptionService();
