// Email Notification Service - Production Ready

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS // Google App Password (16 chars)
      }
    });

    this.from = process.env.SMTP_FROM || 'noreply@alhandassa.dz';
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order, user) {
    const html = `
      <h2>Commande Confirmée #${order.id}</h2>
      <p>Bonjour ${order.first_name},</p>
      <p>Votre commande a été reçue avec succès.</p>

      <h3>Détails de la Commande:</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background: #f5f5f5;">
          <th style="padding: 10px; text-align: left;">Produit</th>
          <th style="padding: 10px; text-align: right;">Quantité</th>
          <th style="padding: 10px; text-align: right;">Prix</th>
        </tr>
        ${order.items.map(item => `
          <tr>
            <td style="padding: 10px;">${item.title}</td>
            <td style="padding: 10px; text-align: right;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right;">${item.price} DA</td>
          </tr>
        `).join('')}
      </table>

      <h3 style="margin-top: 20px;">Montant Total: ${order.total_amount} DA</h3>

      <p>Status: <strong>${order.payment_status}</strong></p>
      <p>Ref: <strong>${order.transaction_id || 'N/A'}</strong></p>

      <p style="margin-top: 30px; color: #666;">
        Merci pour votre achat!<br>
        Al Handassa.dz
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: order.email,
        subject: `Commande Confirmée #${order.id}`,
        html: html
      });
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send abandoned cart reminder
   */
  async sendAbandonedCartReminder(user, cart) {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const html = `
      <h2>Vous avez oublié votre panier!</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Vous avez des articles dans votre panier depuis ${new Date().toLocaleDateString('fr-FR')}.</p>

      <h3>Articles:</h3>
      <ul>
        ${cart.map(item => `<li>${item.title} (${item.quantity}x)</li>`).join('')}
      </ul>

      <p><strong>Total: ${cartTotal} DA</strong></p>

      <p>
        <a href="${process.env.APP_URL}/cart.html" style="background: #1B3A6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Finaliser l'achat
        </a>
      </p>

      <p style="color: #999; font-size: 12px;">
        Cet article expirera dans 7 jours.
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: user.email,
        subject: 'Vous avez oublié votre panier!',
        html: html
      });
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send new product notification
   */
  async sendNewProductNotification(user, product) {
    const html = `
      <h2>Nouveau produit: ${product.title}</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Un nouveau produit dans votre catégorie préférée est disponible!</p>

      <h3>${product.title}</h3>
      <p>${product.description}</p>

      <p><strong>Prix: ${product.price} DA</strong></p>
      <p><strong>Rating: ${product.rating_avg || 'N/A'} ⭐</strong></p>

      <p>
        <a href="${process.env.APP_URL}/product.html?id=${product.id}" style="background: #1B3A6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Voir le produit
        </a>
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: user.email,
        subject: `Nouveau: ${product.title}`,
        html: html
      });
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess(order) {
    const html = `
      <h2>Paiement Reçu ✅</h2>
      <p>Bonjour ${order.first_name},</p>
      <p>Votre paiement a été accepté avec succès!</p>

      <p>
        Référence: <strong>${order.transaction_id}</strong><br>
        Montant: <strong>${order.total_amount} DA</strong><br>
        Date: <strong>${new Date().toLocaleDateString('fr-FR')}</strong>
      </p>

      <p>
        <a href="${process.env.APP_URL}/downloads.html" style="background: #1B3A6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Accéder à mes téléchargements
        </a>
      </p>

      <p style="color: #666;">
        Merci de votre confiance!<br>
        Al Handassa.dz
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: order.email,
        subject: 'Paiement Confirmé',
        html: html
      });
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send admin notification
   */
  async sendAdminNotification(subject, data) {
    const html = `
      <h2>${subject}</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
      <p>Time: ${new Date().toISOString()}</p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: process.env.ADMIN_EMAIL || 'admin@alhandassa.dz',
        subject: `[Admin] ${subject}`,
        html: html
      });
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test email connection
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
