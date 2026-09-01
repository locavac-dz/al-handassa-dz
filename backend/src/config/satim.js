/**
 * Configuration SATIM - Paiement par Carte Bancaire Algérien
 * SATIM est le système de paiement par carte bancaire de la banque algérienne
 */

const SATIM_CONFIG = {
  // URLs SATIM (à remplacer avec vos vrais identifiants)
  API_ENDPOINT: process.env.SATIM_API_ENDPOINT || 'https://payment.satim.dz/api/payment',
  REDIRECT_SUCCESS: process.env.SATIM_REDIRECT_SUCCESS || `${process.env.APP_URL}/payment-success.html`,
  REDIRECT_FAILURE: process.env.SATIM_REDIRECT_FAILURE || `${process.env.APP_URL}/payment-failed.html`,

  // Identifiant commerce SATIM (à configurer dans .env)
  MERCHANT_ID: process.env.SATIM_MERCHANT_ID || 'demo-merchant-id',
  MERCHANT_KEY: process.env.SATIM_MERCHANT_KEY || 'demo-merchant-key',

  // Configuration de sécurité
  REQUEST_TIMEOUT: 30000, // 30 secondes
  ENABLE_3D_SECURE: true,
  CURRENCY_CODE: '504', // Code ISO pour Dinar Algérien

  // Types de transaction supportés
  TRANSACTION_TYPES: {
    SALE: '00', // Vente immédiate
    AUTH: '01', // Autorisation
    CAPTURE: '02', // Capture
    REFUND: '03' // Remboursement
  },

  // Messages d'erreur
  ERROR_MESSAGES: {
    INVALID_AMOUNT: 'Montant invalide',
    INVALID_CARD: 'Carte bancaire invalide',
    CARD_DECLINED: 'Carte refusée',
    EXPIRED_CARD: 'Carte expirée',
    INSUFFICIENT_FUNDS: 'Solde insuffisant',
    TIMEOUT: 'Délai d\'attente dépassé',
    CONNECTION_ERROR: 'Erreur de connexion au serveur SATIM',
    UNKNOWN_ERROR: 'Erreur inconnue lors du paiement'
  }
};

/**
 * Classe pour gérer les paiements SATIM
 */
class SATIMPaymentGateway {
  constructor() {
    this.merchantId = SATIM_CONFIG.MERCHANT_ID;
    this.merchantKey = SATIM_CONFIG.MERCHANT_KEY;
  }

  /**
   * Générer une référence de transaction unique
   */
  generateTransactionReference() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${random}`;
  }

  /**
   * Valider le montant (entre 100 DA et 999999 DA)
   */
  validateAmount(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100 || numAmount > 999999) {
      throw new Error(SATIM_CONFIG.ERROR_MESSAGES.INVALID_AMOUNT);
    }
    return numAmount;
  }

  /**
   * Créer une demande de paiement SATIM
   */
  async createPaymentRequest(order) {
    try {
      // Valider le montant
      const amount = this.validateAmount(order.total_amount);

      // Générer une référence unique
      const transactionRef = this.generateTransactionReference();

      // Construire la requête SATIM
      const paymentRequest = {
        merchant_id: this.merchantId,
        transaction_ref: transactionRef,
        amount: Math.round(amount * 100), // Montant en centimes
        currency: SATIM_CONFIG.CURRENCY_CODE,
        description: `Achat ${order.id} - ${order.items.length} produit(s)`,
        customer: {
          first_name: order.first_name,
          last_name: order.last_name,
          email: order.email,
          phone: order.phone
        },
        redirect_urls: {
          success: SATIM_CONFIG.REDIRECT_SUCCESS,
          failure: SATIM_CONFIG.REDIRECT_FAILURE
        },
        billing_address: {
          wilaya: order.wilaya,
          country: 'DZ'
        },
        items: order.items.map(item => ({
          name: item.title,
          quantity: item.quantity,
          unit_price: Math.round(item.price * 100),
          description: `Produit ID: ${item.id}`
        }))
      };

      // Signer la requête avec la clé du marchand
      const signature = this.signRequest(paymentRequest);
      paymentRequest.signature = signature;

      return {
        success: true,
        transaction_ref: transactionRef,
        payment_request: paymentRequest,
        redirect_url: `${SATIM_CONFIG.API_ENDPOINT}?request=${Buffer.from(JSON.stringify(paymentRequest)).toString('base64')}`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        transaction_ref: null
      };
    }
  }

  /**
   * Signer une requête avec la clé marchande (simple HMAC-SHA256)
   */
  signRequest(request) {
    const crypto = require('crypto');
    const requestString = JSON.stringify(request);
    return crypto.createHmac('sha256', this.merchantKey).update(requestString).digest('hex');
  }

  /**
   * Vérifier une signature de réponse SATIM
   */
  verifySignature(response, signature) {
    const crypto = require('crypto');
    const responseString = JSON.stringify(response);
    const expectedSignature = crypto.createHmac('sha256', this.merchantKey).update(responseString).digest('hex');
    return signature === expectedSignature;
  }

  /**
   * Traiter une réponse SATIM
   */
  async processPaymentResponse(response, signature) {
    try {
      // Vérifier la signature
      if (!this.verifySignature(response, signature)) {
        throw new Error('Signature de paiement invalide');
      }

      // Vérifier le statut
      const statusMap = {
        '00': { status: 'success', message: 'Paiement réussi' },
        '01': { status: 'pending', message: 'Paiement en attente' },
        '02': { status: 'failed', message: 'Paiement refusé' },
        '03': { status: 'cancelled', message: 'Paiement annulé' },
        '04': { status: 'error', message: 'Erreur du serveur' }
      };

      const statusInfo = statusMap[response.response_code] || {
        status: 'error',
        message: SATIM_CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR
      };

      return {
        transaction_ref: response.transaction_ref,
        status: statusInfo.status,
        message: statusInfo.message,
        amount: response.amount,
        card_last4: response.card_last4,
        authorization_code: response.authorization_code,
        response_code: response.response_code,
        timestamp: new Date(response.timestamp)
      };

    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        transaction_ref: null
      };
    }
  }
}

module.exports = {
  SATIM_CONFIG,
  SATIMPaymentGateway
};
