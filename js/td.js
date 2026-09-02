/* =============================================
   AL HANDASSA.DZ — Page TD & Exercices
   ============================================= */

const LEVEL_MAP = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', tous: 'Tous niveaux' };

// Thèmes : icône + couleur + label
const THEME_META = {
  topographie: { icon: '📐', color: '#1565C0', bg: '#DBEAFE', label: 'Topographie & DAO' },
  beton:        { icon: '🏗️', color: '#b45309', bg: '#FEF3C7', label: 'Béton Armé' },
  structures:   { icon: '⚙️', color: '#6d28d9', bg: '#EDE9FE', label: 'Résistance des Matériaux' },
  hydraulique:  { icon: '💧', color: '#0e7490', bg: '#CFFAFE', label: 'Hydraulique' },
  geo:          { icon: '🌍', color: '#166534', bg: '#DCFCE7', label: 'Géotechnique' },
  routes:       { icon: '🛣️', color: '#78350f', bg: '#FDF3E3', label: 'Routes & VRD' },
  default:      { icon: '📝', color: '#374151', bg: '#F3F4F6', label: '' },
};

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let _themes      = [];  // [{slug, label, icon, color, bg, items:[...]}]
let _activeTheme = '';
let _search      = '';

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  document.getElementById('search-input').addEventListener('input', e => {
    _search = e.target.value.trim().toLowerCase();
    render();
  });
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('open');
  });
});

/* ── Charger les exercices depuis l'API ── */
async function loadAll() {
  try {
    const res  = await fetch(`${API_BASE}/products?type=exercices&limit=200`);
    if (!res.ok) throw new Error('API error');
    const { data } = await res.json();

    // Grouper par catégorie (slug)
    const map = {};
    for (const p of data) {
      const catSlug = p.category_slug || 'default';
      if (!map[catSlug]) map[catSlug] = [];
      map[catSlug].push(p);
    }

    // Construire les thèmes
    _themes = Object.entries(map).map(([slug, items]) => {
      const meta = THEME_META[slug] || THEME_META.default;
      return {
        slug,
        label: meta.label || slug,
        icon:  meta.icon,
        color: meta.color,
        bg:    meta.bg,
        items,
      };
    });

    // Trier : topographie en premier, puis alphabétique
    _themes.sort((a, b) => {
      if (a.slug === 'topographie') return -1;
      if (b.slug === 'topographie') return 1;
      return a.label.localeCompare(b.label, 'fr');
    });

    // Compteurs hero
    const total = _themes.reduce((acc, t) => acc + t.items.length, 0);
    document.getElementById('stat-total').textContent  = total;
    document.getElementById('stat-themes').textContent = _themes.length;

    buildFilters();
    document.getElementById('td-skeleton').style.display = 'none';
    document.getElementById('td-content').style.display  = 'block';
    render();

  } catch (err) {
    console.error(err);
    document.getElementById('td-skeleton').style.display = 'none';
    document.getElementById('td-content').style.display  = 'block';
    document.getElementById('td-content').innerHTML =
      `<div class="td-empty" style="display:flex">
        <div class="td-empty-icon">⚠️</div>
        <h3>Erreur de chargement</h3>
        <p>Impossible de charger les TD. Vérifiez que le serveur est démarré.</p>
       </div>`;
  }
}

/* ── Filtres thèmes ── */
function buildFilters() {
  const wrap   = document.getElementById('theme-filters');
  const allBtn = wrap.querySelector('[data-theme=""]');
  allBtn.addEventListener('click', () => setTheme('', allBtn));

  _themes.forEach(t => {
    const btn = document.createElement('button');
    btn.className    = 'td-filter-btn';
    btn.dataset.theme = t.slug;
    btn.innerHTML    = `${t.icon} ${t.label}`;
    btn.addEventListener('click', () => setTheme(t.slug, btn));
    wrap.appendChild(btn);
  });
}

function setTheme(slug, btn) {
  _activeTheme = slug;
  document.querySelectorAll('.td-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

/* ── Rendu ── */
function render() {
  const content = document.getElementById('td-content');
  const emptyEl = document.getElementById('td-empty');

  let themes = _activeTheme ? _themes.filter(t => t.slug === _activeTheme) : _themes;
  let hasResults = false;

  const html = themes.map(t => {
    let items = t.items;
    if (_search) {
      items = items.filter(p =>
        p.title?.toLowerCase().includes(_search) ||
        p.description?.toLowerCase().includes(_search)
      );
    }
    if (!items.length) return '';
    hasResults = true;
    return renderTheme(t, items);
  }).join('');

  if (!hasResults) {
    content.innerHTML = '';
    emptyEl.style.display = 'flex';
  } else {
    emptyEl.style.display = 'none';
    content.innerHTML = html;
  }
}

/* ── Section thème ── */
function renderTheme(theme, items) {
  return `
    <section class="td-theme-section" id="theme-${esc(theme.slug)}">
      <div class="td-theme-header">
        <div class="td-theme-title-block">
          <div class="td-theme-icon" style="background:${esc(theme.bg)}">${theme.icon}</div>
          <div>
            <h2 class="td-theme-title">${esc(theme.label)}</h2>
            <p class="td-theme-sub">${items.length} ressource${items.length > 1 ? 's' : ''} disponible${items.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <span class="td-theme-count">${items.length} TD</span>
      </div>
      <div class="td-cards-grid">
        ${items.map(p => renderCard(p, theme)).join('')}
      </div>
    </section>`;
}

/* ── Carte ── */
function renderCard(p, theme) {
  const level   = LEVEL_MAP[p.study_level] || p.study_level || '';
  const isCorrige = p.title?.toLowerCase().includes('corrigé');
  const isEnonce  = p.title?.toLowerCase().includes('exercice') || p.title?.toLowerCase().includes('énoncé');
  const sizeMb    = p.file_size_mb ? `${p.file_size_mb} Mo` : '';
  const fileUrl   = p.file_url ? `http://localhost:5000${p.file_url}` : null;
  const productUrl = `product.html?slug=${encodeURIComponent(p.slug)}`;

  const badgeHtml = isCorrige
    ? `<span class="td-badge td-badge-corrige">✅ Corrigé</span>`
    : isEnonce
    ? `<span class="td-badge td-badge-enonce">📄 Énoncé</span>`
    : `<span class="td-badge td-badge-type">TD</span>`;

  return `
    <div class="td-card">
      <div class="td-card-stripe" style="background:${esc(theme.color)}"></div>
      <div class="td-card-body">
        <div class="td-card-top">
          <div class="td-card-badges">
            ${badgeHtml}
            ${level ? `<span class="td-badge td-badge-niveau">${esc(level)}</span>` : ''}
            <span class="td-badge td-badge-gratuit">Gratuit</span>
          </div>
        </div>
        <h3 class="td-card-title">${esc(p.title)}</h3>
        ${p.description ? `<p class="td-card-desc">${esc(p.description)}</p>` : ''}
      </div>
      <div class="td-card-footer">
        <div class="td-card-meta">
          ${sizeMb ? `<span><i class="fas fa-file-pdf"></i> ${esc(sizeMb)}</span>` : ''}
          <span><i class="fas fa-layer-group"></i> ${esc(theme.label)}</span>
        </div>
        <div class="td-card-actions">
          <a href="${esc(productUrl)}" class="td-btn td-btn-outline">
            <i class="fas fa-eye"></i> Voir
          </a>
          ${fileUrl ? `<a href="${esc(fileUrl)}" class="td-btn td-btn-primary" download>
            <i class="fas fa-download"></i> Télécharger
          </a>` : ''}
        </div>
      </div>
    </div>`;
}
