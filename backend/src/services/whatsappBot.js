// WhatsApp Business API Integration

const axios = require('axios');

class WhatsAppBot {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.apiUrl = `https://graph.instagram.com/v18.0/${this.phoneNumberId}`;
  }

  /**
   * Send text message
   */
  async sendMessage(recipientPhone, text) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'text',
          text: { body: text }
        },
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order confirmation
   */
  async sendOrderNotification(phone, order) {
    const message = `
✅ *Commande Confirmée* #${order.id}

📦 *Détails*:
${order.items.map(item => `• ${item.title} x${item.quantity}`).join('\n')}

💰 *Total*: ${order.total_amount} DA
📅 *Date*: ${new Date().toLocaleDateString('fr-FR')}

🔗 Suivre: ${process.env.APP_URL}/order/${order.id}

Merci pour votre achat! 🎉
    `;

    return this.sendMessage(phone, message);
  }

  /**
   * Send order status update
   */
  async sendStatusUpdate(phone, orderId, status) {
    const statusText = {
      pending: '⏳ En attente de paiement',
      completed: '✅ Paiement confirmé',
      shipped: '📦 Expédié',
      delivered: '🎉 Livré'
    };

    const message = `
Commande #${orderId}
${statusText[status] || status}

Suivre: ${process.env.APP_URL}/order/${orderId}
    `;

    return this.sendMessage(phone, message);
  }

  /**
   * Send product recommendation
   */
  async sendRecommendation(phone, product) {
    const message = `
🎁 *Produit Recommandé*

📚 *${product.title}*
${product.description}

💰 *Prix*: ${product.price} DA
⭐ *Note*: ${product.rating_avg}/5

📖 Voir plus: ${process.env.APP_URL}/product.html?id=${product.id}
    `;

    return this.sendMessage(phone, message);
  }

  /**
   * Send promotional message
   */
  async sendPromo(phone, promo) {
    const message = `
🎉 *Promotion Spéciale*

${promo.title}
${promo.description}

🔗 Profiter: ${process.env.APP_URL}${promo.link}

Valide jusqu'au: ${promo.expiresAt}
    `;

    return this.sendMessage(phone, message);
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(event) {
    try {
      if (event.type === 'message') {
        const { from, text } = event;
        return await this.respondToMessage(from, text.body);
      }

      if (event.type === 'order') {
        return await this.sendOrderNotification(event.phone, event.order);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-respond to messages
   */
  async respondToMessage(senderPhone, messageText) {
    let response = '';

    if (messageText.toLowerCase().includes('aide') || messageText.toLowerCase().includes('help')) {
      response = `
Bonjour! 👋

Je peux vous aider avec:
1️⃣ *Commandes* - Suivi de commande
2️⃣ *Produits* - Recherche de produits
3️⃣ *Compte* - Infos sur votre compte
4️⃣ *Support* - Contact support

Tapez le numéro (ex: 1, 2, 3, 4)
      `;
    } else if (messageText.match(/^\d+$/)) {
      const choice = parseInt(messageText);
      if (choice === 1) {
        response = 'Quel est votre numéro de commande?';
      } else if (choice === 2) {
        response = 'Qu\'est-ce que vous recherchez? (ex: béton, structures)';
      } else if (choice === 3) {
        response = 'Accédez à votre compte: ' + process.env.APP_URL + '/account.html';
      } else if (choice === 4) {
        response = 'Email: support@alhandassa.dz\nTéléphone: +213 XXX XX XX XX';
      }
    }

    if (response) {
      return this.sendMessage(senderPhone, response);
    }

    return { success: true };
  }
}

module.exports = new WhatsAppBot();
