const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'openai';
    this.initializeClients();
  }

  initializeClients() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // Initialize Gemini
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    // Local LLM configuration
    this.localLLMUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434';
    this.localLLMModel = process.env.LOCAL_LLM_MODEL || 'llama2';
  }

  /**
   * Generate completion using configured LLM provider
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Object} options - Additional options (temperature, maxTokens, etc.)
   * @returns {Promise<string>} - Generated text
   */
  async generateCompletion(prompt, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = 'You are a helpful assistant that analyzes YouTube video content.'
    } = options;

    try {
      switch (this.provider) {
        case 'openai':
          return await this.generateOpenAI(prompt, systemPrompt, temperature, maxTokens);

        case 'gemini':
          return await this.generateGemini(prompt, systemPrompt, temperature, maxTokens);

        case 'local':
          return await this.generateLocal(prompt, systemPrompt, temperature, maxTokens);

        default:
          throw new Error(`Unknown LLM provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Error generating completion:', error.message);
      throw error;
    }
  }

  /**
   * Generate completion using OpenAI
   */
  async generateOpenAI(prompt, systemPrompt, temperature, maxTokens) {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Check OPENAI_API_KEY.');
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate completion using Google Gemini
   */
  async generateGemini(prompt, systemPrompt, temperature, maxTokens) {
    if (!this.gemini) {
      throw new Error('Gemini client not initialized. Check GEMINI_API_KEY.');
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Generate completion using local LLM (Ollama)
   */
  async generateLocal(prompt, systemPrompt, temperature, maxTokens) {
    const response = await axios.post(`${this.localLLMUrl}/api/generate`, {
      model: this.localLLMModel,
      prompt: `${systemPrompt}\n\n${prompt}`,
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens
      }
    });

    return response.data.response;
  }

  /**
   * Generate video summary with multiple levels
   * @param {string} transcript - Video transcript
   * @param {string} title - Video title
   * @returns {Promise<Object>} - Summary object with quick, detailed, and key points
   */
  async generateSummary(transcript, title) {
    try {
      const prompt = `
Analyze the following YouTube video transcript and provide:

1. A quick summary (50 words max)
2. A detailed summary (300-500 words)
3. Key points (5-7 bullet points)

Video Title: ${title}

Transcript:
${transcript.substring(0, 10000)} ${transcript.length > 10000 ? '...(truncated)' : ''}

Respond in JSON format:
{
  "quickSummary": "...",
  "detailedSummary": "...",
  "keyPoints": ["...", "..."]
}
`;

      const response = await this.generateCompletion(prompt, {
        temperature: 0.5,
        maxTokens: 1500,
        systemPrompt: 'You are an expert at summarizing educational video content. Always respond with valid JSON.'
      });

      // Parse JSON response
      try {
        const summary = JSON.parse(response);
        return summary;
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          quickSummary: response.substring(0, 200),
          detailedSummary: response,
          keyPoints: ['Summary generated but format parsing failed']
        };
      }
    } catch (error) {
      console.error('Error generating summary:', error.message);
      return {
        quickSummary: 'Summary generation failed',
        detailedSummary: `Error: ${error.message}`,
        keyPoints: ['Unable to generate summary at this time']
      };
    }
  }

  /**
   * Answer questions about video content
   * @param {string} question - User question
   * @param {string} context - Video transcript or relevant context
   * @returns {Promise<string>} - Answer
   */
  async answerQuestion(question, context) {
    const prompt = `
Based on the following video content, answer this question:

Question: ${question}

Context:
${context.substring(0, 8000)}

Provide a clear and concise answer based only on the information in the context.
`;

    return await this.generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 500,
      systemPrompt: 'You are a helpful assistant that answers questions based on video content.'
    });
  }

  /**
   * Extract topics from transcript
   * @param {string} transcript - Video transcript
   * @returns {Promise<Array>} - Array of topics
   */
  async extractTopics(transcript) {
    const prompt = `
Analyze this video transcript and extract 5-10 main topics or themes.
Return only a JSON array of topics, for example: ["topic1", "topic2", ...]

Transcript:
${transcript.substring(0, 8000)}
`;

    try {
      const response = await this.generateCompletion(prompt, {
        temperature: 0.5,
        maxTokens: 300,
        systemPrompt: 'You extract topics from text. Always respond with a valid JSON array.'
      });

      const topics = JSON.parse(response);
      return Array.isArray(topics) ? topics : [];
    } catch (error) {
      console.error('Error extracting topics:', error.message);
      return [];
    }
  }
}

module.exports = new LLMService();
