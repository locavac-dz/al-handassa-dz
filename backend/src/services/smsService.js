// SMS Notifications via Twilio or local provider

const axios = require('axios');

class SMSService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER;
    this.apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
  }

  /**
   * Send SMS
   */
  async sendSMS(toPhone, message) {
    try {
      const response = await axios.post(
        this.apiUrl,
        new URLSearchParams({
          From: this.fromPhone,
          To: toPhone,
          Body: message
        }),
        {
          auth: {
            username: this.accountSid,
            password: this.authToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return { success: true, messageId: response.data.sid };
    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmation(phone, order) {
    const message = `✓ Commande confirmée #${order.id}
Montant: ${order.total_amount} DA
Suivi: ${process.env.APP_URL}/order/${order.id}
Merci! - Al Handassa.dz`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(phone, orderId, amount) {
    const message = `Rappel de paiement: Commande #${orderId}
Montant: ${amount} DA
Payer maintenant: ${process.env.APP_URL}/checkout.html?order=${orderId}`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send shipping notification
   */
  async sendShippingNotification(phone, orderId, trackingNumber) {
    const message = `📦 Votre commande #${orderId} est expédiée
Suivi: ${trackingNumber}
Détails: ${process.env.APP_URL}/order/${orderId}`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send promotional SMS
   */
  async sendPromoSMS(phone, promoCode, discount) {
    const message = `🎉 Code promo exclusif: ${promoCode}
Réduction: ${discount}% sur tous les produits
Valable 48h: ${process.env.APP_URL}`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send cart abandonment reminder
   */
  async sendCartReminder(phone, cartValue) {
    const message = `Panier oublié? ${cartValue} DA en attente
Finaliser: ${process.env.APP_URL}/cart.html
Valable 24h`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send OTP for verification
   */
  async sendOTP(phone, otp) {
    const message = `Code de vérification Al Handassa.dz: ${otp}
Valable 10 minutes. Ne partagez pas ce code.`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send batch SMS
   */
  async sendBatch(phoneNumbers, message) {
    const results = await Promise.all(
      phoneNumbers.map(phone => this.sendSMS(phone, message))
    );

    return {
      success: true,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
}

module.exports = new SMSService();
