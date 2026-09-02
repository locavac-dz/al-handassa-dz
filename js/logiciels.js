/* =============================================
   AL HANDASSA.DZ — Page Logiciels
   ============================================= */

// API_BASE est déjà défini dans api.js : 'http://localhost:5000/api'

const LEVEL_MAP = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  tous: 'Tous niveaux',
};

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── État global ── */
let _allCategories = [];   // [{slug, title, icon, list:[...]}]
let _activeSlug    = '';   // filtre catégorie actif
let _searchQuery   = '';   // filtre recherche

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadAll();

  document.getElementById('search-input').addEventListener('input', e => {
    _searchQuery = e.target.value.trim().toLowerCase();
    render();
  });
});

/* ── Charger tous les produits type=logiciels ── */
async function loadAll() {
  try {
    // Récupérer tous les produits logiciels (sans limite)
    const res = await fetch(`${API_BASE}/products?type=logiciels&limit=100`);
    if (!res.ok) throw new Error('API error');
    const { data } = await res.json();

    // Pour chaque produit, charger le détail (pour avoir metadata)
    const details = await Promise.all(
      data.map(p =>
        fetch(`${API_BASE}/products/${p.slug}`)
          .then(r => r.json())
          .then(r => r.data)
          .catch(() => null)
      )
    );

    // Construire les catégories
    _allCategories = details
      .filter(p => p && Array.isArray(p.metadata?.software_list) && p.metadata.software_list.length)
      .map(p => ({
        slug:  p.slug,
        title: p.title,
        desc:  p.description,
        list:  p.metadata.software_list,
      }));

    // Compteurs hero
    const totalSw = _allCategories.reduce((acc, c) => acc + c.list.length, 0);
    document.getElementById('stat-total').textContent = totalSw;
    document.getElementById('stat-cats').textContent  = _allCategories.length;

    // Boutons filtres catégories
    buildFilters();

    // Afficher
    document.getElementById('log-skeleton').style.display = 'none';
    document.getElementById('log-content').style.display  = 'block';
    render();

  } catch (err) {
    console.error(err);
    document.getElementById('log-skeleton').style.display = 'none';
    document.getElementById('log-content').style.display  = 'block';
    document.getElementById('log-content').innerHTML =
      `<div class="log-empty" style="display:flex">
        <div class="log-empty-icon">⚠️</div>
        <h3>Erreur de chargement</h3>
        <p>Impossible de charger les logiciels. Vérifiez que le serveur est démarré.</p>
       </div>`;
  }
}

/* ── Construire les boutons filtres ── */
function buildFilters() {
  const wrap = document.getElementById('category-filters');
  // Garder le bouton "Tous"
  const allBtn = wrap.querySelector('[data-slug=""]');

  _allCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'log-filter-btn';
    btn.dataset.slug = cat.slug;
    // Extraire un titre court (avant "—")
    const shortTitle = cat.title.split('—')[0].trim().split(' — ')[0].trim();
    btn.innerHTML = shortTitle;
    btn.addEventListener('click', () => filterByCategory(cat.slug, btn));
    wrap.appendChild(btn);
  });

  allBtn.addEventListener('click', () => filterByCategory('', allBtn));
}

function filterByCategory(slug, btn) {
  _activeSlug = slug;
  document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

/* ── Rendu principal ── */
function render() {
  const content = document.getElementById('log-content');
  const emptyEl = document.getElementById('log-empty');

  // Filtrer catégories
  let cats = _allCategories;
  if (_activeSlug) {
    cats = cats.filter(c => c.slug === _activeSlug);
  }

  // Filtrer logiciels par recherche
  let hasResults = false;
  const html = cats.map(cat => {
    let list = cat.list;
    if (_searchQuery) {
      list = list.filter(sw =>
        sw.name?.toLowerCase().includes(_searchQuery) ||
        sw.description?.toLowerCase().includes(_searchQuery) ||
        sw.category?.toLowerCase().includes(_searchQuery) ||
        sw.features?.some(f => f.toLowerCase().includes(_searchQuery))
      );
    }
    if (!list.length) return '';
    hasResults = true;
    return renderCategory(cat, list);
  }).join('');

  if (!hasResults && (_searchQuery || _activeSlug)) {
    content.innerHTML = '';
    emptyEl.style.display = 'flex';
  } else {
    emptyEl.style.display = 'none';
    content.innerHTML = html;
  }
}

/* ── Rendu d'une catégorie ── */
function renderCategory(cat, list) {
  const shortTitle = cat.title.split(' — ')[0].trim();
  const subTitle   = cat.title.includes(' — ') ? cat.title.split(' — ').slice(1).join(' — ').trim() : '';

  return `
    <section class="log-category" id="cat-${esc(cat.slug)}">
      <div class="log-category-header">
        <div class="log-cat-title-block">
          <h2 class="log-cat-title">${esc(shortTitle)}</h2>
          ${subTitle ? `<span class="log-cat-subtitle">${esc(subTitle)}</span>` : ''}
        </div>
        <span class="log-cat-count">${list.length} logiciel${list.length > 1 ? 's' : ''}</span>
      </div>
      <div class="log-sw-grid">
        ${list.map(sw => renderCard(sw)).join('')}
      </div>
    </section>`;
}

/* ── Rendu d'une carte logiciel ── */
function renderCard(sw) {
  const level = LEVEL_MAP[sw.level] || sw.level || '';
  return `
    <div class="log-sw-card">
      <div class="log-sw-header">
        <span class="log-sw-icon">${esc(sw.icon || '💻')}</span>
        <div class="log-sw-title-block">
          <h3 class="log-sw-name">${esc(sw.name)}</h3>
          <span class="log-sw-cat">${esc(sw.category || '')}</span>
        </div>
        ${sw.badge ? `<span class="log-sw-badge" style="background:${esc(sw.badge_color || '#1B3A6B')}">${esc(sw.badge)}</span>` : ''}
      </div>

      <p class="log-sw-desc">${esc(sw.description || '')}</p>

      ${sw.features?.length ? `
      <ul class="log-sw-features">
        ${sw.features.map(f => `<li><i class="fas fa-check-circle"></i> ${esc(f)}</li>`).join('')}
      </ul>` : ''}

      <div class="log-sw-footer">
        <div class="log-sw-meta">
          ${sw.platforms?.length ? `<span class="log-sw-pill"><i class="fas fa-desktop"></i> ${sw.platforms.map(esc).join(' / ')}</span>` : ''}
          ${level ? `<span class="log-sw-pill"><i class="fas fa-graduation-cap"></i> ${esc(level)}</span>` : ''}
          ${sw.price_info ? `<span class="log-sw-pill log-sw-pill-price"><i class="fas fa-tag"></i> ${esc(sw.price_info)}</span>` : ''}
        </div>
        <div class="log-sw-links">
          ${sw.trial_url ? `<a class="log-sw-btn log-sw-btn-trial" href="${esc(sw.trial_url)}" target="_blank" rel="noopener"><i class="fas fa-play-circle"></i> ${esc(sw.trial_label || 'Essai gratuit')}</a>` : ''}
          ${sw.url ? `<a class="log-sw-btn log-sw-btn-site" href="${esc(sw.url)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> ${esc(sw.url_label || 'Site officiel')}</a>` : ''}
        </div>
      </div>
    </div>`;
}
