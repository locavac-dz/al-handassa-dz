// Système de recommandations de produits

class ProductRecommendations {
  constructor() {
    this.API = 'http://localhost:5000/api';
    this.purchaseHistory = JSON.parse(localStorage.getItem('hds_purchase_history') || '[]');
  }

  // Recommandations basées sur catégorie
  async getRelatedProducts(productId, category) {
    try {
      const res = await fetch(`${this.API}/products?category=${category}&limit=4`);
      const data = await res.json();
      return (data.data || []).filter(p => p.id !== productId).slice(0, 3);
    } catch (err) {
      console.error('Erreur recommandations:', err);
      return [];
    }
  }

  // Produits populaires
  async getPopularProducts(limit = 6) {
    try {
      const res = await fetch(`${this.API}/products?limit=${limit}&sort=rating`);
      const data = await res.json();
      return (data.data || []).slice(0, limit);
    } catch (err) {
      return [];
    }
  }

  // Recommandations personnalisées basées sur l'historique
  getPersonalizedRecommendations(allProducts) {
    if (this.purchaseHistory.length === 0) return [];

    const categoryScores = {};
    this.purchaseHistory.forEach(item => {
      categoryScores[item.category] = (categoryScores[item.category] || 0) + 1;
    });

    const topCategory = Object.keys(categoryScores).sort((a, b) => categoryScores[b] - categoryScores[a])[0];

    return allProducts
      .filter(p => p.category === topCategory && !this.purchaseHistory.find(h => h.id === p.id))
      .slice(0, 4);
  }

  // Sauvegarder un achat
  recordPurchase(product) {
    if (!this.purchaseHistory.find(p => p.id === product.id)) {
      this.purchaseHistory.push({
        id: product.id,
        title: product.title,
        category: product.category,
        purchased_at: new Date().toISOString()
      });
      localStorage.setItem('hds_purchase_history', JSON.stringify(this.purchaseHistory));
    }
  }

  // Rendre une section de recommandations
  renderSection(container, title, products) {
    if (!container || products.length === 0) return;

    const html = `
      <div style="margin: 40px 0;">
        <h3 style="color: #1B3A6B; font-size: 18px; font-weight: 700; margin-bottom: 20px;">${title}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
          ${products.map(p => `
            <div style="border: 1px solid #e0e4e8; border-radius: 8px; padding: 12px; cursor: pointer;" onclick="location.href='product.html?slug=${p.slug}'">
              <div style="width: 100%; height: 150px; background: #f0f0f0; border-radius: 4px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center;">
                <img src="http://localhost:5000${p.thumbnail_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">
              </div>
              <div style="font-weight: 600; color: #1B3A6B; font-size: 13px; margin-bottom: 8px;">${p.title}</div>
              <div style="color: #D4A017; font-weight: 700;">${(p.price || 0).toLocaleString('fr-DZ')} DA</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
  }
}

const recommendations = new ProductRecommendations();
