// Advanced AI Chatbot with Memory & Intelligence

const Anthropic = require('@anthropic-ai/sdk');
const { query } = require('../config/database');

class AdvancedChatbot {
  constructor() {
    this.client = new Anthropic();
    this.model = 'claude-3-5-sonnet-20241022';
    this.conversationHistories = new Map(); // In-memory store (move to DB for production)
  }

  /**
   * Get or create conversation history for user
   */
  async getConversationHistory(userId) {
    if (!this.conversationHistories.has(userId)) {
      // Load from database if exists
      try {
        const result = await query(
          'SELECT messages FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
          [userId]
        );
        if (result.rows.length > 0) {
          this.conversationHistories.set(userId, JSON.parse(result.rows[0].messages));
        } else {
          this.conversationHistories.set(userId, []);
        }
      } catch (error) {
        this.conversationHistories.set(userId, []);
      }
    }
    return this.conversationHistories.get(userId);
  }

  /**
   * Get user context for smart recommendations
   */
  async getUserContext(userId) {
    try {
      const [purchaseResult, browsingResult, userResult] = await Promise.all([
        query('SELECT * FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = $1 LIMIT 5', [userId]),
        query('SELECT * FROM activity_log WHERE user_id = $1 AND action = "view_product" LIMIT 10', [userId]),
        query('SELECT * FROM users WHERE id = $1', [userId])
      ]);

      return {
        purchases: purchaseResult.rows,
        browsing: browsingResult.rows,
        profile: userResult.rows[0]
      };
    } catch (error) {
      return { purchases: [], browsing: [], profile: null };
    }
  }

  /**
   * Chat with context awareness
   */
  async chat(userId, userMessage) {
    try {
      const history = await this.getConversationHistory(userId);
      const context = await this.getUserContext(userId);

      // Build system prompt with user context
      const systemPrompt = `You are Al Handassa's intelligent assistant for engineering education resources.

User Profile:
- Name: ${context.profile?.first_name || 'User'}
- Recent purchases: ${context.purchases.map(p => p.title).join(', ') || 'None'}
- Interests: ${context.browsing.map(b => b.category).slice(0, 3).join(', ') || 'General'}

Your responsibilities:
1. Answer questions about civil engineering resources
2. Recommend products based on their history
3. Help with orders and account management
4. Provide technical support
5. Use Arabic/French/English as needed
6. Be helpful, professional, and multilingual

Current conversation history: ${history.length} messages`;

      // Add new message to history
      history.push({
        role: 'user',
        content: userMessage
      });

      // Call Claude API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: history
      });

      const assistantMessage = response.content[0].text;

      // Add response to history
      history.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Save to database
      await this.saveChatHistory(userId, history);

      // Store in memory
      this.conversationHistories.set(userId, history);

      // Log interaction
      await this.logChatInteraction(userId, userMessage, assistantMessage);

      return {
        success: true,
        message: assistantMessage,
        suggestions: await this.generateSuggestions(userId, context)
      };

    } catch (error) {
      console.error('Chatbot error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save chat history to database
   */
  async saveChatHistory(userId, messages) {
    try {
      const lastMessage = messages[messages.length - 1];
      await query(
        `INSERT INTO chat_history (user_id, messages, last_message, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, JSON.stringify(messages), lastMessage.content]
      );
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Log chat interactions for analytics
   */
  async logChatInteraction(userId, question, answer) {
    try {
      await query(
        `INSERT INTO chat_log (user_id, question, answer, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, question, answer]
      );
    } catch (error) {
      console.error('Error logging chat:', error);
    }
  }

  /**
   * Generate smart suggestions based on context
   */
  async generateSuggestions(userId, context) {
    try {
      const suggestions = [];

      // If they bought béton, suggest structures
      if (context.purchases.some(p => p.category?.includes('béton'))) {
        const result = await query(
          'SELECT * FROM products WHERE category_name = $1 AND is_active = TRUE LIMIT 3',
          ['Calcul Structures']
        );
        if (result.rows.length > 0) {
          suggestions.push({
            type: 'recommended',
            title: 'Courses complémentaires',
            products: result.rows
          });
        }
      }

      // If they viewed topography, suggest related
      if (context.browsing.some(b => b.category?.includes('topographie'))) {
        const result = await query(
          'SELECT * FROM products WHERE tags @> $1 AND is_active = TRUE LIMIT 3',
          [['Topographie']]
        );
        if (result.rows.length > 0) {
          suggestions.push({
            type: 'viewed',
            title: 'Basé sur votre historique',
            products: result.rows
          });
        }
      }

      return suggestions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(userId) {
    this.conversationHistories.delete(userId);
  }
}

module.exports = new AdvancedChatbot();
