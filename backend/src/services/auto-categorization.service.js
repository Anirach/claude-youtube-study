const llmService = require('./llm.service');

class AutoCategorizationService {
  /**
   * Auto-categorize a video based on title, description, and transcript
   * @param {Object} videoData - Video data
   * @param {Array} existingCategories - Existing categories
   * @returns {Promise<Object>} - Suggested category and tags
   */
  async suggestCategoryAndTags(videoData, existingCategories = []) {
    try {
      const { title, description, transcription } = videoData;

      const categoryList = existingCategories.length > 0
        ? existingCategories.map(c => c.name).join(', ')
        : 'No existing categories';

      const prompt = `
Analyze this YouTube video and suggest:
1. The most appropriate category from the existing list (or suggest a new one)
2. 5-7 relevant tags

Video Title: ${title}
Description: ${description || 'Not available'}
Transcript Preview: ${transcription?.substring(0, 1000) || 'Not available'}

Existing Categories: ${categoryList}

Respond in JSON format:
{
  "suggestedCategory": "category name",
  "isNewCategory": true/false,
  "tags": ["tag1", "tag2", ...],
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}
`;

      const response = await llmService.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 500,
        systemPrompt: 'You are an expert at categorizing educational content. Always respond with valid JSON.'
      });

      try {
        const suggestion = JSON.parse(response);
        return suggestion;
      } catch (parseError) {
        console.error('Error parsing categorization response:', parseError);
        return this.getFallbackCategorization(title);
      }
    } catch (error) {
      console.error('Error in auto-categorization:', error.message);
      return this.getFallbackCategorization(videoData.title);
    }
  }

  /**
   * Fallback categorization when LLM fails
   */
  getFallbackCategorization(title) {
    const keywords = {
      'Programming': ['code', 'programming', 'javascript', 'python', 'java', 'tutorial', 'development'],
      'Science': ['science', 'physics', 'chemistry', 'biology', 'research'],
      'Math': ['math', 'mathematics', 'calculus', 'algebra', 'geometry'],
      'Business': ['business', 'marketing', 'finance', 'startup', 'entrepreneurship'],
      'Design': ['design', 'ui', 'ux', 'graphic', 'photoshop', 'figma'],
      'Music': ['music', 'guitar', 'piano', 'singing', 'production'],
      'Language': ['language', 'english', 'spanish', 'learning', 'grammar'],
    };

    const titleLower = title.toLowerCase();
    let suggestedCategory = 'General';
    let matchedTags = [];

    for (const [category, terms] of Object.entries(keywords)) {
      const matches = terms.filter(term => titleLower.includes(term));
      if (matches.length > 0) {
        suggestedCategory = category;
        matchedTags = matches;
        break;
      }
    }

    return {
      suggestedCategory,
      isNewCategory: false,
      tags: matchedTags.slice(0, 5),
      confidence: 0.5,
      reason: 'Keyword-based fallback categorization'
    };
  }

  /**
   * Batch categorize multiple videos
   * @param {Array} videos - Array of videos
   * @param {Array} categories - Existing categories
   * @returns {Promise<Array>} - Array of suggestions
   */
  async batchCategorize(videos, categories) {
    const suggestions = [];

    for (const video of videos) {
      const suggestion = await this.suggestCategoryAndTags(video, categories);
      suggestions.push({
        videoId: video.id,
        ...suggestion
      });
    }

    return suggestions;
  }

  /**
   * Analyze category distribution
   * @param {Array} videos - Array of videos
   * @returns {Object} - Category statistics
   */
  analyzeCategoryDistribution(videos) {
    const distribution = {};
    const uncategorized = [];

    videos.forEach(video => {
      if (video.category) {
        const catName = video.category.name;
        if (!distribution[catName]) {
          distribution[catName] = {
            count: 0,
            videos: []
          };
        }
        distribution[catName].count++;
        distribution[catName].videos.push(video.id);
      } else {
        uncategorized.push(video.id);
      }
    });

    return {
      distribution,
      uncategorized,
      totalCategories: Object.keys(distribution).length,
      uncategorizedCount: uncategorized.length
    };
  }
}

module.exports = new AutoCategorizationService();
