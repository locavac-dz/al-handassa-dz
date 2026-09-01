// ═══════════════════════════════════════════════════════════════════════════════
// PANIER — Gestion du panier en localStorage
// ═══════════════════════════════════════════════════════════════════════════════

const CART_KEY = 'hds_cart';
const API = 'http://localhost:5000/api';

class Cart {
  constructor() {
    this.items = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  save() {
    localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    this.updateBadge();
  }

  addProduct(product) {
    // Vérifier si déjà dans le panier
    const existing = this.items.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        price: product.price || 0,
        slug: product.slug,
        type: product.type,
        quantity: 1
      });
    }
    this.save();
  }

  removeProduct(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeProduct(productId);
      } else {
        item.quantity = quantity;
        this.save();
      }
    }
  }

  clear() {
    this.items = [];
    this.save();
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = this.getCount();
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

const cart = new Cart();

// Initialiser le badge au chargement
document.addEventListener('DOMContentLoaded', () => {
  cart.updateBadge();
  setupCartButton();
});

function setupCartButton() {
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      location.href = 'cart.html';
    });
  }
}

// Ajouter au panier — appelé depuis les cartes produit
function addToCart(productData) {
  if (!productData || !productData.id) {
    alert('Erreur: produit non valide');
    return;
  }
  cart.addProduct(productData);
  showToast(`✅ "${productData.title}" ajouté au panier`, 'success');
}
