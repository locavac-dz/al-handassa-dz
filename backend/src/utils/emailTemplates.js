/**
 * Templates d'email pour Al Handassa.dz
 */

const emailTemplates = {
  /**
   * Email de confirmation de commande
   */
  orderConfirmation: (order, user) => ({
    subject: `Commande confirmée #${order.id} — Al Handassa.dz`,
    html: `
      <!DOCTYPE html>
      <html lang="fr" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Cairo, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1B3A6B, #2563a8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border: 1px solid #e0e4e8; border-radius: 0 0 8px 8px; }
          .order-number { font-size: 18px; font-weight: 700; color: #1B3A6B; margin: 20px 0 10px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #f9fafb; color: #1B3A6B; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e0e4e8; }
          .items-table td { padding: 12px; border-bottom: 1px solid #e0e4e8; }
          .total-row { background: #f9fafb; font-weight: 700; color: #D4A017; font-size: 18px; }
          .button { display: inline-block; background: linear-gradient(135deg, #1B3A6B, #2563a8); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #e0e4e8; }
          .badge { display: inline-block; background: #D4A017; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Commande confirmée</h1>
          </div>

          <div class="content">
            <p>Bonjour <strong>${user.first_name} ${user.last_name}</strong>,</p>

            <p>Votre commande a été confirmée avec succès. Vous recevrez bientôt vos ressources.</p>

            <div class="order-number">
              Commande #${order.id}
              <span class="badge">Confirmée</span>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Sous-total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price.toLocaleString('fr-DZ')} DA</td>
                    <td>${(item.price * item.quantity).toLocaleString('fr-DZ')} DA</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total</td>
                  <td>${order.total_amount.toLocaleString('fr-DZ')} DA</td>
                </tr>
              </tbody>
            </table>

            <p style="background: #f0f7ff; padding: 16px; border-left: 4px solid #1B3A6B; border-radius: 4px;">
              <strong>📥 Lien de téléchargement :</strong><br>
              Accédez à vos ressources achetées sur votre espace personnel.
            </p>

            <a href="${process.env.APP_URL}/downloads.html" class="button">Voir mes téléchargements</a>

            <p>Si vous avez des questions, contactez-nous à <strong>support@handassi.dz</strong></p>
          </div>

          <div class="footer">
            <p>© 2026 Al Handassa.dz — Plateforme numérique de génie civil et architecture en Algérie</p>
            <p>Email: support@handassi.dz | Tél: +213 (0)23 XX XX XX</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  /**
   * Email de bienvenue pour nouvel utilisateur
   */
  welcomeUser: (user) => ({
    subject: `Bienvenue sur Al Handassa.dz!`,
    html: `
      <!DOCTYPE html>
      <html lang="fr" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Cairo, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1B3A6B, #2563a8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e4e8; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #1B3A6B, #2563a8); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue!</h1>
          </div>

          <div class="content">
            <p>Bonjour <strong>${user.first_name}</strong>,</p>

            <p>Merci de vous être inscrit sur <strong>Al Handassa.dz</strong> — la plateforme de référence pour les ressources de génie civil et d'architecture en Algérie.</p>

            <h3>Vos avantages:</h3>
            <ul>
              <li>✅ Accès à plus de 2 400 ressources (cours, TD, TP, normes DTR)</li>
              <li>✅ Téléchargements illimités une fois achetés</li>
              <li>✅ Contenu mis à jour régulièrement</li>
              <li>✅ Support en français et en arabe</li>
            </ul>

            <a href="${process.env.APP_URL}" class="button">Explore le catalogue</a>

            <p style="background: #f0f7ff; padding: 16px; border-left: 4px solid #1B3A6B; border-radius: 4px;">
              Besoin d'aide? Consultez notre <strong>FAQ</strong> ou contactez notre équipe support.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  /**
   * Email de réinitialisation de mot de passe
   */
  passwordReset: (user, resetLink) => ({
    subject: `Réinitialisation de votre mot de passe — Al Handassa.dz`,
    html: `
      <!DOCTYPE html>
      <html lang="fr" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Cairo, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: white; padding: 30px; border: 1px solid #e0e4e8; border-radius: 8px; }
          .warning { background: #fff3cd; padding: 16px; border-left: 4px solid #ff6b6b; border-radius: 4px; color: #856404; }
          .button { display: inline-block; background: #1B3A6B; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <p>Bonjour <strong>${user.first_name}</strong>,</p>

            <p>Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe:</p>

            <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>

            <p style="color: #999; font-size: 12px;">
              Ce lien est valide pendant <strong>24 heures</strong> et ne peut être utilisé qu'une seule fois.
            </p>

            <div class="warning">
              <strong>⚠️ Sécurité:</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre compte reste sécurisé.
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Pour votre sécurité, ne partagez jamais ce lien avec d'autres personnes.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  /**
   * Email de notification admin (nouvelle commande)
   */
  adminNotification: (order) => ({
    subject: `[ADMIN] Nouvelle commande #${order.id}`,
    html: `
      <h2>Nouvelle commande reçue</h2>
      <p><strong>Commande ID:</strong> ${order.id}</p>
      <p><strong>Client:</strong> ${order.first_name} ${order.last_name}</p>
      <p><strong>Email:</strong> ${order.email}</p>
      <p><strong>Montant:</strong> ${order.total_amount} DA</p>
      <p><strong>Méthode de paiement:</strong> ${order.payment_method}</p>
      <p><strong>Nombre de produits:</strong> ${order.items.length}</p>
      <hr>
      <h3>Détails des produits:</h3>
      <ul>
        ${order.items.map(item => `<li>${item.title} (Qty: ${item.quantity})</li>`).join('')}
      </ul>
    `
  })
};

module.exports = emailTemplates;
