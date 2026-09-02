/* =============================================
   Al Handassa.dz — Espace Utilisateur
   ============================================= */

const API_BASE = 'http://localhost:5000';

const TYPE_ICON = {
  ouvrage: '📚', cours_pdf: '📄', exercices: '✏️',
  normes: '📋', logiciels: '💻', pack: '📦', video: '🎬',
};
const TYPE_LABEL = {
  ouvrage: 'Ouvrage', cours_pdf: 'Cours PDF', exercices: 'Exercices',
  normes: 'Normes', logiciels: 'Logiciels', pack: 'Pack', video: 'Vidéo',
};
const METHOD_LABEL = {
  ccp: 'CCP', virement: 'Virement', baridimob: 'BaridiMob',
  cib: 'CIB', card: 'Carte bancaire',
};
const LEVEL_LABEL = {
  bac_technique: 'Bac technique', bts: 'BTS / DUT', licence: 'Licence',
  master: 'Master', ingenieur: 'Ingénieur', professionnel: 'Professionnel',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function initials(name) {
  return (name || '?').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
function fmt(n) { return Number(n || 0).toLocaleString('fr-DZ'); }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, type = 'ok') {
  const el = document.getElementById('acc-toast');
  el.innerHTML = `<i class="fas fa-${type === 'ok' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
  el.className = `acc-toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Téléchargement via fetch + blob ──────────────────────────────────────────
async function downloadFile(productId, title, btnEl) {
  btnEl.classList.add('loading');
  btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation…';
  try {
    const res = await fetch(`${API_BASE}/api/products/${productId}/download`, {
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `Erreur ${res.status}`);
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: title.replace(/[^\w\s؀-ۿ-]/g, '') + '.pdf',
    });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    toast('Téléchargement démarré !');
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btnEl.classList.remove('loading');
    btnEl.innerHTML = '<i class="fas fa-download"></i> Télécharger';
  }
}

// ═══════════════════════════════════════════════════════════
// APPLICATION
// ═══════════════════════════════════════════════════════════
const accountApp = {

  _user: null,
  _orderPage: 1,

  // ── Init ──────────────────────────────────────────────────────────────────
  async init() {
    const user = Auth.getUser();
    const token = Auth.getToken();

    if (!user || !token) {
      document.getElementById('auth-guard').style.display = 'flex';
      return;
    }

    this._user = user;
    document.getElementById('account-page').style.display = 'block';

    this._renderHero(user);
    this._renderNav(user);
    this._initSections();
    this._routeFromHash();
    window.addEventListener('hashchange', () => this._routeFromHash());

    // Bannière vérification email
    if (user.is_email_verified === false) this._showVerifyBanner();

    // Charger toutes les données en parallèle
    this._loadAllCounts();
  },

  // ── Bannière email non vérifié ─────────────────────────────────────────────
  _showVerifyBanner() {
    const banner = document.createElement('div');
    banner.id = 'verify-banner';
    banner.style.cssText = `
      background:#fffbeb; border-bottom:2px solid #fde68a;
      padding:12px 20px; display:flex; align-items:center;
      gap:12px; font-size:14px; color:#92400e;
    `;
    banner.innerHTML = `
      <span style="font-size:20px">📧</span>
      <span style="flex:1">
        <strong>Vérifiez votre adresse email</strong> —
        Consultez votre boîte mail et cliquez sur le lien de confirmation.
      </span>
      <button id="resend-verify-btn" style="
        background:#D97706; color:#fff; border:none; padding:6px 14px;
        border-radius:6px; font-size:13px; font-weight:600; cursor:pointer;
        white-space:nowrap;
      ">Renvoyer l'email</button>
      <button id="close-verify-banner" style="
        background:none; border:none; font-size:18px; cursor:pointer;
        color:#92400e; padding:0 4px; line-height:1;
      ">✕</button>
    `;
    document.body.insertAdjacentElement('afterbegin', banner);

    document.getElementById('close-verify-banner').onclick = () => banner.remove();
    document.getElementById('resend-verify-btn').onclick = async () => {
      const btn = document.getElementById('resend-verify-btn');
      btn.disabled = true; btn.textContent = '⏳ Envoi…';
      try {
        await http('POST', '/auth/resend-verification');
        btn.textContent = '✅ Envoyé !';
        btn.style.background = '#059669';
      } catch (e) {
        btn.textContent = e.message || 'Erreur';
        btn.disabled = false;
      }
    };
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  _renderHero(user) {
    document.getElementById('hero-avatar').textContent = initials(`${user.first_name} ${user.last_name}`);
    document.getElementById('hero-name').textContent   = `${user.first_name} ${user.last_name}`;
    document.getElementById('hero-email').textContent  = user.email;

    const plan = user.subscription_plan || 'free';
    const planLabels = { free: '🎓 Gratuit', standard: '⭐ Standard', pro: '👑 Pro' };
    const planEl = document.getElementById('hero-plan');
    planEl.textContent = planLabels[plan] || plan;
    planEl.className = `plan-badge ${plan}`;

    if (user.created_at) {
      document.getElementById('hero-since').textContent =
        `Membre depuis ${new Date(user.created_at).toLocaleDateString('fr-DZ', { month: 'long', year: 'numeric' })}`;
    }
  },

  // ── Nav ───────────────────────────────────────────────────────────────────
  _renderNav(user) {
    const zone = document.getElementById('nav-auth-zone');
    zone.innerHTML = `
      <div class="user-menu">
        <button class="user-menu-btn" onclick="this.nextElementSibling.classList.toggle('open')">
          <span class="user-avatar-sm">${initials(`${user.first_name} ${user.last_name}`)}</span>
          <span>${esc(user.first_name)}</span>
          <i class="fas fa-chevron-down" style="font-size:.7rem"></i>
        </button>
        <div class="user-dropdown">
          <a class="dropdown-item" href="account.html"><i class="fas fa-user"></i> Mon compte</a>
          <hr style="margin:6px 0;border-color:#e2e8f0">
          <button class="dropdown-item dropdown-logout" onclick="accountApp.logout()">
            <i class="fas fa-sign-out-alt"></i> Déconnexion
          </button>
        </div>
      </div>`;

    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });
  },

  async logout() {
    try { await api.logout(); } catch {}
    window.location.href = 'index.html';
  },

  // ── Navigation sections ───────────────────────────────────────────────────
  _initSections() {
    document.querySelectorAll('.acc-nav-item[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.goTo(link.dataset.section);
        history.pushState(null, '', link.getAttribute('href'));
      });
    });
  },

  _routeFromHash() {
    const hash = location.hash.replace('#', '') || 'downloads';
    const map = {
      downloads: 'sec-downloads',
      orders: 'sec-orders',
      wishlist: 'sec-wishlist',
      subscription: 'sec-subscription',
      profile: 'sec-profile',
    };
    this.goTo(map[hash] || 'sec-downloads');
  },

  goTo(sectionId) {
    document.querySelectorAll('.acc-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.acc-nav-item[data-section]').forEach(l => l.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    document.querySelector(`.acc-nav-item[data-section="${sectionId}"]`)?.classList.add('active');

    // Charger la section si pas encore fait
    const loaders = {
      'sec-downloads':   () => this.loadDownloads(),
      'sec-orders':      () => this.loadOrders(),
      'sec-wishlist':    () => this.loadWishlist(),
      'sec-subscription':() => this.loadSubscription(),
      'sec-profile':     () => this.loadProfile(),
    };
    if (loaders[sectionId]) loaders[sectionId]();
  },

  // ── Counts (badges sidebar) ───────────────────────────────────────────────
  async _loadAllCounts() {
    try {
      const [dl, wl, ord] = await Promise.allSettled([
        api.myDownloads(),
        api.wishlist(),
        api.myOrders(),
      ]);
      if (dl.status === 'fulfilled') this._setBadge('cnt-downloads', dl.value.data?.length);
      if (wl.status === 'fulfilled') this._setBadge('cnt-wishlist',  wl.value.data?.length);
      if (ord.status === 'fulfilled') this._setBadge('cnt-orders', ord.value.pagination?.total);
    } catch {}
  },

  _setBadge(id, n) {
    const el = document.getElementById(id);
    if (!el) return;
    if (n > 0) { el.textContent = n; el.style.display = 'inline-flex'; }
  },

  // ═════════════════════════ TÉLÉCHARGEMENTS ════════════════════════════════

  _dlLoaded: false,
  async loadDownloads() {
    if (this._dlLoaded) return;
    this._dlLoaded = true;
    const grid = document.getElementById('downloads-grid');
    try {
      const { data } = await api.myDownloads();
      if (!data?.length) {
        grid.innerHTML = `
          <div class="acc-empty" style="grid-column:1/-1">
            <div class="empty-icon">📥</div>
            <h3>Aucun téléchargement</h3>
            <p>Vos achats apparaîtront ici après validation du paiement.</p>
            <a href="index.html#products" class="btn btn-primary">Parcourir les produits</a>
          </div>`;
        return;
      }
      grid.innerHTML = data.map(item => `
        <div class="dl-card">
          <div class="dl-card-top">
            <div class="dl-thumb">
              ${item.thumbnail_url
                ? `<img src="${API_BASE}${esc(item.thumbnail_url)}" alt="${esc(item.title)}">`
                : (TYPE_ICON[item.type] || '📄')}
            </div>
            <div class="dl-info">
              <div class="dl-title" title="${esc(item.title)}">${esc(item.title)}</div>
              <div class="dl-type">${TYPE_LABEL[item.type] || item.type}</div>
              <div class="dl-date"><i class="fas fa-clock" style="margin-right:4px"></i>${fmtDate(item.downloaded_at)}</div>
            </div>
          </div>
          <button class="dl-btn" onclick="downloadFile('${esc(item.id)}', '${esc(item.title).replace(/'/g,"\\'")}', this)">
            <i class="fas fa-download"></i> Télécharger
          </button>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<p style="color:#dc2626;grid-column:1/-1">${esc(err.message)}</p>`;
    }
  },

  // ═════════════════════════ COMMANDES ═════════════════════════════════════

  _ordersLoaded: false,
  async loadOrders(page = 1) {
    this._orderPage = page;
    if (this._ordersLoaded && page === 1) return;
    this._ordersLoaded = true;
    const list = document.getElementById('orders-list');
    list.innerHTML = '<div class="acc-loading"><i class="fas fa-spinner fa-spin"></i> Chargement…</div>';
    try {
      const res = await api.myOrders({ page, limit: 10 });
      const orders = res.data || [];
      if (!orders.length) {
        list.innerHTML = `
          <div class="acc-empty">
            <div class="empty-icon">🛒</div>
            <h3>Aucune commande</h3>
            <p>Vos commandes apparaîtront ici après votre premier achat.</p>
            <a href="index.html#products" class="btn btn-primary">Voir les produits</a>
          </div>`;
        return;
      }
      list.innerHTML = orders.map(o => this._orderCardHTML(o)).join('');

      // Pagination
      const pg = res.pagination;
      this._buildPagination('orders-pagination', pg, n => {
        this._ordersLoaded = false;
        this.loadOrders(n);
      });
    } catch (err) {
      list.innerHTML = `<p style="color:#dc2626">${esc(err.message)}</p>`;
    }
  },

  _orderCardHTML(o) {
    const items = Array.isArray(o.items) ? o.items.filter(Boolean) : [];
    const statusMap = {
      pending: ['pending', 'En attente'],
      paid: ['paid', 'Payé'],
      failed: ['failed', 'Échoué'],
      cancelled: ['cancelled', 'Annulé'],
      processing: ['processing', 'En traitement'],
      refunded: ['refunded', 'Remboursé'],
    };
    const [cls, label] = statusMap[o.status] || ['pending', o.status];
    return `
      <div class="order-card" id="ord-${esc(o.id)}">
        <div class="order-card-head" onclick="accountApp.toggleOrder('${esc(o.id)}')">
          <div>
            <div class="order-num"># ${esc(o.order_number)}</div>
            <div class="order-date">${fmtDate(o.created_at)}</div>
          </div>
          <div class="order-head-right">
            <span class="status-badge status-${cls}">${label}</span>
            <span class="order-amount">${fmt(o.total_amount)} DZD</span>
            <i class="fas fa-chevron-down order-chevron"></i>
          </div>
        </div>
        <div class="order-card-body">
          <div class="order-items-list">
            ${items.map(item => `
              <div class="order-item">
                <span class="order-item-icon">${TYPE_ICON[item.type] || '📄'}</span>
                <span class="order-item-title">${esc(item.title || '—')}</span>
                <span class="order-item-price">${item.price ? fmt(item.price) + ' DZD' : ''}</span>
              </div>`).join('')}
          </div>
          ${o.payment_method ? `
            <div class="order-method">
              <i class="fas fa-credit-card"></i>
              Méthode : ${METHOD_LABEL[o.payment_method] || o.payment_method}
            </div>` : ''}
          ${o.status === 'pending' ? `
            <div class="order-action">
              <p style="font-size:.82rem;color:#d97706;background:#fef9c3;padding:10px 14px;border-radius:8px">
                <i class="fas fa-info-circle"></i>
                Paiement en attente de validation par notre équipe (sous 24h).
              </p>
            </div>` : ''}
          ${o.status === 'paid' && items.length ? `
            <div class="order-action">
              <a href="account.html#downloads" onclick="accountApp.goTo('sec-downloads')" class="btn btn-primary btn-sm">
                <i class="fas fa-download"></i> Accéder à mes téléchargements
              </a>
            </div>` : ''}
        </div>
      </div>`;
  },

  toggleOrder(id) {
    document.getElementById(`ord-${id}`)?.classList.toggle('open');
  },

  _buildPagination(containerId, pg, onPage) {
    const el = document.getElementById(containerId);
    if (!el || !pg) return;
    const total = pg.pages || pg.totalPages || 1;
    const cur   = pg.page || 1;
    if (total <= 1) { el.innerHTML = ''; return; }
    let html = '';
    if (cur > 1) html += `<button class="acc-page-btn" onclick="(${onPage.toString()})(${cur-1})">‹</button>`;
    for (let i = 1; i <= total; i++) {
      html += `<button class="acc-page-btn ${i===cur?'active':''}" onclick="(${onPage.toString()})(${i})">${i}</button>`;
    }
    if (cur < total) html += `<button class="acc-page-btn" onclick="(${onPage.toString()})(${cur+1})">›</button>`;
    el.innerHTML = html;
  },

  // ═════════════════════════ FAVORIS ═══════════════════════════════════════

  _wlLoaded: false,
  async loadWishlist() {
    if (this._wlLoaded) return;
    this._wlLoaded = true;
    const grid = document.getElementById('wishlist-grid');
    try {
      const { data } = await api.wishlist();
      if (!data?.length) {
        grid.innerHTML = `
          <div class="acc-empty" style="grid-column:1/-1">
            <div class="empty-icon">💛</div>
            <h3>Aucun favori</h3>
            <p>Cliquez sur 🤍 sur un produit ou une vidéo pour l'ajouter à vos favoris.</p>
            <a href="index.html" class="btn btn-primary">Explorer</a>
          </div>`;
        return;
      }
      grid.innerHTML = data.map(item => `
        <div class="wl-card-wrap" id="wl-${esc(item.id)}">
          <a href="${item.item_type === 'video' ? 'index.html#videos' : `product?slug=${esc(item.slug)}`}" class="wl-card">
            <div class="wl-thumb">
              ${TYPE_ICON[item.type] || '📄'}
              ${item.thumbnail_url ? `<img src="${API_BASE}${esc(item.thumbnail_url)}" alt="${esc(item.title)}">` : ''}
            </div>
            <div class="wl-body">
              <div class="wl-type">${TYPE_LABEL[item.type] || item.item_type}</div>
              <div class="wl-title">${esc(item.title)}</div>
              <div class="wl-price ${parseFloat(item.price) === 0 ? 'free' : ''}">
                ${parseFloat(item.price) === 0 ? '🆓 Gratuit' : fmt(item.price) + ' DZD'}
              </div>
            </div>
          </a>
          <button class="wl-remove" onclick="accountApp.removeWishlist('${esc(item.id)}','${item.item_type === 'video' ? 'video' : 'product'}','${esc(item.product_id || item.id)}')">
            <i class="fas fa-heart-broken"></i> Retirer des favoris
          </button>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<p style="color:#dc2626;grid-column:1/-1">${esc(err.message)}</p>`;
    }
  },

  async removeWishlist(wishlistId, type, itemId) {
    try {
      const body = type === 'video' ? { video_id: itemId } : { product_id: itemId };
      await api.toggleWishlist(body.product_id, body.video_id);
      document.getElementById(`wl-${wishlistId}`)?.remove();
      toast('Retiré des favoris');
    } catch (err) { toast(err.message, 'err'); }
  },

  // ═════════════════════════ ABONNEMENT ════════════════════════════════════

  _subLoaded: false,
  async loadSubscription() {
    if (this._subLoaded) return;
    this._subLoaded = true;
    const el = document.getElementById('subscription-content');
    try {
      const sub = await api.mySubscription();
      const plan = sub.current_plan || 'free';
      const exp  = sub.expires_at;

      const now = new Date();
      const expDate = exp ? new Date(exp) : null;
      const isActive = !expDate || expDate > now;

      const planInfo = {
        free:     { icon: '🎓', name: 'Gratuit',  desc: 'Accès aux ressources gratuites uniquement.' },
        standard: { icon: '⭐', name: 'Standard', desc: 'Accès à tous les cours PDF et exercices.' },
        pro:      { icon: '👑', name: 'Pro',       desc: 'Accès illimité à toute la bibliothèque.' },
      };
      const info = planInfo[plan] || planInfo.free;

      const feats = {
        free: [
          { ok: true,  txt: 'Ressources gratuites' },
          { ok: false, txt: 'Cours PDF premium' },
          { ok: false, txt: 'Normes et ouvrages' },
          { ok: false, txt: 'Téléchargement illimité' },
        ],
        standard: [
          { ok: true, txt: 'Ressources gratuites' },
          { ok: true, txt: 'Cours PDF et exercices' },
          { ok: false,txt: 'Normes et ouvrages avancés' },
          { ok: true, txt: 'Téléchargement illimité' },
        ],
        pro: [
          { ok: true, txt: 'Ressources gratuites' },
          { ok: true, txt: 'Cours PDF et exercices' },
          { ok: true, txt: 'Normes et ouvrages avancés' },
          { ok: true, txt: 'Téléchargement illimité + priorité support' },
        ],
      };

      let expiryHTML = '';
      if (plan !== 'free') {
        if (!expDate) {
          expiryHTML = `<span class="sub-expiry forever"><i class="fas fa-infinity"></i> Accès permanent</span>`;
        } else if (isActive) {
          expiryHTML = `<span class="sub-expiry active"><i class="fas fa-check-circle"></i> Actif jusqu'au ${fmtDate(exp)}</span>`;
        } else {
          expiryHTML = `<span class="sub-expiry expired"><i class="fas fa-times-circle"></i> Expiré le ${fmtDate(exp)}</span>`;
        }
      }

      el.innerHTML = `
        <div class="subscription-current">
          <div class="sub-plan-row">
            <div class="sub-plan-icon">${info.icon}</div>
            <div>
              <div class="sub-plan-name">Plan ${info.name}</div>
              <div class="sub-plan-desc">${info.desc}</div>
            </div>
          </div>
          ${expiryHTML}
          <div class="sub-features">
            ${(feats[plan] || feats.free).map(f => `
              <div class="sub-feature ${f.ok ? '' : 'locked'}">
                <i class="fas fa-${f.ok ? 'check-circle' : 'times-circle'}"></i>
                ${esc(f.txt)}
              </div>`).join('')}
          </div>
        </div>

        ${plan === 'free' || (expDate && !isActive) ? `
          <p class="sec-subtitle" style="margin-bottom:16px">Passez à un plan supérieur pour accéder à plus de contenu.</p>
          <div class="plans-grid">
            ${this._planCardHTML('free',     '🎓', 'Gratuit',  '0',       plan === 'free')}
            ${this._planCardHTML('standard', '⭐', 'Standard', '1 500', plan === 'standard', true)}
            ${this._planCardHTML('pro',      '👑', 'Pro',      '2 990', plan === 'pro')}
          </div>` : ''}`;
    } catch (err) {
      el.innerHTML = `<p style="color:#dc2626">${esc(err.message)}</p>`;
    }
  },

  _planCardHTML(id, icon, name, price, isCurrent, recommended = false) {
    const feats = {
      free:     ['Ressources gratuites', 'Accès communauté'],
      standard: ['Tout le contenu Gratuit', 'Cours PDF + Exercices', 'Téléchargement illimité'],
      pro:      ['Tout Standard', 'Normes + Ouvrages avancés', 'Support prioritaire', 'Nouveautés en avant-première'],
    };
    return `
      <div class="plan-card ${isCurrent ? 'current' : ''} ${recommended ? 'recommended' : ''}">
        ${recommended ? '<span class="plan-badge-top">⭐ Populaire</span>' : ''}
        <div class="plan-card-icon">${icon}</div>
        <div class="plan-card-name">${name}</div>
        <div class="plan-card-price">${price === '0' ? 'Gratuit' : price + ' DZD'}<span>${price !== '0' ? ' / mois' : ''}</span></div>
        <ul class="plan-card-feats">
          ${(feats[id] || []).map(f => `<li>${esc(f)}</li>`).join('')}
        </ul>
        ${isCurrent
          ? '<span class="plan-card-btn current-btn">Plan actuel</span>'
          : `<a href="index.html#pricing" class="plan-card-btn upgrade-btn">Choisir ${name}</a>`}
      </div>`;
  },

  // ═════════════════════════ PROFIL ════════════════════════════════════════

  _profileLoaded: false,
  async loadProfile() {
    if (this._profileLoaded) return;
    this._profileLoaded = true;
    try {
      const { data } = await api.me();
      document.getElementById('pf-first').value      = data.first_name || '';
      document.getElementById('pf-last').value       = data.last_name  || '';
      document.getElementById('pf-phone').value      = data.phone      || '';
      document.getElementById('pf-level').value      = data.study_level || '';
      document.getElementById('pf-university').value = data.university  || '';
    } catch {}

    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfile();
    });
    document.getElementById('password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePassword();
    });
  },

  async saveProfile() {
    const btn = document.getElementById('profile-save-btn');
    const msg = document.getElementById('profile-msg');
    msg.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement…';
    try {
      const payload = {
        first_name:  document.getElementById('pf-first').value.trim(),
        last_name:   document.getElementById('pf-last').value.trim(),
        phone:       document.getElementById('pf-phone').value.trim() || null,
        study_level: document.getElementById('pf-level').value || null,
        university:  document.getElementById('pf-university').value.trim() || null,
      };
      const { data } = await http('PATCH', '/users/profile', payload);
      // Mettre à jour le localStorage
      const stored = Auth.getUser();
      Auth.save(Auth.getToken(), Auth.getRefresh(), { ...stored, ...data });
      this._user = data;
      this._renderHero(data);
      msg.textContent = '✓ Profil mis à jour.';
      msg.className = 'acc-msg ok';
      msg.style.display = 'block';
      toast('Profil mis à jour !');
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'acc-msg err';
      msg.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    }
  },

  async savePassword() {
    const btn = document.getElementById('password-save-btn');
    const msg = document.getElementById('password-msg');
    msg.style.display = 'none';

    const current = document.getElementById('pw-current').value;
    const next    = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (!current || !next) {
      msg.textContent = 'Remplissez tous les champs.';
      msg.className = 'acc-msg err'; msg.style.display = 'block'; return;
    }
    if (next.length < 8) {
      msg.textContent = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
      msg.className = 'acc-msg err'; msg.style.display = 'block'; return;
    }
    if (next !== confirm) {
      msg.textContent = 'Les mots de passe ne correspondent pas.';
      msg.className = 'acc-msg err'; msg.style.display = 'block'; return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Modification…';
    try {
      await http('PATCH', '/users/password', { current_password: current, new_password: next });
      msg.textContent = '✓ Mot de passe modifié. Reconnectez-vous si nécessaire.';
      msg.className = 'acc-msg ok'; msg.style.display = 'block';
      document.getElementById('pw-current').value = '';
      document.getElementById('pw-new').value     = '';
      document.getElementById('pw-confirm').value = '';
      toast('Mot de passe modifié !');
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'acc-msg err'; msg.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-key"></i> Changer le mot de passe';
    }
  },
};

// ── HTTP helper local (réutilise le token Auth) ───────────────────────────────
async function http(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (Auth.getToken()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Erreur ${res.status}`);
  return data;
}

// ── Démarrage ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => accountApp.init());
