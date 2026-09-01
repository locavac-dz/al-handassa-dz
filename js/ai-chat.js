// AI Chat Widget — Claude Powered Support

class AIChat {
  constructor() {
    this.API_ENDPOINT = 'http://localhost:5000/api/assistant';
    this.messages = [];
    this.isOpen = false;
    this.init();
  }

  init() {
    this.createWidget();
    this.attachEventListeners();
  }

  createWidget() {
    const html = `
      <div id="ai-chat-widget" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: Cairo, sans-serif;
      ">
        <button id="ai-chat-toggle" style="
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1B3A6B, #2563a8);
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: all 0.2s;
        ">💬</button>

        <div id="ai-chat-panel" style="
          display: none;
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 5px 40px rgba(0,0,0,0.16);
          flex-direction: column;
          overflow: hidden;
        ">
          <div style="
            background: linear-gradient(135deg, #1B3A6B, #2563a8);
            color: white;
            padding: 16px;
            font-weight: 700;
            text-align: center;
          ">
            🤖 Support IA Al Handassa
          </div>

          <div id="ai-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f9fafb;
          "></div>

          <div style="padding: 12px; border-top: 1px solid #e0e4e8;">
            <div style="display: flex; gap: 8px;">
              <input type="text" id="ai-input" placeholder="Posez votre question..." style="
                flex: 1;
                padding: 10px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-family: Cairo;
                font-size: 14px;
              ">
              <button id="ai-send" style="
                padding: 10px 16px;
                background: #1B3A6B;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
              ">▶</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  attachEventListeners() {
    const toggle = document.getElementById('ai-chat-toggle');
    const panel = document.getElementById('ai-chat-panel');
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');

    toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      panel.style.display = this.isOpen ? 'flex' : 'none';
      if (this.isOpen) input.focus();
    });

    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  async sendMessage() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    if (!message) return;

    // Ajouter le message utilisateur
    this.addMessage(message, 'user');
    input.value = '';

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: message,
          context: this.getPageContext()
        })
      });

      const data = await response.json();
      this.addMessage(data.answer || 'Je n\'ai pas pu répondre à cette question.', 'bot');
    } catch (err) {
      // Fallback: réponses heuristiques si API non disponible
      const answer = this.getHeuristicAnswer(message);
      this.addMessage(answer, 'bot');
    }
  }

  addMessage(text, sender) {
    const messagesDiv = document.getElementById('ai-messages');
    const msgEl = document.createElement('div');
    msgEl.style.cssText = `
      margin-bottom: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      max-width: 90%;
      word-wrap: break-word;
      ${sender === 'user'
        ? 'background: #1B3A6B; color: white; margin-left: auto; text-align: right;'
        : 'background: #e0e4e8; color: #1B3A6B;'
      }
    `;
    msgEl.textContent = text;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  getPageContext() {
    return {
      page: window.location.pathname,
      userLoggedIn: !!localStorage.getItem('hds_token'),
      cartCount: JSON.parse(localStorage.getItem('hds_cart') || '[]').length
    };
  }

  getHeuristicAnswer(question) {
    const q = question.toLowerCase();

    if (q.includes('panier') || q.includes('cart')) {
      return 'Vous pouvez ajouter des produits à votre panier en cliquant sur "Ajouter au panier". Accédez-y via le bouton 🛒 en haut de la page.';
    }
    if (q.includes('cherch') || q.includes('search')) {
      return 'Utilisez la barre de recherche en haut pour trouver rapidement des ressources. Vous pouvez chercher par titre, catégorie ou tags.';
    }
    if (q.includes('prix') || q.includes('price')) {
      return 'Vous trouverez les prix affichés sur chaque fiche produit. Utilisez les filtres pour affiner par gamme de prix.';
    }
    if (q.includes('livraison') || q.includes('download')) {
      return 'Les ressources achetées sont disponibles immédiatement en téléchargement après confirmation du paiement.';
    }
    if (q.includes('contact') || q.includes('support')) {
      return 'Vous pouvez nous contacter via contact@alhandassa.dz ou utiliser le formulaire de contact en bas de page.';
    }
    if (q.includes('favoris') || q.includes('wishlist')) {
      return 'Cliquez sur le cœur 💙 pour ajouter un produit à vos favoris. Accédez-les via la page "Mes Favoris".';
    }

    return '💡 Je peux vous aider avec:\n• Panier et checkout\n• Recherche de produits\n• Filtres et favoris\n• Livraisons et téléchargements\n\nPouvez-vous reformuler votre question?';
  }
}

// Initialiser au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AIChat());
} else {
  new AIChat();
}
