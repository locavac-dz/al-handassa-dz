/* =============================================
   Al Handassa.dz — Page Détail Produit
   ============================================= */

const SERVER_URL = 'http://localhost:5000'; // URL de base pour images/fichiers (api.js gère déjà API_BASE)

const TYPE_LABEL = {
  ouvrage: 'Ouvrage', cours_pdf: 'Cours PDF', exercices: 'Exercices',
  td_pdf: 'Travaux Dirigés', tp_pdf: 'Travaux Pratiques', tuto_pdf: 'Tutoriel PDF',
  normes: 'Normes', logiciels: 'Logiciels', pack: 'Pack',
  sujet: 'Sujet d\'examen', document_word: 'Document Word',
};
const TYPE_ICON = {
  ouvrage: '📚', cours_pdf: '📄', exercices: '✏️',
  td_pdf: '📒', tp_pdf: '🔬', tuto_pdf: '🎯',
  normes: '📋', logiciels: '💻', pack: '📦',
  sujet: '📝', document_word: '📝',
};
const LEVEL_LABEL = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire',
  avance: 'Avancé', tous: 'Tous niveaux',
};
const LANG_LABEL = { fr: 'Français', ar: 'Arabe', fr_ar: 'Français + Arabe', en: 'Anglais' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function fmt(n) { return Number(n||0).toLocaleString('fr-DZ'); }
function stars(n, size = 'md') {
  const r = Math.round(n || 0);
  return `<span class="stars-display" style="font-size:${size==='lg'?'1.3rem':'1rem'}">${'★'.repeat(r)}${'☆'.repeat(5-r)}</span>`;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, type = 'ok') {
  const el = document.getElementById('product-toast');
  el.textContent = msg;
  el.className = `product-toast toast-${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Download fichier via fetch + blob (token dans header) ─────────────────────
async function downloadBlob(productId, title) {
  const token = Auth.getToken();
  if (!token) { document.getElementById('auth-prompt').style.display = 'flex'; return; }
  toast('Préparation du téléchargement…');
  try {
    const res = await fetch(`${SERVER_URL}/api/products/${productId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403) { toast('Accès refusé. Achetez ce produit.', 'err'); return; }
    if (!res.ok) { toast('Erreur lors du téléchargement.', 'err'); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = title.replace(/[^a-zA-Z0-9؀-ۿ\s-]/g, '') + '.pdf';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    toast('Téléchargement démarré !', 'ok');
  } catch { toast('Erreur réseau.', 'err'); }
}

// ═══════════════════════════════════════════════════════════
// APPLICATION
// ═══════════════════════════════════════════════════════════
const productApp = {

  _product: null,
  _reviewRating: 0,
  _payMethod: null,
  _orderId: null,
  _wishlisted: false,

  // ── Init ──────────────────────────────────────────────────────────────────
  async init() {
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) { this._showError(); return; }

    this._initNav();

    try {
      const res = await api.product(slug);
      this._product = res.data;
      this._render(res.data, res.reviews || [], res.related || []);
      document.getElementById('product-skeleton').style.display = 'none';
      document.getElementById('product-main').style.display = 'block';
    } catch {
      this._showError();
    }
  },

  _showError() {
    document.getElementById('product-skeleton').style.display = 'none';
    document.getElementById('product-error').style.display  = 'block';
  },

  // ── Nav auth ──────────────────────────────────────────────────────────────
  _initNav() {
    const user = Auth.getUser();
    if (!user) return;
    const zone = document.getElementById('nav-auth-actions');
    zone.innerHTML = `
      <div class="user-menu">
        <button class="user-menu-btn" onclick="this.nextElementSibling.classList.toggle('open')">
          <span class="user-avatar-sm">${initials(user.first_name+' '+user.last_name)}</span>
          <span>${esc(user.first_name)}</span> <i class="fas fa-chevron-down" style="font-size:.7rem"></i>
        </button>
        <div class="user-dropdown">
          <a class="dropdown-item" href="account.html"><i class="fas fa-user"></i> Mon compte</a>
          <a class="dropdown-item" href="account.html#downloads"><i class="fas fa-download"></i> Mes téléchargements</a>
          <hr style="margin:6px 0;border-color:#e2e8f0">
          <button class="dropdown-item dropdown-logout" onclick="productApp._logout()"><i class="fas fa-sign-out-alt"></i> Déconnexion</button>
        </div>
      </div>`;
  },

  async _logout() {
    try { await api.logout(); } catch {}
    location.reload();
  },

  // ═════════════════════════ RENDER ════════════════════════════════════════

  _render(p, reviews, related) {
    // Meta SEO + Open Graph
    const desc = p.description?.replace(/<[^>]+>/g, '').slice(0, 160) || '';
    const pageUrl = `https://handassi.dz/product?slug=${p.slug}`;
    const ogImage = p.thumbnail_url
      ? `https://handassi.dz${p.thumbnail_url}`
      : 'https://handassi.dz/img/og-cover.png';

    document.getElementById('page-title').textContent = `${p.title} — Al Handassa.dz`;
    document.getElementById('page-desc').setAttribute('content', desc);
    document.getElementById('page-canonical')?.setAttribute('href', pageUrl);
    document.getElementById('og-url')?.setAttribute('content', pageUrl);
    document.getElementById('og-title')?.setAttribute('content', `${p.title} — Al Handassa.dz`);
    document.getElementById('og-desc')?.setAttribute('content', desc);
    document.getElementById('og-image')?.setAttribute('content', ogImage);
    document.getElementById('tw-image')?.setAttribute('content', ogImage);

    this._renderBreadcrumb(p);
    this._renderThumb(p);
    this._renderMeta(p);
    this._renderInfo(p);
    this._renderPrice(p);
    this._renderCTA(p);
    this._renderFeatures(p);
    this._renderDescription(p);
    this._renderPDFViewer(p);
    this._renderReviews(p, reviews);
    this._renderRelated(related);
    this._initTabs();
    this._injectJsonLd(p);
  },

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  _renderBreadcrumb(p) {
    document.getElementById('bc-type').textContent  = TYPE_LABEL[p.type] || p.type;
    document.getElementById('bc-title').textContent = p.title;
  },

  // ── Thumbnail ─────────────────────────────────────────────────────────────
  _renderThumb(p) {
    const wrap = document.getElementById('hero-thumb');
    document.getElementById('hero-icon').textContent = TYPE_ICON[p.type] || '📦';
    if (p.thumbnail_url) {
      const img = document.createElement('img');
      img.src = SERVER_URL + p.thumbnail_url;
      img.alt = p.title;
      img.className = 'hero-thumb-img';
      img.onerror = () => img.remove();
      wrap.prepend(img);
    }
  },

  // ── Meta bar ──────────────────────────────────────────────────────────────
  _renderMeta(p) {
    document.getElementById('meta-dl').textContent    = fmt(p.downloads_count);
    document.getElementById('meta-views').textContent = fmt(p.views_count);
    document.getElementById('meta-lang').textContent  = LANG_LABEL[p.language] || p.language || 'Français';

    const tagsEl = document.getElementById('hero-tags');
    const tags = Array.isArray(p.tags) ? p.tags : [];
    tagsEl.innerHTML = tags.map(t => `<span class="tag-pill">${esc(t)}</span>`).join('');
  },

  // ── Badges + titre + instructeur + rating ─────────────────────────────────
  _renderInfo(p) {
    document.getElementById('hero-badges').innerHTML = [
      `<span class="hero-badge badge-type"><i class="fas fa-tag"></i> ${esc(TYPE_LABEL[p.type] || p.type)}</span>`,
      p.study_level !== 'tous'
        ? `<span class="hero-badge badge-level"><i class="fas fa-graduation-cap"></i> ${esc(LEVEL_LABEL[p.study_level] || p.study_level)}</span>`
        : '',
      p.is_free     ? `<span class="hero-badge badge-free"><i class="fas fa-gift"></i> Gratuit</span>` :
      p.preview_url ? `<span class="hero-badge badge-preview"><i class="fas fa-eye"></i> Aperçu gratuit</span>` : '',
      p.is_featured ? `<span class="hero-badge badge-featured"><i class="fas fa-fire"></i> Bestseller</span>` : '',
    ].filter(Boolean).join('');

    document.getElementById('hero-title').textContent = p.title;

    // Instructeur
    const instEl = document.getElementById('hero-instructor');
    if (p.instructor_name) {
      instEl.innerHTML = `
        <div class="hero-avatar">${
          p.instructor_avatar
            ? `<img src="${SERVER_URL}${p.instructor_avatar}" alt="${esc(p.instructor_name)}">`
            : initials(p.instructor_name)
        }</div>
        <span>Par <strong>${esc(p.instructor_name)}</strong>${p.institution ? ` — ${esc(p.institution)}` : ''}</span>`;
    } else {
      instEl.innerHTML = `<div class="hero-avatar">HD</div><span>Par <strong>Al Handassa.dz</strong></span>`;
    }

    // Rating
    const ratingEl = document.getElementById('hero-rating');
    if (p.rating_count > 0) {
      ratingEl.innerHTML = `
        <span class="rating-num">${Number(p.rating_avg).toFixed(1)}</span>
        ${stars(p.rating_avg)}
        <span class="rating-sub">(${p.rating_count} avis)</span>`;
    } else {
      ratingEl.innerHTML = `${stars(0)} <span class="rating-sub">Aucun avis pour l'instant</span>`;
    }
  },

  // ── Prix ──────────────────────────────────────────────────────────────────
  _renderPrice(p) {
    const el = document.getElementById('hero-price');
    if (p.is_free) {
      el.innerHTML = `<div class="price-tag-free"><i class="fas fa-gift"></i> Gratuit</div>`;
      return;
    }
    const eff = parseFloat(p.effective_price ?? p.price);
    const hasDiscount = p.discount_price && parseFloat(p.discount_price) !== eff;
    el.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap">
        <span class="price-tag-amount">${fmt(eff)}</span>
        <span class="price-tag-currency">DZD</span>
        ${hasDiscount ? `<span class="price-tag-old">${fmt(p.price)} DZD</span>` : ''}
        ${hasDiscount ? `<span class="price-tag-discount">-${Math.round((1-eff/p.price)*100)}%</span>` : ''}
      </div>`;
  },

  // ── CTA (logique d'accès) ─────────────────────────────────────────────────
  _renderCTA(p) {
    const btn  = document.getElementById('cta-btn');
    const user = Auth.getUser();

    if (p.is_free) {
      // Guide logiciels : CTA scroll vers la liste
      if (!p.file_url && p.type === 'logiciels' && p.metadata?.software_list) {
        btn.className = 'btn-buy btn-free';
        btn.innerHTML = '<i class="fas fa-laptop-code"></i> Consulter le guide';
        btn.disabled = false;
        btn.onclick = () => {
          document.getElementById('software-list-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        return;
      }
      if (!p.file_url) {
        btn.innerHTML = '<i class="fas fa-clock"></i> Bientôt disponible';
        btn.disabled = true;
        return;
      }
      btn.className = 'btn-buy btn-free';
      btn.innerHTML = '<i class="fas fa-download"></i> Télécharger gratuitement';
      btn.onclick = () => {
        if (!user) { document.getElementById('auth-prompt').style.display = 'flex'; return; }
        downloadBlob(p.id, p.title);
      };
      btn.disabled = false;
      return;
    }

    // Produit payant
    if (!user) {
      btn.className = 'btn-buy';
      btn.innerHTML = '<i class="fas fa-lock"></i> Se connecter pour acheter';
      btn.disabled = false;
      btn.onclick = () => { document.getElementById('auth-prompt').style.display = 'flex'; };
      return;
    }

    // Vérifier abonnement pro/standard → accès universel
    if (['standard', 'pro'].includes(user.subscription_plan)) {
      btn.className = 'btn-buy btn-owned';
      btn.innerHTML = '<i class="fas fa-download"></i> Télécharger (inclus dans votre abonnement)';
      btn.disabled = false;
      btn.onclick = () => downloadBlob(p.id, p.title);
      return;
    }

    // Vérifier si déjà acheté
    this._checkOwnership(p).then(owned => {
      if (owned) {
        btn.className = 'btn-buy btn-owned';
        btn.innerHTML = '<i class="fas fa-download"></i> Télécharger (déjà acheté)';
        btn.disabled = false;
        btn.onclick = () => downloadBlob(p.id, p.title);
      } else {
        const price = parseFloat(p.effective_price ?? p.price);
        btn.className = 'btn-buy';
        btn.innerHTML = `<i class="fas fa-shopping-cart"></i> Acheter — ${fmt(price)} DZD`;
        btn.disabled = false;
        btn.onclick = () => this.openPayModal();
      }
    });
  },

  async _checkOwnership(p) {
    try {
      // myPurchases = commandes payées (source la plus fiable)
      const { data } = await api.myPurchases();
      if ((data || []).some(d => String(d.id) === String(p.id))) return true;
    } catch {}
    try {
      // Fallback : historique des téléchargements
      const { data } = await api.myDownloads();
      return (data || []).some(d => String(d.product_id || d.id) === String(p.id));
    } catch { return false; }
  },

  // ── Features dynamiques ──────────────────────────────────────────────────
  _renderFeatures(p) {
    const el = document.getElementById('hero-features');
    if (!el) return;
    const fi = (icon, text) => `<div class="feature-item"><i class="fas fa-${icon}"></i> ${text}</div>`;

    const features = [];
    if (p.is_free) {
      features.push(fi('gift', 'Accès entièrement gratuit'));
    } else {
      features.push(fi('bolt', 'Accès immédiat après validation du paiement'));
    }

    if (p.type === 'logiciels') {
      features.push(fi('laptop-code', 'Guide logiciels avec liens de téléchargement officiels'));
      features.push(fi('sync-alt', 'Mis à jour régulièrement'));
    } else if (p.type === 'document_word') {
      features.push(fi('file-word', 'Fichier Word modifiable (DOCX)'));
      features.push(fi('edit', 'Personnalisez le document à votre image'));
    } else if (p.type === 'pack') {
      features.push(fi('archive', 'Pack complet — plusieurs fichiers inclus'));
      features.push(fi('download', 'Téléchargement unique — accès illimité'));
    } else {
      features.push(fi('file-pdf', 'Fichier PDF téléchargeable et imprimable'));
    }

    features.push(fi('headset', 'Support Al Handassa.dz inclus'));
    if (!p.is_free) {
      features.push(fi('shield-alt', 'Satisfait ou remboursé — 7 jours'));
    }

    el.innerHTML = features.join('');
  },

  // ── JSON-LD (SEO structuré Google) ────────────────────────────────────────
  _injectJsonLd(p) {
    const existing = document.getElementById('json-ld-product');
    if (existing) existing.remove();

    const price = p.is_free ? '0' : String(parseFloat(p.effective_price ?? p.price) || 0);
    const image = p.thumbnail_url
      ? `https://handassi.dz${p.thumbnail_url}`
      : 'https://handassi.dz/img/og-cover.png';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.title,
      description: (p.description || '').replace(/<[^>]+>/g, '').slice(0, 300),
      image,
      url: `https://handassi.dz/product?slug=${p.slug}`,
      brand: { '@type': 'Brand', name: 'Al Handassa.dz' },
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: 'DZD',
        availability: p.file_url
          ? 'https://schema.org/InStock'
          : 'https://schema.org/PreOrder',
        url: `https://handassi.dz/product?slug=${p.slug}`,
        seller: { '@type': 'Organization', name: 'Al Handassa.dz' },
      },
    };

    // Ajouter les avis si disponibles
    if (p.rating_count > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(p.rating_avg).toFixed(1),
        reviewCount: p.rating_count,
        bestRating: '5',
        worstRating: '1',
      };
    }

    const script = document.createElement('script');
    script.id   = 'json-ld-product';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  },

  // ── Description ───────────────────────────────────────────────────────────
  _renderDescription(p) {
    const el = document.getElementById('desc-content');
    if (!p.description) {
      el.innerHTML = '<p style="color:#94a3b8;font-style:italic">Aucune description disponible.</p>';
    } else {
      // Convertir les sauts de ligne en paragraphes
      const paragraphs = p.description
        .split(/\n{2,}/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => `<p>${esc(s).replace(/\n/g, '<br>')}</p>`)
        .join('');
      el.innerHTML = paragraphs;
    }

    // Rendu spécial pour les guides logiciels
    if (p.type === 'logiciels' && Array.isArray(p.metadata?.software_list) && p.metadata.software_list.length) {
      this._renderSoftwareList(p.metadata.software_list);
    }
  },

  // ── Guide logiciels ───────────────────────────────────────────────────────
  _renderSoftwareList(list) {
    const el = document.getElementById('desc-content');

    const LEVEL_MAP = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };

    const cards = list.map(sw => `
      <div class="sw-card">
        <div class="sw-card-header">
          <span class="sw-icon">${esc(sw.icon || '💻')}</span>
          <div class="sw-card-title-block">
            <h3 class="sw-name">${esc(sw.name)}</h3>
            <span class="sw-category">${esc(sw.category || '')}</span>
          </div>
          ${sw.badge ? `<span class="sw-badge" style="background:${esc(sw.badge_color||'#1B3A6B')}">${esc(sw.badge)}</span>` : ''}
        </div>

        <p class="sw-desc">${esc(sw.description || '')}</p>

        ${sw.features?.length ? `
        <ul class="sw-features">
          ${sw.features.map(f => `<li><i class="fas fa-check-circle"></i> ${esc(f)}</li>`).join('')}
        </ul>` : ''}

        <div class="sw-footer">
          <div class="sw-meta">
            ${sw.platforms?.length ? `<span class="sw-pill"><i class="fas fa-desktop"></i> ${sw.platforms.map(esc).join(' / ')}</span>` : ''}
            ${sw.level ? `<span class="sw-pill"><i class="fas fa-graduation-cap"></i> ${esc(LEVEL_MAP[sw.level] || sw.level)}</span>` : ''}
            ${sw.price_info ? `<span class="sw-pill sw-pill-price"><i class="fas fa-tag"></i> ${esc(sw.price_info)}</span>` : ''}
          </div>
          <div class="sw-links">
            ${sw.trial_url ? `<a class="sw-btn sw-btn-trial" href="${esc(sw.trial_url)}" target="_blank" rel="noopener"><i class="fas fa-play-circle"></i> ${esc(sw.trial_label || 'Essai gratuit')}</a>` : ''}
            ${sw.url ? `<a class="sw-btn sw-btn-site" href="${esc(sw.url)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> ${esc(sw.url_label || 'Site officiel')}</a>` : ''}
          </div>
        </div>
      </div>`).join('');

    const section = document.createElement('div');
    section.id = 'software-list-section';
    section.className = 'sw-section';
    section.innerHTML = `
      <h2 class="sw-section-title"><i class="fas fa-laptop-code"></i> Logiciels présentés</h2>
      <div class="sw-grid">${cards}</div>`;

    el.after(section);
  },

  // ── Lecteur PDF ───────────────────────────────────────────────────────────
  _renderPDFViewer(p) {
    const zone = document.getElementById('pdf-viewer-zone');
    if (!p.preview_url) { zone.innerHTML = ''; return; }

    // ── Cas 1 : aperçu PDF direct → iframe ─────────────────────────────────
    if (p.preview_url.endsWith('.pdf')) {
      const pdfUrl  = SERVER_URL + p.preview_url;
      const pages   = p.preview_pages ? `${p.preview_pages} pages` : 'Aperçu';
      zone.innerHTML = `
        <div class="pdf-viewer-wrap" style="margin-top:32px">
          <div class="pdf-viewer-header">
            <span><i class="fas fa-file-pdf"></i> Aperçu du document
              <span class="pdf-preview-badge"><i class="fas fa-eye"></i> ${esc(pages)}</span>
            </span>
            <a href="${esc(pdfUrl)}" target="_blank" rel="noopener" title="Ouvrir dans un onglet">
              <i class="fas fa-external-link-alt"></i> Nouvel onglet
            </a>
          </div>
          <iframe class="pdf-iframe" src="${esc(pdfUrl)}" title="Aperçu du document"></iframe>
          <div class="pdf-preview-footer">
            <i class="fas fa-eye" style="color:#b45309"></i>
            <strong>Aperçu gratuit</strong> — ${esc(pages)} consultables.
            Téléchargez le fichier complet pour travailler hors ligne.
          </div>
        </div>`;
      return;
    }

    // ── Cas 2 : images pré-extraites (canvas protégé) ──────────────────────
    if (!p.preview_pages) { zone.innerHTML = ''; return; }

    const base  = p.preview_url.replace(/\.pdf$/, '');
    const pages = parseInt(p.preview_pages, 10);
    window._pdfViewer = { base, pages, current: 1 };

    zone.innerHTML = `
      <div class="pdf-viewer-wrap">
        <div class="pdf-viewer-header">
          <span><i class="fas fa-file-pdf"></i> Aperçu du document
            <span class="pdf-preview-badge"><i class="fas fa-eye"></i> ${pages} pages</span>
          </span>
        </div>
        <div class="pdf-open-zone">
          <div class="pdf-thumb-preview">
            <img src="${esc(SERVER_URL + base + '_p1.jpg')}" alt="Page 1"
                 onerror="this.style.opacity='0.3'">
            <div class="pdf-thumb-overlay">
              <button class="pdf-open-btn" onclick="productApp._openPDFViewer()">
                <i class="fas fa-expand"></i> Ouvrir l'aperçu
              </button>
            </div>
          </div>
        </div>
        <div class="pdf-preview-footer">
          <i class="fas fa-eye" style="color:#b45309"></i>
          <strong>Aperçu complet gratuit</strong> — ${pages} pages consultables.
          Téléchargez le fichier complet pour travailler hors ligne.
        </div>
      </div>`;

    // Créer le modal viewer s'il n'existe pas
    if (!document.getElementById('pdf-lightbox')) {
      const lb = document.createElement('div');
      lb.id = 'pdf-lightbox';
      lb.className = 'pdf-lightbox';
      lb.innerHTML = `
        <div class="pdf-lb-overlay" onclick="productApp._closePDFViewer()"></div>
        <div class="pdf-lb-window">
          <div class="pdf-lb-header">
            <span class="pdf-lb-title"><i class="fas fa-file-pdf"></i> Aperçu du document
              <span class="pdf-lb-counter" id="pdf-lb-counter"></span>
            </span>
            <button class="pdf-lb-close" onclick="productApp._closePDFViewer()" title="Fermer">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="pdf-lb-body" id="pdf-lb-body">
            <div class="pdf-lb-loading-init" id="pdf-lb-loading"><i class="fas fa-spinner fa-spin fa-2x"></i><br>Chargement…</div>
          </div>
        </div>`;
      document.body.appendChild(lb);

      // Fermer avec Échap
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') productApp._closePDFViewer();
        // Bloquer Ctrl+S (sauvegarder), Ctrl+P (imprimer) quand lightbox ouvert
        const lb = document.getElementById('pdf-lightbox');
        if (lb?.classList.contains('open')) {
          if ((e.ctrlKey || e.metaKey) && ['s','p','u'].includes(e.key.toLowerCase())) {
            e.preventDefault(); e.stopPropagation();
          }
        }
      });
    }
  },

  _openPDFViewer() {
    const v = window._pdfViewer;
    if (!v) return;

    const lb   = document.getElementById('pdf-lightbox');
    const body = document.getElementById('pdf-lb-body');
    const counter = document.getElementById('pdf-lb-counter');
    counter.textContent = `${v.pages} pages`;

    // Injecter les pages (canvas protégés) une seule fois
    if (!body.dataset.loaded || body.dataset.loaded !== v.base) {
      body.dataset.loaded = v.base;
      body.innerHTML = '';

      for (let i = 1; i <= v.pages; i++) {
        const wrap = document.createElement('div');
        wrap.className = 'pdf-lb-page';
        wrap.id = `pdf-p-${i}`;

        const label = document.createElement('span');
        label.className = 'pdf-lb-page-num';
        label.textContent = `Page ${i}`;

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.display = 'block';
        canvas.dataset.src = `${SERVER_URL}${v.base}_p${i}.jpg`;
        canvas.dataset.page = i;

        wrap.appendChild(label);
        wrap.appendChild(canvas);
        body.appendChild(wrap);

        // Charger l'image et la dessiner sur le canvas avec filigrane
        productApp._drawProtectedPage(canvas);
      }
    }

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    body.scrollTop = 0;

    // Bloquer clic droit dans le lightbox
    body.oncontextmenu = e => e.preventDefault();

    // Flou quand la fenêtre perd le focus (snipping tool, alt+tab…)
    window._pdfBlurHandler = () => {
      if (lb.classList.contains('open')) lb.classList.add('pdf-lb-blurred');
    };
    window._pdfFocusHandler = () => lb.classList.remove('pdf-lb-blurred');
    window.addEventListener('blur',  window._pdfBlurHandler);
    window.addEventListener('focus', window._pdfFocusHandler);
  },

  _drawProtectedPage(canvas) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = canvas.dataset.src;
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // 1. Dessiner l'image
      ctx.drawImage(img, 0, 0);

      // 2. Filigrane diagonal répété
      const user  = Auth.getUser();
      const label = user?.email
        ? `Al Handassa.dz • ${user.email} • ${new Date().toLocaleDateString('fr-DZ')}`
        : `Al Handassa.dz • Aperçu gratuit • ${new Date().toLocaleDateString('fr-DZ')}`;

      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle   = '#1B3A6B';
      ctx.font        = `bold ${Math.round(img.naturalWidth * 0.028)}px Arial`;
      ctx.textAlign   = 'center';

      // Rotation 45° et répétition en grille
      const step = Math.round(img.naturalWidth * 0.38);
      for (let y = -img.naturalHeight; y < img.naturalHeight * 2; y += step) {
        for (let x = -img.naturalWidth; x < img.naturalWidth * 2; x += step) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 5);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      }

      // 3. Bordure légère "Aperçu"
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#1B3A6B';
      ctx.lineWidth   = 6;
      ctx.strokeRect(3, 3, img.naturalWidth - 6, img.naturalHeight - 6);

      ctx.restore();
    };
    img.onerror = () => {
      canvas.closest('.pdf-lb-page')?.classList.add('pdf-lb-page-err');
    };
  },

  _closePDFViewer() {
    const lb = document.getElementById('pdf-lightbox');
    lb?.classList.remove('open', 'pdf-lb-blurred');
    document.body.style.overflow = '';
    // Retirer les listeners focus/blur
    if (window._pdfBlurHandler)  window.removeEventListener('blur',  window._pdfBlurHandler);
    if (window._pdfFocusHandler) window.removeEventListener('focus', window._pdfFocusHandler);
  },

  // ── Avis ──────────────────────────────────────────────────────────────────
  _renderReviews(p, reviews) {
    const countBadge = document.getElementById('review-count-badge');
    countBadge.textContent = reviews.length > 0 ? `(${reviews.length})` : '';

    // Overview
    const overviewEl = document.getElementById('reviews-overview-wrap');
    if (reviews.length === 0) {
      overviewEl.innerHTML = `<p style="color:#94a3b8;text-align:center;padding:24px 0">Aucun avis pour l'instant. Soyez le premier !</p>`;
    } else {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      // Calcul distribution
      const dist = [5,4,3,2,1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: Math.round(reviews.filter(r => r.rating === star).length / reviews.length * 100),
      }));
      overviewEl.innerHTML = `
        <div class="reviews-overview">
          <div class="reviews-big-score">
            <span class="reviews-big-num">${avg.toFixed(1)}</span>
            <div class="reviews-big-stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</div>
            <div class="reviews-big-count">${reviews.length} avis</div>
          </div>
          <div class="reviews-bars">
            ${dist.map(d => `
              <div class="review-bar-row">
                <span class="review-bar-label">${d.star}</span>
                <i class="fas fa-star" style="color:#C8A142;font-size:.75rem"></i>
                <div class="review-bar-track">
                  <div class="review-bar-fill" style="width:${d.pct}%"></div>
                </div>
                <span class="review-bar-count">${d.count}</span>
              </div>`).join('')}
          </div>
        </div>`;
    }

    // Liste des avis
    const listEl = document.getElementById('review-list');
    listEl.innerHTML = reviews.slice(0, 8).map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${initials((r.first_name||'?')+' '+(r.last_name||''))}</div>
          <div class="review-meta">
            <div class="review-author">${esc(r.first_name)} ${esc(r.last_name)}</div>
            <div class="review-date">${new Date(r.created_at).toLocaleDateString('fr-DZ',{day:'2-digit',month:'long',year:'numeric'})}</div>
          </div>
          <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        </div>
        ${r.comment ? `<p class="review-body">${esc(r.comment)}</p>` : ''}
      </div>`).join('') || '<p style="color:#94a3b8;text-align:center">Aucun avis approuvé.</p>';

    // Formulaire d'avis
    this._renderReviewForm(p);
  },

  _renderReviewForm(p) {
    const zone = document.getElementById('review-form-zone');
    const user = Auth.getUser();

    if (!user) {
      zone.innerHTML = `
        <div class="review-form-wrap">
          <div class="review-login-prompt">
            <i class="fas fa-lock" style="font-size:1.5rem;color:#cbd5e1;display:block;margin-bottom:8px"></i>
            <a href="index.html#login">Connectez-vous</a> pour laisser un avis.
          </div>
        </div>`;
      return;
    }

    zone.innerHTML = `
      <div class="review-form-wrap">
        <h3>Votre avis</h3>
        <p class="section-label">Note</p>
        <div class="star-picker" id="star-picker">
          ${[1,2,3,4,5].map(n => `<button type="button" data-star="${n}" onclick="productApp.setStar(${n})">☆</button>`).join('')}
        </div>
        <textarea class="review-textarea" id="review-comment" placeholder="Partagez votre expérience avec ce document…" rows="3"></textarea>
        <div id="review-form-err" class="review-form-error" style="display:none"></div>
        <button class="btn btn-primary" onclick="productApp.submitReview('${esc(p.id)}')">
          <i class="fas fa-paper-plane"></i> Publier l'avis
        </button>
      </div>`;
  },

  setStar(n) {
    this._reviewRating = n;
    document.querySelectorAll('#star-picker button').forEach((btn, i) => {
      btn.textContent = i < n ? '★' : '☆';
      btn.classList.toggle('active', i < n);
    });
  },

  async submitReview(productId) {
    const errEl = document.getElementById('review-form-err');
    errEl.style.display = 'none';
    if (!this._reviewRating) {
      errEl.textContent = 'Veuillez sélectionner une note.';
      errEl.style.display = 'block';
      return;
    }
    const comment = document.getElementById('review-comment').value.trim();
    try {
      await api.addReview(productId, this._reviewRating, comment);
      toast('Avis soumis. Il sera visible après modération.', 'ok');
      document.getElementById('review-form-zone').innerHTML =
        `<div class="review-form-wrap"><p style="text-align:center;color:#15803d"><i class="fas fa-check-circle"></i> Merci pour votre avis !</p></div>`;
    } catch (ex) {
      errEl.textContent = ex.message;
      errEl.style.display = 'block';
    }
  },

  // ── Produits similaires ───────────────────────────────────────────────────
  _renderRelated(related) {
    const el = document.getElementById('related-grid');
    if (!related.length) {
      el.innerHTML = '<p style="color:#94a3b8">Aucun produit similaire.</p>';
      return;
    }
    el.innerHTML = related.map(p => `
      <a href="product?slug=${esc(p.slug)}" class="mini-product-card">
        <div class="mini-card-icon">${TYPE_ICON[p.type] || '📦'}</div>
        <div class="mini-card-body">
          <div class="mini-card-title">${esc(p.title)}</div>
          <div class="mini-card-meta">${TYPE_LABEL[p.type] || ''} ${p.rating_avg ? '· ★ '+Number(p.rating_avg).toFixed(1) : ''}</div>
          <div class="mini-card-price ${p.is_free ? 'free' : ''}">
            ${p.is_free ? '🆓 Gratuit' : fmt(p.effective_price ?? p.price)+' DZD'}
          </div>
        </div>
      </a>`).join('');
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  _initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(target)?.classList.add('active');
      });
    });
  },

  // ── Wishlist ──────────────────────────────────────────────────────────────
  async toggleWishlist() {
    if (!Auth.getUser()) { document.getElementById('auth-prompt').style.display = 'flex'; return; }
    const p = this._product;
    try {
      await api.toggleWishlist(p.id, null);
      this._wishlisted = !this._wishlisted;
      const btn = document.getElementById('wishlist-btn');
      btn.innerHTML = this._wishlisted
        ? '<i class="fas fa-heart" style="color:#e11d48"></i> Retiré des favoris'
        : '<i class="far fa-heart"></i> Ajouter aux favoris';
      btn.classList.toggle('wishlisted', this._wishlisted);
      toast(this._wishlisted ? 'Ajouté aux favoris' : 'Retiré des favoris');
    } catch (ex) { toast(ex.message, 'err'); }
  },

  // ═════════════════════════ MODAL PAIEMENT ════════════════════════════════

  openPayModal() {
    if (!Auth.getUser()) { document.getElementById('auth-prompt').style.display = 'flex'; return; }
    const p = this._product;
    const price = fmt(parseFloat(p.effective_price ?? p.price));
    this._payMethod = null;
    this._orderId   = null;

    document.getElementById('pay-modal-body').innerHTML = `
      <div class="pay-summary">
        <div class="pay-summary-icon">${TYPE_ICON[p.type] || '📦'}</div>
        <div>
          <div class="pay-summary-title">${esc(p.title)}</div>
          <div class="pay-summary-price">${price} DZD</div>
        </div>
      </div>

      <p class="section-label">Choisissez votre mode de paiement</p>
      <div class="pay-methods">
        <button class="pay-method-btn" onclick="productApp.selectMethod('ccp',this)">
          <div class="pay-method-icon">🏦</div>
          <div class="pay-method-info">
            <div class="pay-method-name">CCP (Algérie Poste)</div>
            <div class="pay-method-desc">Virement vers compte CCP — validé sous 24h</div>
          </div>
          <div class="pay-method-check"></div>
        </button>
        <button class="pay-method-btn" onclick="productApp.selectMethod('virement',this)">
          <div class="pay-method-icon">🏛️</div>
          <div class="pay-method-info">
            <div class="pay-method-name">Virement bancaire (CPA / BNA…)</div>
            <div class="pay-method-desc">Virement interbancaire — validé sous 48h</div>
          </div>
          <div class="pay-method-check"></div>
        </button>
        <button class="pay-method-btn" onclick="productApp.selectMethod('baridimob',this)">
          <div class="pay-method-icon">📱</div>
          <div class="pay-method-info">
            <div class="pay-method-name">BaridiMob</div>
            <div class="pay-method-desc">Paiement mobile instantané via l'app Baridi</div>
          </div>
          <div class="pay-method-check"></div>
        </button>
      </div>

      <div id="pay-details-zone"></div>
      <div id="pay-modal-err" class="pay-error" style="display:none"></div>`;

    document.getElementById('pay-modal-footer').innerHTML = `
      <button class="btn btn-outline" style="flex:1" onclick="productApp.closePayModal()">Annuler</button>
      <button class="btn btn-buy" style="flex:2" id="pay-confirm-btn" onclick="productApp.confirmPayment()" disabled>
        <i class="fas fa-lock"></i> Confirmer le paiement
      </button>`;

    document.getElementById('payment-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  selectMethod(method, btnEl) {
    this._payMethod = method;
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    document.getElementById('pay-confirm-btn').disabled = false;

    const BANK_INFO = {
      ccp: {
        title: 'Coordonnées CCP',
        rows: [
          ['Titulaire', 'Al Handassa.dz SARL'],
          ['N° Compte CCP', '1234567 Clé 89'],
          ['Agence', 'Alger Centre — 16001'],
        ],
        hint: 'Effectuez le virement depuis votre agence ou via CCP Mobile, puis saisissez la référence de l\'opération.',
      },
      virement: {
        title: 'Coordonnées bancaires',
        rows: [
          ['Banque', 'CPA — Crédit Populaire d\'Algérie'],
          ['IBAN', 'DZ59 0001 0000 0000 1234 5678 910'],
          ['Bénéficiaire', 'Al Handassa.dz SARL'],
        ],
        hint: 'Effectuez le virement depuis votre banque et conservez le reçu. Le délai de validation est de 24 à 48h.',
      },
      baridimob: {
        title: 'Paiement BaridiMob',
        rows: [
          ['N° Baridi', '00799 12345678 10'],
          ['Nom', 'Al Handassa DZ'],
        ],
        hint: 'Ouvrez l\'app BaridiMob → Transfert → saisissez le numéro ci-dessus, puis entrez votre référence.',
      },
    };

    const info = BANK_INFO[method];
    document.getElementById('pay-details-zone').innerHTML = `
      <div class="pay-bank-details">
        <h4><i class="fas fa-info-circle"></i> ${info.title}</h4>
        ${info.rows.map(([l,v]) => `
          <div class="pay-bank-row">
            <span class="pay-bank-label">${l}</span>
            <span class="pay-bank-value">${v}</span>
          </div>`).join('')}
        <p style="margin-top:10px;font-size:.8rem;color:#92400e"><i class="fas fa-exclamation-triangle"></i> ${info.hint}</p>
      </div>
      <div class="pay-field">
        <label>Référence de la transaction *</label>
        <input type="text" id="pay-reference" placeholder="Ex: OP20240509-123456" />
      </div>
      <div class="pay-field">
        <label>Note (optionnel)</label>
        <textarea id="pay-note" rows="2" placeholder="Précisions sur votre paiement…"></textarea>
      </div>`;
  },

  async confirmPayment() {
    const p = this._product;
    const errEl = document.getElementById('pay-modal-err');
    errEl.style.display = 'none';

    if (!this._payMethod) {
      errEl.textContent = 'Sélectionnez un mode de paiement.';
      errEl.style.display = 'block';
      return;
    }
    const reference = document.getElementById('pay-reference')?.value.trim();
    if (!reference) {
      errEl.textContent = 'La référence de transaction est obligatoire.';
      errEl.style.display = 'block';
      return;
    }

    const btn = document.getElementById('pay-confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement…';

    try {
      // 1. Créer la commande
      const orderRes = await api.createOrder(
        [{ id: p.id, type: 'product' }],
        this._payMethod
      );
      const orderId = orderRes.data?.id;

      // 2. Soumettre le paiement — validation automatique immédiate
      const note = document.getElementById('pay-note')?.value.trim();
      const payRes = await api.manualPayment(orderId, this._payMethod, reference, note);

      // 3. Afficher succès + bouton téléchargement immédiat
      this._showPaySuccess(orderRes.data?.order_number || '—', p.id, p.title);
    } catch (ex) {
      errEl.textContent = ex.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-lock"></i> Confirmer le paiement';
    }
  },

  _showPaySuccess(orderNum, productId, productTitle) {
    document.getElementById('pay-modal-body').innerHTML = `
      <div class="pay-success">
        <div class="pay-success-icon">✅</div>
        <h3>Paiement confirmé !</h3>
        <p>Votre accès a été débloqué immédiatement.</p>
        <div class="order-num">Commande : ${esc(orderNum)}</div>
        <p>Téléchargez votre fichier ci-dessous :</p>
      </div>`;
    document.getElementById('pay-modal-footer').innerHTML = `
      <button class="btn btn-primary" style="flex:2"
        onclick="productApp.closePayModal(); downloadBlob('${esc(productId)}','${esc(productTitle)}')">
        <i class="fas fa-download"></i> Télécharger maintenant
      </button>
      <button class="btn btn-outline" style="flex:1" onclick="productApp.closePayModal()">
        <i class="fas fa-times"></i> Fermer
      </button>`;
    toast('Paiement validé ! Téléchargement disponible.', 'ok');
    // Mettre à jour le bouton principal de la page
    const ctaBtn = document.getElementById('cta-btn');
    if (ctaBtn) {
      ctaBtn.className = 'btn-buy btn-owned';
      ctaBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger';
      ctaBtn.onclick = () => downloadBlob(productId, productTitle);
      ctaBtn.disabled = false;
    }
  },

  closePayModal() {
    document.getElementById('payment-modal').style.display = 'none';
    document.body.style.overflow = '';
  },
};

// ── Fermer modal sur backdrop ──────────────────────────────────────────────────
document.getElementById('payment-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) productApp.closePayModal();
});
document.getElementById('auth-prompt').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => productApp.init());
