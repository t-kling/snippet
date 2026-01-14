const OpenAI = require('openai');

// Initialize OpenAI client
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * Extract text from an image using OCR
 * @param {string} imageDataUrl - Base64 encoded image data URL
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromImage = async (imageDataUrl) => {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this image. Return ONLY the extracted text, preserving formatting and structure. Do not add any commentary or explanations."
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const extractedText = response.choices[0].message.content.trim();
    return extractedText;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image: ' + error.message);
  }
};

/**
 * Suggest topics based on snippet content
 * @param {string} content - The snippet content
 * @param {string[]} existingTopics - Array of existing topic names
 * @returns {Promise<string[]>} Array of suggested topic names
 */
const suggestTopics = async (content, existingTopics = []) => {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
  }

  try {
    const existingTopicsText = existingTopics.length > 0
      ? `\n\nExisting topics in the library: ${existingTopics.join(', ')}\nPrefer suggesting existing topics when they fit, but don't force it.`
      : '';

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          text: "You are a helpful assistant that suggests relevant topic tags for study notes and flashcards. Suggest 1-5 concise, relevant topic names."
        },
        {
          role: "user",
          content: `Analyze this content and suggest 1-5 relevant topic tags. Be specific and academic where appropriate (e.g., "Quantum Mechanics" not just "Physics", "Market Efficiency" not just "Economics").

Return ONLY a JSON array of topic names, nothing else.${existingTopicsText}

Content:
${content.substring(0, 1000)}`
        },
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const suggestionsText = response.choices[0].message.content.trim();

    // Parse JSON response
    try {
      const suggestions = JSON.parse(suggestionsText);
      if (Array.isArray(suggestions)) {
        return suggestions.filter(topic => typeof topic === 'string' && topic.length > 0);
      }
    } catch (parseError) {
      // Fallback: try to extract topics from text
      console.warn('Failed to parse JSON, attempting text extraction:', suggestionsText);
      const topics = suggestionsText
        .replace(/[\[\]"']/g, '')
        .split(/[,\n]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.length < 50);

      return topics.slice(0, 5);
    }

    return [];
  } catch (error) {
    console.error('Topic suggestion error:', error);
    throw new Error('Failed to suggest topics: ' + error.message);
  }
};

/**
 * Search snippets using AI-powered semantic search
 * @param {string} query - Natural language search query
 * @param {Array} snippets - Array of snippet objects with id, title, content, topics
 * @returns {Promise<string[]>} Array of snippet IDs ranked by relevance
 */
const searchSnippets = async (query, snippets) => {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
  }

  if (!snippets || snippets.length === 0) {
    return [];
  }

  try {
    // Create a summary of each snippet for the AI
    const snippetSummaries = snippets.map(s => {
      const topics = Array.isArray(s.topics) ? s.topics.map(t => t.name).join(', ') : '';
      const contentPreview = s.content ? s.content.substring(0, 200) : '';

      return {
        id: s.id,
        summary: `ID: ${s.id}
Title: ${s.title}
Topics: ${topics}
Type: ${s.type}
Content: ${contentPreview}${s.content && s.content.length > 200 ? '...' : ''}`
      };
    });

    const snippetsText = snippetSummaries.map(s => s.summary).join('\n\n---\n\n');

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a search assistant helping users find relevant notes and flashcards. Analyze the user's query and the available snippets, then return the IDs of relevant snippets ranked by relevance."
        },
        {
          role: "user",
          content: `Search Query: "${query}"

Available Snippets:
${snippetsText}

Return a JSON array of snippet IDs ranked by relevance to the query (most relevant first). Only include snippets that are actually relevant. If nothing is relevant, return an empty array.

Format: ["id1", "id2", "id3"]`
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const responseText = response.choices[0].message.content.trim();

    // Parse JSON response
    try {
      const snippetIds = JSON.parse(responseText);
      if (Array.isArray(snippetIds)) {
        // Filter to only include valid snippet IDs
        const validIds = snippets.map(s => s.id);
        return snippetIds.filter(id => validIds.includes(id));
      }
    } catch (parseError) {
      console.warn('Failed to parse search results:', responseText);
      return [];
    }

    return [];
  } catch (error) {
    console.error('AI search error:', error);
    throw new Error('Failed to search snippets: ' + error.message);
  }
};

/**
 * Suggest cloze keywords for flashcard content
 * @param {string} content - The snippet content
 * @returns {Promise<string[]>} Array of suggested keywords/phrases to make into clozes
 */
const suggestClozeKeywords = async (content) => {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that identifies key terms, concepts, and facts in educational content that would make good cloze deletions (fill-in-the-blank) for flashcards."
        },
        {
          role: "user",
          content: `Analyze this content and suggest 2-6 specific keywords or short phrases that would make effective cloze deletions. Focus on:
- Key terms and definitions
- Important names, dates, or numbers
- Critical concepts or processes
- Memorable facts

Return ONLY a JSON array of the exact keywords/phrases as they appear in the text, nothing else.

Content:
${content}`
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const suggestionsText = response.choices[0].message.content.trim();

    // Parse JSON response
    try {
      const suggestions = JSON.parse(suggestionsText);
      if (Array.isArray(suggestions)) {
        return suggestions.filter(keyword => typeof keyword === 'string' && keyword.length > 0);
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON, attempting text extraction:', suggestionsText);
      // Fallback: try to extract keywords from text
      const keywords = suggestionsText
        .replace(/[\[\]"']/g, '')
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0 && k.length < 100);

      return keywords.slice(0, 6);
    }

    return [];
  } catch (error) {
    console.error('Cloze keyword suggestion error:', error);
    throw new Error('Failed to suggest cloze keywords: ' + error.message);
  }
};

module.exports = {
  extractTextFromImage,
  suggestTopics,
  searchSnippets,
  suggestClozeKeywords,
};
