// Système de Wishlist — Favoris utilisateur

class Wishlist {
  constructor() {
    this.items = this.load();
    this.initUI();
  }

  load() {
    const saved = localStorage.getItem('hds_wishlist');
    return saved ? JSON.parse(saved) : [];
  }

  save() {
    localStorage.setItem('hds_wishlist', JSON.stringify(this.items));
    this.updateBadge();
  }

  addProduct(product) {
    if (!this.items.find(p => p.id === product.id)) {
      this.items.push({
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        thumbnail_url: product.thumbnail_url,
        added_at: new Date().toISOString()
      });
      this.save();
      this.showNotification(`✅ ${product.title} ajouté aux favoris!`, 'success');
    } else {
      this.showNotification('💙 Déjà dans vos favoris', 'info');
    }
  }

  removeProduct(productId) {
    this.items = this.items.filter(p => p.id !== productId);
    this.save();
  }

  isInWishlist(productId) {
    return this.items.some(p => p.id === productId);
  }

  getCount() {
    return this.items.length;
  }

  clear() {
    this.items = [];
    this.save();
  }

  updateBadge() {
    const badge = document.getElementById('wishlist-badge');
    if (badge) {
      badge.textContent = this.getCount();
      badge.style.display = this.getCount() > 0 ? 'inline-block' : 'none';
    }
  }

  initUI() {
    // Ajouter le bouton wishlist à la navbar
    const nav = document.querySelector('nav, .nav');
    if (nav && !document.getElementById('wishlist-btn')) {
      const btn = document.createElement('button');
      btn.id = 'wishlist-btn';
      btn.className = 'nav-action';
      btn.innerHTML = `
        <span style="position: relative; cursor: pointer;">
          💙
          <span id="wishlist-badge" style="
            position: absolute; top: -8px; right: -8px;
            background: #ff4757; color: white; border-radius: 50%;
            width: 20px; height: 20px; font-size: 11px; font-weight: bold;
            display: flex; align-items: center; justify-content: center;
          ">${this.getCount()}</span>
        </span>
      `;
      btn.addEventListener('click', () => location.href = 'wishlist.html');
      nav.appendChild(btn);
    }
    this.updateBadge();
  }

  showNotification(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: ${type === 'success' ? '#10b981' : '#3b82f6'};
      color: white; padding: 12px 20px; border-radius: 6px;
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

const wishlist = new Wishlist();
