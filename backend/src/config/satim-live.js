// SATIM Live Integration - Production Ready

const crypto = require('crypto');
const https = require('https');

class SATIMLive {
  constructor() {
    this.merchantId = process.env.SATIM_MERCHANT_ID;
    this.merchantKey = process.env.SATIM_MERCHANT_KEY;
    this.apiEndpoint = process.env.SATIM_API_ENDPOINT || 'https://payment.satim.dz/api/payment';
    this.successUrl = process.env.SATIM_SUCCESS_URL || 'https://your-domain.railway.app/payment-success.html';
    this.failureUrl = process.env.SATIM_FAILURE_URL || 'https://your-domain.railway.app/payment-failed.html';
  }

  /**
   * Create payment request for SATIM gateway
   */
  async createPayment(order) {
    try {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const paymentData = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        amount: Math.round(order.total_amount * 100), // Convert to cents
        currency: 'DZD',
        description: `Commande #${order.id}`,
        customer: {
          first_name: order.first_name,
          last_name: order.last_name,
          email: order.email,
          phone: order.phone
        },
        billing_address: {
          city: order.city || order.wilaya,
          state: order.wilaya,
          country: 'DZ'
        },
        return_urls: {
          success: `${this.successUrl}?txn=${transactionId}`,
          failure: `${this.failureUrl}?txn=${transactionId}`
        },
        items: order.items.map(item => ({
          name: item.title,
          quantity: item.quantity,
          unit_price: Math.round(item.price * 100),
          description: `Product ID: ${item.id}`
        }))
      };

      // Sign request
      const signature = this.signPayment(paymentData);
      paymentData.signature = signature;

      // Send to SATIM
      const response = await this.sendToSATIM(paymentData);

      return {
        success: true,
        transaction_id: transactionId,
        payment_url: response.payment_url,
        order_id: order.id,
        amount: order.total_amount
      };

    } catch (error) {
      console.error('SATIM Payment Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sign payment request with merchant key
   */
  signPayment(data) {
    const message = JSON.stringify(data);
    return crypto.createHmac('sha256', this.merchantKey).update(message).digest('hex');
  }

  /**
   * Send to SATIM endpoint
   */
  async sendToSATIM(data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Al-Handassa/1.0'
        }
      };

      const req = https.request(this.apiEndpoint, options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Invalid SATIM response'));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Verify payment confirmation from SATIM
   */
  verifyPaymentConfirmation(response, signature) {
    const expectedSignature = crypto.createHmac('sha256', this.merchantKey)
      .update(JSON.stringify(response))
      .digest('hex');

    return signature === expectedSignature;
  }
}

module.exports = SATIMLive;
