/* =============================================
   Al Handassa.dz — Page de lecture d'article
   ============================================= */

const CAT_ICON = {
  'beton-arme':'🏗️', structures:'📐', geotechnique:'🔬', hydraulique:'🌊',
  materiaux:'🧱', topographie:'📏', architecture:'🏛️', parasismique:'📋',
  'routes-vrd':'🛣️', logiciels:'💻', 'pfe-memoires':'🎓', 'developpement-durable':'🌱',
};
const LANG_LABEL = { fr:'Français', ar:'Arabe', fr_ar:'Français + Arabe', en:'Anglais' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase() || '?'; }

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-DZ', { day:'2-digit', month:'long', year:'numeric' });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, type = 'ok') {
  const el = document.getElementById('article-toast');
  el.textContent = msg;
  el.className = `article-toast toast-${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Rendu du contenu ──────────────────────────────────────────────────────────
// Convertit le texte brut (avec sauts de ligne) en paragraphes HTML simples
// Si le contenu contient déjà des balises HTML, il est injecté tel quel.
function renderContent(text) {
  if (!text) return '';
  // Si le texte contient des balises HTML on l'affiche directement
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  // Sinon : double saut de ligne = nouveau paragraphe
  return text
    .split(/\n{2,}/)
    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// ── Partage ───────────────────────────────────────────────────────────────────
function shareArticle(platform) {
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(document.getElementById('hero-title').textContent);
  if (platform === 'twitter') {
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
  } else if (platform === 'linkedin') {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  } else if (platform === 'copy') {
    navigator.clipboard.writeText(location.href)
      .then(() => toast('✅ Lien copié !'))
      .catch(() => toast('Impossible de copier le lien.', 'err'));
  }
}
window.shareArticle = shareArticle;

// ── Chargement des articles récents ──────────────────────────────────────────
async function loadRelated(currentSlug) {
  try {
    const res = await api.articles({ limit: 4 });
    const others = (res.data || []).filter(a => a.slug !== currentSlug).slice(0, 3);
    if (!others.length) return;
    const list = document.getElementById('related-list');
    list.innerHTML = others.map(a => {
      const icon = CAT_ICON[a.category_slug] || '📰';
      return `<div class="related-article">
        <div class="related-icon">${icon}</div>
        <div>
          <a href="article.html?slug=${encodeURIComponent(a.slug)}">${esc(a.title)}</a>
          <div class="related-meta">${fmtDate(a.published_at)}</div>
        </div>
      </div>`;
    }).join('');
    document.getElementById('sidebar-related').style.display = 'block';
  } catch {}
}

// ── Nav auth ─────────────────────────────────────────────────────────────────
function updateNav() {
  const user = Auth.getUser();
  const navAuth = document.getElementById('nav-auth-actions');
  if (!navAuth) return;
  if (user) {
    navAuth.innerHTML = `
      <a href="account.html" class="btn btn-outline btn-sm">👤 ${esc(user.first_name || 'Mon compte')}</a>
      <button class="btn btn-primary btn-sm" onclick="api.logout().then(()=>location.reload())">Déconnexion</button>`;
  }
}

// ── Principal ─────────────────────────────────────────────────────────────────
async function loadArticle() {
  const slug = new URLSearchParams(location.search).get('slug');

  if (!slug) {
    document.getElementById('article-skeleton').style.display = 'none';
    document.getElementById('article-error').style.display = 'block';
    return;
  }

  try {
    const res = await api.article(slug);
    const a = res.data;

    // ── Masquer skeleton, afficher page ──────────────────────────────────────
    document.getElementById('article-skeleton').style.display = 'none';
    document.getElementById('article-main').style.display = 'block';

    // ── SEO / Meta ────────────────────────────────────────────────────────────
    const pageTitle = `${a.title} — Al Handassa.dz`;
    const pageDesc  = (a.excerpt || a.title || '').slice(0, 160);
    const pageUrl   = `https://handassi.dz/article.html?slug=${a.slug}`;
    const ogImage   = a.thumbnail_url
      ? `https://handassi.dz${a.thumbnail_url}`
      : 'https://handassi.dz/img/og-cover.png';

    document.getElementById('page-title').textContent = pageTitle;
    document.getElementById('page-desc').setAttribute('content', pageDesc);
    document.getElementById('page-canonical')?.setAttribute('href', pageUrl);
    document.getElementById('og-url')?.setAttribute('content', pageUrl);
    document.getElementById('og-title').setAttribute('content', pageTitle);
    document.getElementById('og-desc').setAttribute('content', pageDesc);
    document.getElementById('og-image').setAttribute('content', ogImage);
    document.getElementById('tw-title')?.setAttribute('content', pageTitle);
    document.getElementById('tw-desc')?.setAttribute('content', pageDesc);
    document.getElementById('tw-image')?.setAttribute('content', ogImage);

    // ── JSON-LD Article ───────────────────────────────────────────────────────
    const existing = document.getElementById('json-ld-article');
    if (existing) existing.remove();
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: pageDesc,
      image: ogImage,
      url: pageUrl,
      datePublished: a.published_at || a.created_at,
      dateModified:  a.updated_at   || a.created_at,
      author: {
        '@type': 'Person',
        name: a.author_name || 'Al Handassa.dz'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Al Handassa.dz',
        logo: { '@type': 'ImageObject', url: 'https://handassi.dz/img/og-cover.png' }
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl }
    };
    const script = document.createElement('script');
    script.id = 'json-ld-article';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // ── Breadcrumb ────────────────────────────────────────────────────────────
    document.getElementById('bc-title').textContent = a.title;

    // ── Hero ──────────────────────────────────────────────────────────────────
    const catIcon = CAT_ICON[a.category_slug] || '📰';
    document.getElementById('hero-category').textContent = `${catIcon} ${a.category_name || 'Article'}`;
    document.getElementById('hero-title').textContent = a.title;

    const authorName = a.author_name || 'Al Handassa.dz';
    document.getElementById('hero-avatar').textContent = initials(authorName);
    document.getElementById('hero-author').textContent = authorName;

    document.getElementById('hero-date').textContent = fmtDate(a.published_at || a.created_at);
    document.getElementById('hero-views').textContent = `${(a.views_count || 0).toLocaleString('fr-DZ')} vues`;

    if (a.read_time_min) {
      document.getElementById('hero-readtime').textContent = `${a.read_time_min} min de lecture`;
      document.getElementById('hero-readtime-wrap').style.display = 'flex';
    }

    const badge = document.getElementById('hero-access-badge');
    if (a.is_free) {
      badge.textContent = '🆓 Gratuit';
      badge.className = 'article-free-badge';
    } else {
      badge.textContent = `💎 Premium · ${parseFloat(a.price || 0).toLocaleString('fr-DZ')} DZD`;
      badge.className = 'article-paid-badge';
    }

    // ── Thumbnail ─────────────────────────────────────────────────────────────
    if (a.thumbnail_url) {
      const imgEl = document.getElementById('article-thumb-img');
      imgEl.src = a.thumbnail_url.startsWith('http') ? a.thumbnail_url : `http://localhost:5000${a.thumbnail_url}`;
      imgEl.alt = a.title;
      document.getElementById('article-thumb-wrap').style.display = 'block';
    }

    // ── Résumé ────────────────────────────────────────────────────────────────
    const excerptEl = document.getElementById('article-excerpt');
    if (a.excerpt) {
      excerptEl.textContent = a.excerpt;
    } else {
      excerptEl.style.display = 'none';
    }

    // ── Contenu ───────────────────────────────────────────────────────────────
    const contentZone = document.getElementById('article-content-zone');
    if (a.content) {
      // Contenu complet disponible (gratuit ou abonné connecté)
      contentZone.innerHTML = `<div class="article-content">${renderContent(a.content)}</div>`;
    } else {
      // Aperçu + paywall
      const previewHtml = a.preview ? `
        <div class="article-preview-fade">
          <div class="article-content">${renderContent(a.preview)}</div>
        </div>` : '';
      const isLoggedIn = !!Auth.getToken();
      contentZone.innerHTML = `
        ${previewHtml}
        <div class="article-paywall">
          <div class="paywall-icon">🔒</div>
          <h3>Contenu réservé aux abonnés</h3>
          <p>Accédez à la totalité de cet article avec un abonnement Standard ou Pro.</p>
          <div class="paywall-btns">
            ${isLoggedIn
              ? `<a href="index.html#pricing" class="btn-white">Voir les abonnements</a>`
              : `<a href="index.html#register" class="btn-white">S'inscrire gratuitement</a>
                 <a href="index.html#login" class="btn-outline-white">Se connecter</a>`
            }
          </div>
        </div>`;
    }

    // ── Tags ──────────────────────────────────────────────────────────────────
    const tagsEl = document.getElementById('article-tags');
    if (a.tags && a.tags.length) {
      tagsEl.innerHTML = a.tags.map(t => `<span class="article-tag">#${esc(t)}</span>`).join('');
    }

    // ── DOI ───────────────────────────────────────────────────────────────────
    if (a.doi) {
      const doiLink = document.getElementById('article-doi-link');
      const doiUrl = a.doi.startsWith('http') ? a.doi : `https://doi.org/${a.doi}`;
      doiLink.href = doiUrl;
      doiLink.textContent = a.doi;
      document.getElementById('article-doi').style.display = 'block';
    }

    // ── Sidebar : auteur ──────────────────────────────────────────────────────
    if (a.author_name) {
      document.getElementById('sidebar-avatar').textContent = initials(a.author_name);
      document.getElementById('sidebar-author-name').textContent = a.author_name;
      if (a.institution) document.getElementById('sidebar-author-inst').textContent = a.institution;
      document.getElementById('sidebar-author').style.display = 'block';
    }

    // ── Sidebar : infos ───────────────────────────────────────────────────────
    document.getElementById('info-cat').textContent = a.category_name || '—';
    document.getElementById('info-lang').textContent = LANG_LABEL[a.language] || a.language || 'Français';
    document.getElementById('info-readtime').textContent = a.read_time_min ? `${a.read_time_min} min` : '—';
    document.getElementById('info-views').textContent = `${(a.views_count || 0).toLocaleString('fr-DZ')}`;
    document.getElementById('info-access').textContent = a.is_free ? 'Gratuit' : 'Abonnés';

    // ── Articles récents ──────────────────────────────────────────────────────
    loadRelated(slug);

  } catch (err) {
    document.getElementById('article-skeleton').style.display = 'none';
    document.getElementById('article-error').style.display = 'block';
    console.error('Article load error:', err.message);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  loadArticle();
});
