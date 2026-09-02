/* ═══════════════════════════════════════
   Al Handassa.dz — Panel Admin JS
═══════════════════════════════════════ */

const API = 'http://localhost:5000/api';

// ── HTTP ──────────────────────────────────────────────────────────────────────
async function http(method, path, body) {
  const token = localStorage.getItem('hds_token');
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Erreur ${res.status}`);
  return data;
}

// Upload multipart (pour les fichiers)
async function httpUpload(path, formData) {
  const token = localStorage.getItem('hds_token');
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Erreur ${res.status}`);
  return data;
}
const get   = p => http('GET', p);
const post  = (p,b) => http('POST', p, b);
const patch = (p,b) => http('PATCH', p, b);
const del   = p => http('DELETE', p);

// ── Toast ─────────────────────────────────────────────────────────────────────
let _tt;
function toast(msg, type='ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `adm-toast show ${type}`;
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Helpers HTML ──────────────────────────────────────────────────────────────
function badge(status) {
  const map = {
    pending:'badge-pending', paid:'badge-paid', processing:'badge-processing',
    failed:'badge-failed', refunded:'badge-refunded', completed:'badge-completed',
    free:'badge-free', active:'badge-active', inactive:'badge-inactive',
    admin:'badge-admin', student:'badge-student',
  };
  const labels = {
    pending:'En attente', paid:'Payé', processing:'En cours',
    failed:'Échoué', refunded:'Remboursé', completed:'Complété',
    free:'Gratuit', active:'Actif', inactive:'Inactif',
    admin:'Admin', student:'Étudiant',
  };
  return `<span class="badge ${map[status]||''}">${labels[status]||status}</span>`;
}

function fmt(n)  { return Number(n||0).toLocaleString('fr-DZ'); }
function date(d) { return d ? new Date(d).toLocaleDateString('fr-DZ',{day:'2-digit',month:'short',year:'numeric'}) : '—'; }
function time(d) { return d ? new Date(d).toLocaleTimeString('fr-DZ',{hour:'2-digit',minute:'2-digit'}) : ''; }

// ══════════════════════════════════════════════════════════════════════════════
// APPLICATION
// ══════════════════════════════════════════════════════════════════════════════
const adminApp = {

  _user: null,
  _page: 'dashboard',

  // ── Init ──────────────────────────────────────────────────────────────────
  async init() {
    const token = localStorage.getItem('hds_token');
    const guardMsg = document.getElementById('guard-msg');
    const guardBtn = document.getElementById('guard-btn');
    guardBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification…';

    if (!token) {
      guardMsg.textContent = 'Aucune session — connectez-vous sur le site principal.';
      guardBtn.innerHTML = '<i class="fas fa-lock"></i> Non connecté';
      return;
    }

    try {
      const res = await get('/auth/me');
      const user = res.user;
      if (user.role !== 'admin') {
        guardMsg.textContent = `Accès refusé. Votre rôle (${user.role}) n'est pas administrateur.`;
        guardBtn.innerHTML = '<i class="fas fa-ban"></i> Accès refusé';
        return;
      }
      this._user = user;
      document.getElementById('guard').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      document.getElementById('topbar-user').innerHTML =
        `<strong>${user.first_name} ${user.last_name}</strong> &nbsp;·&nbsp; ${badge('admin')}`;

      this._initNav();
      this.loadPage('dashboard');
    } catch(e) {
      guardMsg.textContent = 'Session invalide ou expirée. Reconnectez-vous.';
      guardBtn.innerHTML = '<i class="fas fa-lock"></i> Session invalide';
    }
  },

  login() {
    window.location.href = 'index.html#login';
  },

  logout() {
    localStorage.removeItem('hds_token');
    localStorage.removeItem('hds_refresh');
    localStorage.removeItem('hds_user');
    window.location.href = 'index.html';
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  _initNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
      btn.addEventListener('click', () => this.loadPage(btn.dataset.page));
    });
  },

  async loadPage(page) {
    this._page = page;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    const titles = { dashboard:'Tableau de bord', payments:'Paiements', orders:'Commandes', products:'Produits & Ressources', users:'Utilisateurs', videos:'Vidéos', articles:'Articles', levels:'Niveaux d\'études' };
    document.getElementById('page-title').textContent = titles[page] || page;
    const body = document.getElementById('page-body');
    body.innerHTML = `<div style="text-align:center;padding:60px;color:#94a3b8"><i class="fas fa-spinner fa-spin fa-2x"></i></div>`;
    const pages = { dashboard:this.pageDashboard, payments:this.pagePayments, orders:this.pageOrders, products:this.pageProducts, users:this.pageUsers, videos:this.pageVideos, articles:this.pageArticles, levels:this.pageLevels };
    await (pages[page] || (() => {})).call(this);
  },

  // ══ PAGE DASHBOARD ════════════════════════════════════════════════════════
  async pageDashboard() {
    const s = await get('/admin/stats');
    const body = document.getElementById('page-body');
    // Mettre à jour badge paiements en attente
    const nb = s.pending_payments || 0;
    const badge_el = document.getElementById('badge-payments');
    badge_el.textContent = nb;
    badge_el.classList.toggle('hidden', nb === 0);

    body.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">👥</div>
          <div class="kpi-value">${fmt(s.total_users)}</div>
          <div class="kpi-label">Utilisateurs</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon">💰</div>
          <div class="kpi-value">${fmt(s.total_revenue)}</div>
          <div class="kpi-label">Revenus DZD</div>
        </div>
        <div class="kpi-card orange">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-value">${fmt(s.pending_payments)}</div>
          <div class="kpi-label">Paiements en attente</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📦</div>
          <div class="kpi-value">${fmt(s.total_products)}</div>
          <div class="kpi-label">Produits actifs</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🎬</div>
          <div class="kpi-value">${fmt(s.total_videos)}</div>
          <div class="kpi-label">Vidéos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🛒</div>
          <div class="kpi-value">${fmt(s.total_orders)}</div>
          <div class="kpi-label">Commandes total</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon">🆕</div>
          <div class="kpi-value">${fmt(s.new_users_today)}</div>
          <div class="kpi-label">Nouveaux aujourd'hui</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📰</div>
          <div class="kpi-value">${fmt(s.total_articles)}</div>
          <div class="kpi-label">Articles publiés</div>
        </div>
      </div>

      <div class="dash-grid">
        <!-- Commandes récentes -->
        <div class="section-card">
          <div class="section-card-header">
            <h3><i class="fas fa-shopping-bag"></i> Commandes récentes</h3>
            <button class="btn-adm btn-adm-blue" onclick="adminApp.loadPage('orders')">Voir tout</button>
          </div>
          <table class="adm-table">
            <thead><tr><th>Client</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead>
            <tbody>${(s.recent_orders||[]).map(o=>`
              <tr>
                <td><strong>${o.first_name} ${o.last_name}</strong><br><small style="color:#94a3b8">${o.email}</small></td>
                <td><strong>${fmt(o.total_amount)} DZD</strong></td>
                <td>${badge(o.status)}</td>
                <td>${date(o.created_at)}<br><small style="color:#94a3b8">${time(o.created_at)}</small></td>
              </tr>`).join('') || '<tr><td colspan="4" class="no-data">Aucune commande</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Utilisateurs récents -->
        <div class="section-card">
          <div class="section-card-header">
            <h3><i class="fas fa-users"></i> Nouveaux utilisateurs</h3>
            <button class="btn-adm btn-adm-blue" onclick="adminApp.loadPage('users')">Voir tout</button>
          </div>
          <table class="adm-table">
            <thead><tr><th>Nom</th><th>Rôle</th><th>Inscription</th></tr></thead>
            <tbody>${(s.recent_users||[]).map(u=>`
              <tr>
                <td><strong>${u.first_name} ${u.last_name}</strong><br><small style="color:#94a3b8">${u.email}</small></td>
                <td>${badge(u.role)}</td>
                <td>${date(u.created_at)}</td>
              </tr>`).join('') || '<tr><td colspan="3" class="no-data">Aucun utilisateur</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Répartition types produits -->
      <div class="section-card">
        <div class="section-card-header"><h3><i class="fas fa-chart-bar"></i> Répartition des produits par type</h3></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;padding:20px">
          ${(s.types_breakdown||[]).map(t=>`
            <div style="background:#f0f4fa;border-radius:10px;padding:12px 20px;text-align:center">
              <div style="font-size:1.4rem;font-weight:900;color:#1B3A6B">${t.total}</div>
              <div style="font-size:0.75rem;color:#64748b;font-weight:600;text-transform:uppercase">${t.type}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  // ══ PAGE PAIEMENTS ════════════════════════════════════════════════════════
  async pagePayments() {
    const res = await get('/admin/payments?status=pending&limit=50');
    const payments = res.data || [];
    const body = document.getElementById('page-body');

    body.innerHTML = `
      <div class="section-card">
        <div class="section-card-header">
          <h3><i class="fas fa-credit-card"></i> Paiements en attente de validation (${payments.length})</h3>
        </div>
        <table class="adm-table">
          <thead><tr><th>Client</th><th>Méthode</th><th>Montant</th><th>Référence</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody id="payments-body">
            ${payments.length === 0 ? '<tr><td colspan="6" class="no-data">✅ Aucun paiement en attente</td></tr>' :
              payments.map(p => `
              <tr id="pay-row-${p.id}">
                <td>
                  <strong>${p.first_name} ${p.last_name}</strong><br>
                  <small style="color:#94a3b8">${p.email}</small><br>
                  <small style="color:#94a3b8">Cmd : ${p.order_number||'—'}</small>
                </td>
                <td><span style="font-weight:700">${p.method?.toUpperCase()||'—'}</span></td>
                <td><strong style="color:#1B3A6B">${fmt(p.amount)} DZD</strong></td>
                <td>
                  <code style="font-size:0.78rem;background:#f0f4fa;padding:2px 8px;border-radius:6px">
                    ${p.reference || p.baridimob_ref || '—'}
                  </code>
                  ${p.proof_note ? `<br><small style="color:#64748b">${p.proof_note}</small>` : ''}
                </td>
                <td>${date(p.initiated_at)}<br><small style="color:#94a3b8">${time(p.initiated_at)}</small></td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button class="btn-adm btn-adm-green" onclick="adminApp.validatePayment('${p.id}','${p.order_id}')">
                      <i class="fas fa-check"></i> Valider
                    </button>
                    <button class="btn-adm btn-adm-red" onclick="adminApp.rejectPayment('${p.id}')">
                      <i class="fas fa-times"></i> Rejeter
                    </button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <!-- Historique des paiements validés -->
      <div class="section-card">
        <div class="section-card-header">
          <h3><i class="fas fa-history"></i> Derniers paiements validés</h3>
        </div>
        <div id="payments-history">
          <div style="text-align:center;padding:40px;color:#94a3b8"><i class="fas fa-spinner fa-spin"></i></div>
        </div>
      </div>`;

    // Charger l'historique
    this._loadPaymentsHistory();
  },

  async _loadPaymentsHistory() {
    try {
      const res = await get('/admin/payments?status=completed&limit=20');
      const hist = document.getElementById('payments-history');
      if (!hist) return;
      const pays = res.data || [];
      hist.innerHTML = `
        <table class="adm-table">
          <thead><tr><th>Client</th><th>Méthode</th><th>Montant</th><th>Commande</th><th>Validé le</th></tr></thead>
          <tbody>${pays.map(p=>`
            <tr>
              <td><strong>${p.first_name} ${p.last_name}</strong><br><small style="color:#94a3b8">${p.email}</small></td>
              <td>${p.method?.toUpperCase()||'—'}</td>
              <td><strong style="color:#16a34a">${fmt(p.amount)} DZD</strong></td>
              <td><code style="font-size:0.78rem">${p.order_number||'—'}</code></td>
              <td>${date(p.completed_at)}</td>
            </tr>`).join('') || '<tr><td colspan="5" class="no-data">Aucun paiement validé</td></tr>'}
          </tbody>
        </table>`;
    } catch {}
  },

  async validatePayment(payId, orderId) {
    if (!confirm('Valider ce paiement et débloquer le téléchargement ?')) return;
    try {
      await patch(`/admin/payments/${payId}/validate`);
      toast('✅ Paiement validé — téléchargement débloqué', 'ok');
      document.getElementById(`pay-row-${payId}`)?.remove();
    } catch(e) { toast(e.message, 'err'); }
  },

  async rejectPayment(payId) {
    const notes = prompt('Motif du rejet (optionnel) :') || '';
    try {
      await patch(`/admin/payments/${payId}/reject`, { notes });
      toast('❌ Paiement rejeté', 'warn');
      document.getElementById(`pay-row-${payId}`)?.remove();
    } catch(e) { toast(e.message, 'err'); }
  },

  // ══ PAGE COMMANDES ════════════════════════════════════════════════════════
  async pageOrders() {
    const res = await get('/admin/payments?limit=50');
    const pays = res.data || [];
    const body = document.getElementById('page-body');

    body.innerHTML = `
      <div class="filter-bar">
        <select id="order-filter" onchange="adminApp._filterOrders()">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="completed">Validés</option>
          <option value="failed">Rejetés</option>
        </select>
        <input type="text" id="order-search" placeholder="Rechercher client, email…" oninput="adminApp._filterOrders()">
      </div>
      <div class="section-card">
        <div class="section-card-header">
          <h3><i class="fas fa-list"></i> Toutes les commandes (${pays.length})</h3>
        </div>
        <table class="adm-table" id="orders-table">
          <thead><tr><th>Client</th><th>Méthode</th><th>Montant</th><th>Statut</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>${pays.map(p=>`
            <tr data-status="${p.status}" data-search="${(p.first_name+' '+p.last_name+' '+p.email).toLowerCase()}">
              <td>
                <strong>${p.first_name} ${p.last_name}</strong><br>
                <small style="color:#94a3b8">${p.email}</small>
              </td>
              <td>${p.method?.toUpperCase()||'—'}</td>
              <td><strong>${fmt(p.amount)} DZD</strong></td>
              <td>${badge(p.status)}</td>
              <td>${date(p.initiated_at)}</td>
              <td>
                ${p.status==='pending' ? `
                  <button class="btn-adm btn-adm-green" onclick="adminApp.validatePayment('${p.id}','${p.order_id}')">
                    <i class="fas fa-check"></i> Valider
                  </button>` : badge(p.status)}
              </td>
            </tr>`).join('') || '<tr><td colspan="6" class="no-data">Aucune commande</td></tr>'}
          </tbody>
        </table>
      </div>`;
  },

  _filterOrders() {
    const status = document.getElementById('order-filter').value;
    const search = document.getElementById('order-search').value.toLowerCase();
    document.querySelectorAll('#orders-table tbody tr').forEach(tr => {
      const matchStatus = !status || tr.dataset.status === status;
      const matchSearch = !search || tr.dataset.search?.includes(search);
      tr.style.display = matchStatus && matchSearch ? '' : 'none';
    });
  },

  // ══ PAGE PRODUITS ═════════════════════════════════════════════════════════
  async pageProducts() {
    const res = await get('/admin/products?limit=100');
    const products = res.data || [];
    const body = document.getElementById('page-body');

    const types = [...new Set(products.map(p=>p.type))].sort();
    body.innerHTML = `
      <div class="filter-bar">
        <select id="prod-filter" onchange="adminApp._filterProducts()">
          <option value="">Tous les types</option>
          ${types.map(t=>`<option value="${t}">${t}</option>`).join('')}
        </select>
        <input type="text" id="prod-search" placeholder="Rechercher produit…" oninput="adminApp._filterProducts()">
        <button class="btn-adm btn-adm-primary" onclick="adminApp.showUploadForm()">
          <i class="fas fa-plus"></i> Ajouter une ressource
        </button>
      </div>
      <div class="section-card">
        <div class="section-card-header">
          <h3><i class="fas fa-box"></i> Produits (${products.length})</h3>
        </div>
        <table class="adm-table" id="prod-table">
          <thead><tr><th>Titre</th><th>Type</th><th>Prix</th><th>Télécharg.</th><th>Actif</th><th>Actions</th></tr></thead>
          <tbody>${products.map(p=>`
            <tr data-type="${p.type}" data-search="${p.title.toLowerCase()}">
              <td>
                <strong>${p.title}</strong><br>
                <small style="color:#94a3b8">${p.slug}</small>
              </td>
              <td><span style="font-size:0.72rem;font-weight:700;background:#f0f4fa;padding:2px 8px;border-radius:20px">${p.type}</span></td>
              <td>${p.is_free ? badge('free') : `<strong>${fmt(p.price)} DZD</strong>`}</td>
              <td>${fmt(p.downloads_count)}</td>
              <td>
                <label class="toggle">
                  <input type="checkbox" ${p.is_active?'checked':''} onchange="adminApp.toggleProduct('${p.id}',this.checked)">
                  <span class="toggle-slider"></span>
                </label>
              </td>
              <td>
                <button class="btn-adm btn-adm-blue" onclick="adminApp.viewProduct('${p.id}')">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-adm" style="background:#f59e0b;color:#fff" onclick="adminApp.editProduct('${p.id}')">
                  <i class="fas fa-edit"></i>
                </button>
                <a href="product?slug=${p.slug}" target="_blank" class="btn-adm btn-adm-gray" style="text-decoration:none">
                  <i class="fas fa-external-link-alt"></i>
                </a>
                <button class="btn-adm btn-adm-red" onclick="adminApp.deleteProduct('${p.id}','${p.title.replace(/'/g,'')}')">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  _filterProducts() {
    const type   = document.getElementById('prod-filter').value;
    const search = document.getElementById('prod-search').value.toLowerCase();
    document.querySelectorAll('#prod-table tbody tr').forEach(tr => {
      const matchType   = !type   || tr.dataset.type === type;
      const matchSearch = !search || tr.dataset.search?.includes(search);
      tr.style.display = matchType && matchSearch ? '' : 'none';
    });
  },

  async toggleProduct(id, active) {
    try {
      await patch(`/admin/products/${id}/toggle-active`);
      toast(active ? '✅ Produit activé' : '⏸️ Produit désactivé', 'ok');
    } catch(e) { toast(e.message, 'err'); }
  },

  async viewProduct(id) {
    try {
      const res = await get(`/products/${id}`);
      const p = res.data;
      this.openModal(`📦 ${p.title}`, `
        <div class="info-list">
          <div class="info-row"><span class="info-label">Type</span><span class="info-value">${p.type}</span></div>
          <div class="info-row"><span class="info-label">Prix</span><span class="info-value">${p.is_free ? '🆓 Gratuit' : fmt(p.price)+' DZD'}</span></div>
          <div class="info-row"><span class="info-label">Téléchargements</span><span class="info-value">${fmt(p.downloads_count)}</span></div>
          <div class="info-row"><span class="info-label">Vues</span><span class="info-value">${fmt(p.views_count)}</span></div>
          <div class="info-row"><span class="info-label">Aperçu</span><span class="info-value">${p.preview_pages ? p.preview_pages+' pages' : '—'}</span></div>
          <div class="info-row"><span class="info-label">Tags</span><span class="info-value">${(p.tags||[]).join(', ')||'—'}</span></div>
          <div class="info-row"><span class="info-label">Actif</span><span class="info-value">${badge(p.is_active?'active':'inactive')}</span></div>
          <div class="info-row"><span class="info-label">Slug</span><span class="info-value"><code style="font-size:0.8rem">${p.slug}</code></span></div>
        </div>`,
        `<a href="product?slug=${p.slug}" target="_blank" class="btn-adm btn-adm-primary">
          <i class="fas fa-external-link-alt"></i> Voir la page produit
        </a>`
      );
    } catch(e) { toast(e.message, 'err'); }
  },

  // ── Modifier un produit (type, catégorie, tags, prix, titre) ─────────────
  async editProduct(id) {
    try {
      // Charger le produit et les catégories en parallèle
      const [resP, resCats] = await Promise.all([
        get(`/products/${id}`),
        get('/admin/categories')
      ]);
      const p    = resP.data;
      const cats = resCats.data || [];

      const typeOptions = [
        { v:'cours_pdf',  l:'📄 Cours PDF' },
        { v:'td_pdf',     l:'📒 TD PDF' },
        { v:'tp_pdf',     l:'🔬 TP PDF' },
        { v:'tuto_pdf',   l:'🎯 Tuto PDF' },
        { v:'ouvrage',    l:'📚 Ouvrage' },
        { v:'normes',     l:'📋 Normes DTR/RPA' },
        { v:'sujet',      l:'📝 Sujet d\'examen' },
        { v:'document_word', l:'📋 Document Word' },
      ].map(o => `<option value="${o.v}" ${p.type===o.v?'selected':''}>${o.l}</option>`).join('');

      const catOptions = cats.map(c =>
        `<option value="${c.id}" ${p.category_id===c.id?'selected':''}>${c.name_fr}</option>`
      ).join('');

      this.openModal(`✏️ Modifier — ${p.title}`, `
        <div style="display:flex;flex-direction:column;gap:14px">

          <div class="adm-field">
            <label>Titre</label>
            <input id="ep-title" type="text" value="${(p.title||'').replace(/"/g,'&quot;')}"
              style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="adm-field">
              <label>Type <span style="color:red">*</span></label>
              <select id="ep-type" style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px">
                ${typeOptions}
              </select>
            </div>
            <div class="adm-field">
              <label>Catégorie</label>
              <select id="ep-category" style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px">
                <option value="">— Aucune —</option>
                ${catOptions}
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="adm-field">
              <label>Prix (DZD)</label>
              <input id="ep-price" type="number" min="0" value="${p.price||0}"
                style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px">
            </div>
            <div class="adm-field">
              <label>Gratuit ?</label>
              <select id="ep-free" style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px">
                <option value="false" ${!p.is_free?'selected':''}>Non — Payant</option>
                <option value="true"  ${p.is_free ?'selected':''}>Oui — Gratuit</option>
              </select>
            </div>
          </div>

          <div class="adm-field">
            <label>Tags <small style="color:#94a3b8">(séparés par des virgules)</small></label>
            <input id="ep-tags" type="text" value="${(p.tags||[]).join(', ')}"
              style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px"
              placeholder="ex: Planification, Rotation de camion">
          </div>

          <div id="ep-msg" style="display:none;padding:8px 12px;border-radius:6px;font-size:.85rem"></div>
        </div>`,
        `<button class="btn-adm btn-adm-gray" onclick="adminApp.closeModal()">Annuler</button>
         <button class="btn-adm btn-adm-primary" onclick="adminApp.saveProduct('${id}')">
           <i class="fas fa-save"></i> Enregistrer
         </button>`
      );
    } catch(e) { toast(e.message,'err'); }
  },

  async saveProduct(id) {
    const title      = document.getElementById('ep-title')?.value.trim();
    const type       = document.getElementById('ep-type')?.value;
    const categoryId = document.getElementById('ep-category')?.value;
    const price      = parseFloat(document.getElementById('ep-price')?.value) || 0;
    const isFree     = document.getElementById('ep-free')?.value === 'true';
    const tagsRaw    = document.getElementById('ep-tags')?.value || '';
    const tags       = tagsRaw.split(',').map(t=>t.trim()).filter(Boolean);
    const msg        = document.getElementById('ep-msg');

    if (!type) { toast('Sélectionnez un type','err'); return; }

    const body = { type, price, is_free: isFree, tags: JSON.stringify(tags) };
    if (title)      body.title       = title;
    if (categoryId) body.category_id = categoryId;

    try {
      await patch(`/admin/products/${id}`, body);
      msg.style.display  = 'block';
      msg.style.background = '#d1fae5';
      msg.style.color      = '#065f46';
      msg.textContent      = '✅ Modifications enregistrées avec succès.';

      // Rafraîchir le tableau
      setTimeout(() => { this.closeModal(); this.pageProducts(); }, 900);
    } catch(e) {
      msg.style.display  = 'block';
      msg.style.background = '#fee2e2';
      msg.style.color      = '#991b1b';
      msg.textContent      = '⚠️ ' + e.message;
    }
  },

  // ══ PAGE UTILISATEURS ═════════════════════════════════════════════════════
  async pageUsers() {
    const body = document.getElementById('page-body');
    body.innerHTML = `
      <div class="filter-bar">
        <input type="text" id="user-search" placeholder="Rechercher nom, email…" oninput="adminApp._filterUsers()">
        <select id="user-role" onchange="adminApp._filterUsers()">
          <option value="">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="student">Étudiant</option>
        </select>
      </div>
      <div class="section-card">
        <div class="section-card-header">
          <h3><i class="fas fa-users"></i> Utilisateurs</h3>
        </div>
        <div id="users-wrap">
          <div style="text-align:center;padding:40px;color:#94a3b8"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
        </div>
      </div>`;
    await this._loadUsers();
  },

  async _loadUsers(search='', role='') {
    try {
      let url = '/admin/users?limit=100';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await get(url);
      const users = res.data || [];
      const total = res.pagination?.total || users.length;
      const wrap = document.getElementById('users-wrap');
      if (!wrap) return;
      const filtered = role ? users.filter(u => u.role === role) : users;
      wrap.innerHTML = `
        <table class="adm-table" id="users-table">
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Commandes</th><th>Inscription</th><th>Actif</th></tr></thead>
          <tbody>${filtered.map(u=>`
            <tr data-search="${(u.first_name+' '+u.last_name+' '+u.email).toLowerCase()}" data-role="${u.role}">
              <td><strong>${u.first_name} ${u.last_name}</strong></td>
              <td>${u.email}</td>
              <td>${badge(u.role)}</td>
              <td>${u.order_count||0}</td>
              <td>${date(u.created_at)}</td>
              <td><label class="toggle"><input type="checkbox" ${u.is_active?'checked':''} onchange="adminApp.toggleUser('${u.id}',this.checked)"><span class="toggle-slider"></span></label></td>
            </tr>`).join('') || '<tr><td colspan="6" class="no-data">Aucun utilisateur</td></tr>'}
          </tbody>
        </table>
        <div style="text-align:center;padding:12px;color:#94a3b8;font-size:0.82rem">
          ${filtered.length} utilisateur(s) affichés — ${total} au total
        </div>`;
    } catch(e) { toast(e.message,'err'); }
  },

  _filterUsers() {
    const search = (document.getElementById('user-search')?.value || '').toLowerCase();
    const role   = document.getElementById('user-role')?.value || '';
    this._loadUsers(search, role);
  },

  async toggleUser(id, active) {
    try { await patch(`/admin/users/${id}/toggle-active`); toast(active ? '✅ Compte activé' : '⏸️ Compte désactivé', 'ok'); }
    catch(e) { toast(e.message,'err'); }
  },

  // ══ PAGE VIDÉOS ═══════════════════════════════════════════════════════════
  async pageVideos() {
    const res = await get('/admin/videos?limit=200');
    const videos = res.data || [];
    const body = document.getElementById('page-body');
    body.innerHTML = `
      <div class="filter-bar">
        <input type="text" id="vid-search" placeholder="Rechercher vidéo…" oninput="adminApp._filterTable('vid-table','vid-search')">
        <button class="btn-adm btn-adm-primary" onclick="adminApp.showVideoForm()">
          <i class="fas fa-plus"></i> Ajouter une vidéo
        </button>
      </div>
      <div class="section-card">
        <div class="section-card-header">
          <h3><i class="fas fa-play-circle"></i> Vidéos (${videos.length})</h3>
        </div>
        <table class="adm-table" id="vid-table">
          <thead><tr><th>Titre</th><th>Source</th><th>Durée</th><th>Actif</th><th>Actions</th></tr></thead>
          <tbody>${videos.map(v=>{
            const ytId = v.video_url ? (v.video_url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)||[])[1]||v.video_url : '';
            const dur  = v.duration_seconds ? Math.floor(v.duration_seconds/60)+'min' : '—';
            return `<tr data-search="${v.title.toLowerCase()}">
              <td><strong>${v.title}</strong><br><small style="color:#94a3b8">${ytId}</small></td>
              <td>${v.source||'—'}</td>
              <td>${dur}</td>
              <td><label class="toggle"><input type="checkbox" ${v.is_active?'checked':''} onchange="adminApp.toggleVideo('${v.id}',this.checked)"><span class="toggle-slider"></span></label></td>
              <td>
                <button class="btn-adm btn-adm-blue" onclick="adminApp.editVideo(${JSON.stringify(v).replace(/"/g,'&quot;')})"><i class="fas fa-edit"></i></button>
                <button class="btn-adm btn-adm-red" onclick="adminApp.deleteVideo('${v.id}','${v.title.replace(/'/g,'')}')"><i class="fas fa-trash"></i></button>
              </td>
            </tr>`;}).join('') || '<tr><td colspan="5" class="no-data">Aucune vidéo</td></tr>'}
          </tbody>
        </table>
      </div>`;
  },

  showVideoForm(v={}) {
    const isEdit = !!v.id;
    this.openModal(isEdit ? '✏️ Modifier la vidéo' : '🎬 Ajouter une vidéo', `
      <div class="adm-form">
        <div class="adm-field"><label>Titre *</label>
          <input type="text" id="vf-title" value="${v.title||''}" placeholder="Titre de la vidéo"/></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="adm-field"><label>URL ou ID YouTube *</label>
            <input type="text" id="vf-ytid" value="${v.video_url||''}" placeholder="Ex: https://youtu.be/dQw4w9WgXcQ"/></div>
          <div class="adm-field"><label>Durée (secondes)</label>
            <input type="number" id="vf-dur" value="${v.duration_seconds||''}" placeholder="Ex: 360"/></div>
        </div>
        <div class="adm-field"><label>Source / Chaîne</label>
          <input type="text" id="vf-src" value="${v.source||''}" placeholder="Ex: AQC TV"/></div>
        <div class="adm-field"><label>Description</label>
          <textarea id="vf-desc" rows="3">${v.description||''}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="adm-field"><label>Niveau</label>
            <select id="vf-level">
              ${['tous','debutant','intermediaire','avance','prepa','ingenieur'].map(l=>`<option value="${l}" ${v.study_level===l?'selected':''}>${l}</option>`).join('')}
            </select></div>
          <div class="adm-field"><label>Langue</label>
            <select id="vf-lang">
              ${['fr','ar','en'].map(l=>`<option value="${l}" ${v.language===l?'selected':''}>${l}</option>`).join('')}
            </select></div>
        </div>
      </div>`,
      `<button class="btn-adm btn-adm-primary" onclick="adminApp.saveVideo('${v.id||''}')">
        <i class="fas fa-save"></i> ${isEdit ? 'Enregistrer' : 'Ajouter'}
      </button>`
    );
  },

  async saveVideo(id) {
    const rawUrl = document.getElementById('vf-ytid').value.trim();
    // Accept bare YouTube ID or full URL
    const videoUrl = rawUrl.startsWith('http') ? rawUrl
      : rawUrl ? `https://www.youtube.com/watch?v=${rawUrl}` : '';
    const payload = {
      title:            document.getElementById('vf-title').value.trim(),
      video_url:        videoUrl,
      duration_seconds: parseInt(document.getElementById('vf-dur').value)||null,
      source:           document.getElementById('vf-src').value.trim(),
      description:      document.getElementById('vf-desc').value.trim(),
      study_level:      document.getElementById('vf-level').value,
      language:         document.getElementById('vf-lang').value,
    };
    if (!payload.title || !payload.video_url) { toast('Titre et URL YouTube requis', 'err'); return; }
    try {
      if (id) await http('PUT', `/admin/videos/${id}`, payload);
      else    await post('/admin/videos', payload);
      toast(id ? '✅ Vidéo modifiée' : '✅ Vidéo ajoutée', 'ok');
      this.closeModal(); this.loadPage('videos');
    } catch(e) { toast(e.message, 'err'); }
  },

  async toggleVideo(id, active) {
    try { await patch(`/admin/videos/${id}/toggle-active`); toast(active ? '✅ Activée' : '⏸️ Désactivée', 'ok'); }
    catch(e) { toast(e.message, 'err'); }
  },

  editVideo(v) { this.showVideoForm(v); },

  async deleteVideo(id, title) {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    try {
      await http('PATCH', `/admin/videos/${id}/toggle-active`);
      toast('🗑️ Vidéo désactivée', 'warn');
      this.loadPage('videos');
    } catch(e) { toast(e.message, 'err'); }
  },

  // ══ PAGE ARTICLES ══════════════════════════════════════════════════════════
  async pageArticles() {
    const res = await get('/admin/articles?limit=100');
    const articles = res.data || [];
    const body = document.getElementById('page-body');
    body.innerHTML = `
      <div class="filter-bar">
        <input type="text" id="art-search" placeholder="Rechercher article…" oninput="adminApp._filterTable('art-table','art-search')">
        <button class="btn-adm btn-adm-primary" onclick="adminApp.showArticleForm()">
          <i class="fas fa-plus"></i> Nouvel article
        </button>
      </div>
      <div class="section-card">
        <div class="section-card-header">
          <h3><i class="fas fa-newspaper"></i> Articles (${articles.length})</h3>
        </div>
        <table class="adm-table" id="art-table">
          <thead><tr><th>Titre</th><th>Catégorie</th><th>Publié</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>${articles.map(a=>`
            <tr data-search="${a.title.toLowerCase()}">
              <td><strong>${a.title}</strong></td>
              <td>${a.category||'—'}</td>
              <td>
                <label class="toggle">
                  <input type="checkbox" ${a.is_published?'checked':''} onchange="adminApp.toggleArticle('${a.id}',this.checked)">
                  <span class="toggle-slider"></span>
                </label>
              </td>
              <td>${date(a.created_at)}</td>
              <td>
                <button class="btn-adm btn-adm-blue" onclick="adminApp.editArticle(${JSON.stringify(a).replace(/"/g,'&quot;')})">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-adm btn-adm-red" onclick="adminApp.deleteArticle('${a.id}','${a.title.replace(/'/g,'')}')">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>`).join('') || '<tr><td colspan="5" class="no-data">Aucun article</td></tr>'}
          </tbody>
        </table>
      </div>`;
  },

  showArticleForm(a={}) {
    const isEdit = !!a.id;
    this.openModal(isEdit ? '✏️ Modifier l\'article' : '📝 Nouvel article', `
      <div class="adm-form">
        <div class="adm-field"><label>Titre *</label>
          <input type="text" id="af-title" value="${a.title||''}" placeholder="Titre de l'article"/></div>
        <div class="adm-field"><label>Résumé</label>
          <textarea id="af-excerpt" rows="2">${a.excerpt||''}</textarea></div>
        <div class="adm-field"><label>Contenu</label>
          <textarea id="af-content" rows="6" placeholder="Contenu de l'article…">${a.content||''}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="adm-field"><label>Catégorie</label>
            <input type="text" id="af-cat" value="${a.category||''}" placeholder="Ex: Technique"/></div>
          <div class="adm-field"><label>Tags (virgule)</label>
            <input type="text" id="af-tags" value="${(a.tags||[]).join(', ')}" placeholder="béton, BIM…"/></div>
        </div>
        <div class="adm-field"><label>Publié</label>
          <select id="af-pub">
            <option value="true" ${a.is_published?'selected':''}>✅ Publié</option>
            <option value="false" ${!a.is_published?'selected':''}>📝 Brouillon</option>
          </select></div>
      </div>`,
      `<button class="btn-adm btn-adm-primary" onclick="adminApp.saveArticle('${a.id||''}')">
        <i class="fas fa-save"></i> ${isEdit ? 'Enregistrer' : 'Publier'}
      </button>`
    );
  },

  async saveArticle(id) {
    const tags = document.getElementById('af-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
    const payload = {
      title:        document.getElementById('af-title').value.trim(),
      excerpt:      document.getElementById('af-excerpt').value.trim(),
      content:      document.getElementById('af-content').value.trim(),
      category:     document.getElementById('af-cat').value.trim(),
      tags,
      is_published: document.getElementById('af-pub').value === 'true',
    };
    if (!payload.title) { toast('Titre requis', 'err'); return; }
    try {
      if (id) await http('PUT', `/admin/articles/${id}`, payload);
      else    await post('/admin/articles', payload);
      toast(id ? '✅ Article modifié' : '✅ Article créé', 'ok');
      this.closeModal(); this.loadPage('articles');
    } catch(e) { toast(e.message, 'err'); }
  },

  async toggleArticle(id) {
    try { await patch(`/admin/articles/${id}/toggle-published`); toast('✅ Statut mis à jour', 'ok'); }
    catch(e) { toast(e.message, 'err'); }
  },

  editArticle(a) { this.showArticleForm(a); },

  async deleteArticle(id, title) {
    if (!confirm(`Supprimer l'article "${title}" définitivement ?`)) return;
    try {
      await del(`/admin/articles/${id}`);
      toast('🗑️ Article supprimé', 'warn');
      this.loadPage('articles');
    } catch(e) { toast(e.message, 'err'); }
  },

  // ══ PAGE NIVEAUX D'ÉTUDES ══════════════════════════════════════════════════
  async pageLevels() {
    const res = await fetch('http://localhost:5000/api/study-levels');
    const json = await res.json();
    const levels = json.data || [];
    const body = document.getElementById('page-body');

    // Grouper par racine
    const groups = {};
    levels.forEach(l => { const r = l.racine||'bac'; if(!groups[r]) groups[r]=[]; groups[r].push(l); });

    body.innerHTML = `
      <div class="filter-bar">
        <button class="btn-adm btn-adm-primary" onclick="adminApp.showLevelForm()">
          <i class="fas fa-plus"></i> Ajouter un niveau
        </button>
      </div>
      ${Object.entries(groups).map(([racine, items]) => `
        <div class="section-card" style="margin-bottom:16px">
          <div class="section-card-header">
            <h3>${{bac:'🎓 BAC',bts:'📐 BTS',licence:'🏛️ Licence',master:'🔬 Mastère',ingenieur:'⚙️ Ingénieur',prepa:'📖 Prépa'}[racine]||racine}</h3>
          </div>
          <table class="adm-table">
            <thead><tr><th>Icône</th><th>Nom</th><th>Slug</th><th>Actif</th><th>Actions</th></tr></thead>
            <tbody>${items.map(l=>`
              <tr>
                <td style="font-size:1.4rem">${l.icon||'🎓'}</td>
                <td><strong>${l.label_fr}</strong></td>
                <td><code style="font-size:0.75rem">${l.slug}</code></td>
                <td>${badge(l.is_active?'active':'inactive')}</td>
                <td>
                  <button class="btn-adm btn-adm-blue" onclick="adminApp.editLevel(${JSON.stringify(l).replace(/"/g,'&quot;')})">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-adm btn-adm-red" onclick="adminApp.deleteLevel(${l.id},'${l.label_fr.replace(/'/g,'')}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`).join('')}`;
  },

  showLevelForm(l={}) {
    const isEdit = !!l.id;
    this.openModal(isEdit ? '✏️ Modifier le niveau' : '🎓 Ajouter un niveau', `
      <div class="adm-form">
        <div style="display:grid;grid-template-columns:80px 1fr;gap:12px">
          <div class="adm-field"><label>Icône</label>
            <input type="text" id="lf-icon" value="${l.icon||'🎓'}" style="font-size:1.5rem;text-align:center"/></div>
          <div class="adm-field"><label>Nom (français) *</label>
            <input type="text" id="lf-label" value="${l.label_fr||''}" placeholder="Ex: BTS Génie Civil"/></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="adm-field"><label>Racine *</label>
            <select id="lf-racine">
              ${['bac','bts','licence','master','ingenieur','prepa'].map(r=>`<option value="${r}" ${l.racine===r?'selected':''}>${r.toUpperCase()}</option>`).join('')}
            </select></div>
          <div class="adm-field"><label>Couleur</label>
            <input type="color" id="lf-color" value="${l.color||'#1B3A6B'}" style="height:42px;width:100%;cursor:pointer"/></div>
        </div>
        <div class="adm-field"><label>Slug (identifiant unique)</label>
          <input type="text" id="lf-slug" value="${l.slug||''}" placeholder="Ex: bts-genie-civil"/></div>
        <div class="adm-field"><label>Valeur DB (pour filtrer)</label>
          <select id="lf-dbval">
            ${['debutant','intermediaire','avance','prepa','ingenieur','tous'].map(v=>`<option value="${v}" ${l.db_value===v?'selected':''}>${v}</option>`).join('')}
          </select></div>
      </div>`,
      `<button class="btn-adm btn-adm-primary" onclick="adminApp.saveLevel('${l.id||''}')">
        <i class="fas fa-save"></i> ${isEdit ? 'Enregistrer' : 'Ajouter'}
      </button>`
    );
  },

  async saveLevel(id) {
    const payload = {
      label_fr:  document.getElementById('lf-label').value.trim(),
      icon:      document.getElementById('lf-icon').value.trim(),
      color:     document.getElementById('lf-color').value,
      slug:      document.getElementById('lf-slug').value.trim().toLowerCase().replace(/\s+/g,'-'),
      db_value:  document.getElementById('lf-dbval').value,
      racine:    document.getElementById('lf-racine').value,
    };
    if (!payload.label_fr) { toast('Nom requis', 'err'); return; }
    if (!payload.slug) payload.slug = payload.label_fr.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-');
    try {
      if (id) await http('PUT', `/admin/study-levels/${id}`, payload);
      else    await post('/admin/study-levels', payload);
      toast(id ? '✅ Niveau modifié' : '✅ Niveau ajouté', 'ok');
      this.closeModal(); this.loadPage('levels');
    } catch(e) { toast(e.message, 'err'); }
  },

  editLevel(l) { this.showLevelForm(l); },

  async deleteLevel(id, label) {
    if (!confirm(`Supprimer le niveau "${label}" ?`)) return;
    try {
      await del(`/admin/study-levels/${id}`);
      toast('🗑️ Niveau supprimé', 'warn');
      this.loadPage('levels');
    } catch(e) { toast(e.message, 'err'); }
  },

  // ── Filtre générique pour les tables ──────────────────────────────────────
  _filterTable(tableId, inputId) {
    const search = document.getElementById(inputId).value.toLowerCase();
    document.querySelectorAll(`#${tableId} tbody tr`).forEach(tr => {
      tr.style.display = !search || tr.dataset.search?.includes(search) ? '' : 'none';
    });
  },

  // ══ SUPPRESSION PRODUIT ════════════════════════════════════════════════════
  async deleteProduct(id, title) {
    if (!confirm(`Supprimer "${title}" définitivement ?`)) return;
    try {
      await del(`/products/${id}`);
      toast('🗑️ Produit supprimé', 'warn');
      this.loadPage('products');
    } catch(e) { toast(e.message, 'err'); }
  },

  // ══ UPLOAD RESSOURCE ══════════════════════════════════════════════════════
  showUploadForm() {
    this.openModal('📤 Ajouter une ressource', `
      <form id="upload-form" class="adm-form" onsubmit="return false">

        <div class="adm-field">
          <label>Titre <span style="color:red">*</span></label>
          <input type="text" id="up-title" placeholder="Ex: Cours Thermique BTS Bâtiment" required/>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="adm-field">
            <label>Type <span style="color:red">*</span></label>
            <select id="up-type" required>
              <option value="">-- Choisir --</option>
              <option value="cours_pdf">📄 Cours PDF</option>
              <option value="td_pdf">📒 TD PDF</option>
              <option value="tp_pdf">🔬 TP PDF</option>
              <option value="tuto_pdf">🎯 Tuto PDF</option>
              <option value="exercices">✏️ Exercices</option>
              <option value="sujet">📝 Sujet d'examen</option>
              <option value="ouvrage">📚 Ouvrage</option>
              <option value="normes">📋 Normes</option>
              <option value="pack">📦 Pack</option>
            </select>
          </div>

          <div class="adm-field">
            <label>Niveau d'étude</label>
            <select id="up-level">
              <option value="tous">Tous niveaux</option>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
              <option value="prepa">Classes Prépa</option>
              <option value="ingenieur">Ingénieur</option>
            </select>
          </div>
        </div>

        <div class="adm-field">
          <label>Thème / Sous-répertoire</label>
          <select id="up-tag">
            <option value="">-- Aucun thème --</option>
            <optgroup label="Disciplines">
              <option value="Thermique">🌡️ Thermique</option>
              <option value="Acoustique">🔊 Acoustique</option>
              <option value="Technologie">⚙️ Technologie</option>
              <option value="Résistance des matériaux">🏗️ Résistance des matériaux</option>
              <option value="Rotation des banches">🔄 Rotation des banches</option>
              <option value="Rotation de camions">🚛 Rotation de camions</option>
              <option value="Etudes de prix">💰 Études de prix</option>
              <option value="Déboursés d'ouvrages">📊 Déboursés d'ouvrages</option>
              <option value="Laboratoire">🧪 Laboratoire</option>
              <option value="Quantification">📐 Quantification</option>
              <option value="Terrassement">🚜 Terrassement</option>
              <option value="Planification">📅 Planification</option>
              <option value="Temps unitaire">⏱️ Temps unitaire</option>
              <option value="Poste de bétonnage">🏭 Poste de bétonnage</option>
            </optgroup>
            <optgroup label="Logiciels">
              <option value="Revit">🏗️ Revit</option>
              <option value="Archicad">📐 Archicad</option>
              <option value="AutoCAD">✏️ AutoCAD</option>
            </optgroup>
            <optgroup label="Niveaux">
              <option value="BAC PRO">🎓 BAC PRO</option>
              <option value="BTS">📐 BTS</option>
              <option value="Licence">🏛️ Licence</option>
              <option value="Master">🔬 Mastère</option>
              <option value="Ingénieur">⚙️ Ingénieur</option>
            </optgroup>
          </select>
        </div>

        <div class="adm-field">
          <label>Description</label>
          <textarea id="up-desc" placeholder="Description du contenu…" rows="3"></textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="adm-field">
            <label>Prix (DZD)</label>
            <input type="number" id="up-price" value="0" min="0" step="50"/>
          </div>
          <div class="adm-field">
            <label>Accès</label>
            <select id="up-free">
              <option value="true">🆓 Gratuit</option>
              <option value="false">💰 Payant</option>
            </select>
          </div>
        </div>

        <div class="adm-field">
          <label>Fichier <span style="color:red">*</span> (PDF, ZIP — max 200 Mo)</label>
          <input type="file" id="up-file" accept=".pdf,.zip,.epub,.docx" required
            style="padding:8px;border:2px dashed #e2e8f0;border-radius:8px;width:100%;cursor:pointer"/>
        </div>

        <div id="up-progress" style="display:none">
          <div style="background:#e2e8f0;border-radius:999px;height:8px;overflow:hidden">
            <div id="up-bar" style="height:100%;background:#1B3A6B;width:0%;transition:width 0.3s"></div>
          </div>
          <div id="up-status" style="font-size:0.8rem;color:#64748b;margin-top:6px;text-align:center"></div>
        </div>
      </form>`,
      `<button class="btn-adm btn-adm-primary" onclick="adminApp.submitUpload()" id="up-submit-btn">
        <i class="fas fa-upload"></i> Envoyer la ressource
      </button>`
    );
  },

  async submitUpload() {
    const title   = document.getElementById('up-title').value.trim();
    const type    = document.getElementById('up-type').value;
    const level   = document.getElementById('up-level').value;
    const tag     = document.getElementById('up-tag').value;
    const desc    = document.getElementById('up-desc').value.trim();
    const price   = parseFloat(document.getElementById('up-price').value) || 0;
    const isFree  = document.getElementById('up-free').value === 'true';
    const fileEl  = document.getElementById('up-file');
    const file    = fileEl.files[0];

    if (!title) { toast('Le titre est obligatoire', 'err'); return; }
    if (!type)  { toast('Choisissez un type', 'err'); return; }
    if (!file)  { toast('Sélectionnez un fichier', 'err'); return; }

    const btn = document.getElementById('up-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours…';
    document.getElementById('up-progress').style.display = 'block';
    document.getElementById('up-status').textContent = 'Préparation…';

    const formData = new FormData();
    formData.append('title',       title);
    formData.append('type',        type);
    formData.append('study_level', level);
    formData.append('description', desc || title);
    formData.append('price',       price);
    formData.append('is_free',     isFree);
    formData.append('language',    'fr');
    if (tag) formData.append('tags', JSON.stringify([tag]));
    formData.append('file', file);

    // Simuler la progression
    let prog = 0;
    const interval = setInterval(() => {
      prog = Math.min(prog + 5, 85);
      document.getElementById('up-bar').style.width = prog + '%';
      document.getElementById('up-status').textContent = `Envoi : ${prog}%…`;
    }, 300);

    try {
      document.getElementById('up-status').textContent = 'Envoi du fichier…';
      const res = await httpUpload('/products', formData);
      clearInterval(interval);
      document.getElementById('up-bar').style.width = '100%';
      document.getElementById('up-status').textContent = '✅ Ressource ajoutée !';

      toast('✅ Ressource ajoutée avec succès !', 'ok');
      setTimeout(() => {
        this.closeModal();
        this.loadPage('products');
      }, 1200);
    } catch(e) {
      clearInterval(interval);
      document.getElementById('up-bar').style.width = '0';
      document.getElementById('up-status').textContent = '';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-upload"></i> Envoyer la ressource';
      toast('Erreur : ' + e.message, 'err');
    }
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  openModal(title, body, footer='') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer +
      `<button class="btn-adm btn-adm-gray" onclick="adminApp.closeModal()">Fermer</button>`;
    document.getElementById('modal-overlay').style.display = 'flex';
  },

  closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
  },
};

// Démarrage
document.addEventListener('DOMContentLoaded', () => adminApp.init());
