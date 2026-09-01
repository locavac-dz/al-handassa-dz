// Multi-language system (FR/AR/EN)

const translations = {
  fr: {
    // Navigation
    'nav.catalog': 'Catalogue',
    'nav.search': 'Rechercher',
    'nav.cart': 'Panier',
    'nav.favorites': 'Favoris',
    'nav.account': 'Compte',
    'nav.logout': 'Déconnexion',

    // Products
    'product.price': 'Prix',
    'product.add_to_cart': 'Ajouter au panier',
    'product.add_to_favorites': 'Ajouter aux favoris',
    'product.buy_now': 'Acheter maintenant',
    'product.in_stock': 'En stock',
    'product.out_of_stock': 'Rupture de stock',

    // Cart
    'cart.empty': 'Votre panier est vide',
    'cart.subtotal': 'Sous-total',
    'cart.shipping': 'Frais de livraison',
    'cart.total': 'Total',
    'cart.checkout': 'Procéder au paiement',

    // Checkout
    'checkout.first_name': 'Prénom',
    'checkout.last_name': 'Nom',
    'checkout.email': 'Email',
    'checkout.phone': 'Téléphone',
    'checkout.address': 'Adresse',
    'checkout.city': 'Ville',
    'checkout.wilaya': 'Wilaya',
    'checkout.payment_method': 'Méthode de paiement',
    'checkout.card': 'Carte Bancaire',
    'checkout.baridimob': 'BaridiMob',
    'checkout.bank_transfer': 'Virement Bancaire',

    // Messages
    'msg.success': 'Succès',
    'msg.error': 'Erreur',
    'msg.loading': 'Chargement...',
    'msg.confirm': 'Confirmer',
    'msg.cancel': 'Annuler',
  },
  ar: {
    'nav.catalog': 'الكتالوج',
    'nav.search': 'بحث',
    'nav.cart': 'السلة',
    'nav.favorites': 'المفضلة',
    'nav.account': 'الحساب',
    'nav.logout': 'تسجيل الخروج',

    'product.price': 'السعر',
    'product.add_to_cart': 'أضف إلى السلة',
    'product.add_to_favorites': 'أضف إلى المفضلة',
    'product.buy_now': 'اشتري الآن',
    'product.in_stock': 'متوفر',
    'product.out_of_stock': 'غير متوفر',

    'cart.empty': 'سلتك فارغة',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.shipping': 'رسوم الشحن',
    'cart.total': 'المجموع',
    'cart.checkout': 'الدفع',

    'checkout.first_name': 'الاسم الأول',
    'checkout.last_name': 'الاسم الأخير',
    'checkout.email': 'البريد الإلكتروني',
    'checkout.phone': 'الهاتف',
    'checkout.address': 'العنوان',
    'checkout.city': 'المدينة',
    'checkout.wilaya': 'الولاية',
    'checkout.payment_method': 'طريقة الدفع',
    'checkout.card': 'بطاقة بنكية',
    'checkout.baridimob': 'باريديموب',
    'checkout.bank_transfer': 'تحويل بنكي',

    'msg.success': 'نجح',
    'msg.error': 'خطأ',
    'msg.loading': 'جاري التحميل...',
    'msg.confirm': 'تأكيد',
    'msg.cancel': 'إلغاء',
  },
  en: {
    'nav.catalog': 'Catalog',
    'nav.search': 'Search',
    'nav.cart': 'Cart',
    'nav.favorites': 'Favorites',
    'nav.account': 'Account',
    'nav.logout': 'Logout',

    'product.price': 'Price',
    'product.add_to_cart': 'Add to Cart',
    'product.add_to_favorites': 'Add to Favorites',
    'product.buy_now': 'Buy Now',
    'product.in_stock': 'In Stock',
    'product.out_of_stock': 'Out of Stock',

    'cart.empty': 'Your cart is empty',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',

    'checkout.first_name': 'First Name',
    'checkout.last_name': 'Last Name',
    'checkout.email': 'Email',
    'checkout.phone': 'Phone',
    'checkout.address': 'Address',
    'checkout.city': 'City',
    'checkout.wilaya': 'State',
    'checkout.payment_method': 'Payment Method',
    'checkout.card': 'Credit Card',
    'checkout.baridimob': 'BaridiMob',
    'checkout.bank_transfer': 'Bank Transfer',

    'msg.success': 'Success',
    'msg.error': 'Error',
    'msg.loading': 'Loading...',
    'msg.confirm': 'Confirm',
    'msg.cancel': 'Cancel',
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('hds_lang') || 'fr';
  }

  t(key) {
    return translations[this.currentLang]?.[key] || key;
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('hds_lang', lang);
      window.location.reload();
    }
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  getAvailableLanguages() {
    return ['fr', 'ar', 'en'];
  }
}

const i18n = new I18n();

// Global function for templates
function t(key) {
  return i18n.t(key);
}
