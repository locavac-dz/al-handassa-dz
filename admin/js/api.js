/* =============================================
   Al Handassa.dz — Service API
   ============================================= */

const API_BASE = 'http://localhost:5000/api';

// ── Token storage ───────────────────────────────────────────────────────────

const Auth = {
  getToken()        { return localStorage.getItem('hds_token'); },
  getRefresh()      { return localStorage.getItem('hds_refresh'); },
  getUser()         { try { return JSON.parse(localStorage.getItem('hds_user')); } catch { return null; } },
  save(token, refresh, user) {
    localStorage.setItem('hds_token',   token);
    localStorage.setItem('hds_refresh', refresh);
    localStorage.setItem('hds_user',    JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('hds_token');
    localStorage.removeItem('hds_refresh');
    localStorage.removeItem('hds_user');
  },
  isLoggedIn() { return !!this.getToken(); },
};

// ── HTTP helper ─────────────────────────────────────────────────────────────

async function http(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Auth.getToken()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error || data.message || `Erreur ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const get  = (path, auth)        => http('GET',    path, null, auth);
const post = (path, body, auth)  => http('POST',   path, body, auth);
const put  = (path, body)        => http('PUT',    path, body);
const del  = (path)              => http('DELETE', path);

// ── Auth API ────────────────────────────────────────────────────────────────

const api = {

  async login(email, password) {
    const data = await post('/auth/login', { email, password }, false);
    Auth.save(data.access_token, data.refresh_token, data.user);
    return data;
  },

  async register(payload) {
    const data = await post('/auth/register', payload, false);
    Auth.save(data.access_token, data.refresh_token, data.user);
    return data;
  },

  async forgotPassword(email) {
    return post('/auth/forgot-password', { email }, false);
  },

  async resetPassword(token, password) {
    return post('/auth/reset-password', { token, password }, false);
  },

  async logout() {
    try { await post('/auth/logout', { refresh_token: Auth.getRefresh() }); } catch {}
    Auth.clear();
  },

  async me() {
    return get('/auth/me');
  },

  // ── Products ──────────────────────────────────────────────────────────────

  async products(params = {}) {
    const q = new URLSearchParams(params).toString();
    return get('/products' + (q ? '?' + q : ''), false);
  },

  async product(slug) {
    return get('/products/' + slug, false);
  },

  async addReview(productId, rating, comment) {
    return post('/products/' + productId + '/reviews', { rating, comment });
  },

  async manualPayment(order_id, method, reference, proof_note) {
    return post('/payment/manual', { order_id, method, reference, proof_note });
  },

  // ── Videos ───────────────────────────────────────────────────────────────

  async videos(params = {}) {
    const q = new URLSearchParams(params).toString();
    return get('/videos' + (q ? '?' + q : ''), false);
  },

  // ── Articles ──────────────────────────────────────────────────────────────

  async articles(params = {}) {
    const q = new URLSearchParams(params).toString();
    return get('/articles' + (q ? '?' + q : ''), false);
  },

  async article(slug) {
    return get('/articles/' + slug, true); // token optionnel (accès premium)
  },

  // ── Orders ────────────────────────────────────────────────────────────────

  async createOrder(items, payment_method, coupon_code) {
    return post('/orders', { items, payment_method, coupon_code });
  },

  async myOrders() {
    return get('/orders');
  },

  // ── Newsletter ────────────────────────────────────────────────────────────

  async subscribe(email, first_name) {
    return post('/newsletter/subscribe', { email, first_name }, false);
  },

  // ── Wishlist ──────────────────────────────────────────────────────────────

  async wishlist() {
    return get('/users/wishlist');
  },

  async toggleWishlist(product_id, video_id) {
    return post('/users/wishlist', { product_id, video_id });
  },

  // ── Subscription ─────────────────────────────────────────────────────────

  async mySubscription() {
    return get('/users/subscription');
  },

  // ── Downloads ─────────────────────────────────────────────────────────────

  async myDownloads() {
    return get('/users/downloads');
  },

  // ── Helpers ───────────────────────────────────────────────────────────────

  Auth,
};

window.api = api;
window.Auth = Auth;
