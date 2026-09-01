/* =============================================
   Al Handassa.dz — JavaScript Principal
   ============================================= */

// ── STATE ──
const state = {
  lang: localStorage.getItem('lang') || 'fr',
  cartItems: [],
  billingCycle: 'monthly',
  isRTL: (localStorage.getItem('lang') === 'ar'),
  user: null,
  purchasedIds: new Set(),   // IDs produits achetés (commandes payées)
  // filtres actifs pour chaque section
  productFilter: {},
  videoFilter:   {},
};

// ── TRANSLATIONS ──
const i18n = {
  fr: {
    // Navigation
    nav_catalog: 'Catalogue', nav_videos: 'Vidéos', nav_articles: 'Articles',
    nav_pricing: 'Tarifs', nav_about: 'À Propos', nav_contact: 'Contact',
    nav_payment: 'Paiement', nav_software: 'Logiciels', nav_companies: 'Entreprises',
    nav_dir_companies: 'Annuaire entreprises', nav_jobs: 'Recrutement',
    nav_tenders: "Appels d'offres", nav_pro_dir: 'Annuaire professionnel',
    // Auth
    btn_login: 'Connexion', btn_register: "S'inscrire",
    modal_title: 'Accéder à Al Handassa.dz',
    tab_login: 'Connexion', tab_register: 'Inscription',
    label_email: 'Email', label_password: 'Mot de passe',
    label_firstname: 'Prénom', label_lastname: 'Nom',
    label_phone: 'Téléphone (Algérie)', label_level: "Niveau d'études",
    label_password_new: 'Mot de passe (min. 8 caractères)',
    btn_signin: 'Se Connecter', btn_create: 'Créer mon Compte Gratuit',
    forgot_pwd: 'Mot de passe oublié ?',
    or_continue: 'ou continuer avec',
    // Hero
    hero_badge: '🇩🇿 Référence nationale génie civil',
    hero_title1: 'Tous les DTR, RPA', hero_title2: 'et cours de génie civil', hero_title3: 'conformes au programme algérien',
    hero_sub: "2 400 ressources vérifiées — normes, cours, vidéos et logiciels — accessibles aux étudiants et ingénieurs des 48 wilayas, du bac technique au mastère.",
    hcard1_title: 'DTR & RPA', hcard1_sub: 'Textes réglementaires algériens complets',
    hcard2_title: 'Cours & Polycopiés', hcard2_sub: 'Conformes au programme MESRS',
    hcard3_title: 'Logiciels & DAO', hcard3_sub: 'Formations aux outils professionnels',
    btn_explore: 'Explorer le Catalogue', btn_free: 'Essai Gratuit',
    stat_resources: 'Ressources', stat_students: 'Étudiants',
    stat_wilayas: 'Wilayas', stat_videos: 'Vidéos',
    // Cart
    add_cart: 'Ajouter', cart_title: 'Mon Panier', cart_empty: 'Votre panier est vide',
    cart_total: 'Total', checkout: 'Passer la commande', subscribe: "S'abonner",
    // Misc
    monthly: 'Mensuel', annual: 'Annuel', watch: 'Voir', read_more: 'Lire',
    close: 'Fermer', menu: 'Menu', search: 'Rechercher',
    // Sections
    section_catalog: 'CATALOGUE', section_catalog_h2: 'Ressources & Ouvrages Numériques',
    section_catalog_sub: 'Ouvrages numériques, cours PDF, résumés de cours, examens corrigés — tous conformes au programme algérien.',
    section_videos: 'VIDÉOTHÈQUE', section_videos_h2: 'Vidéos Pédagogiques',
    section_articles: 'SCIENTIFIQUE', section_articles_h2: 'Articles & Publications',
    section_pricing: 'TARIFS', section_pricing_h2: 'Choisissez Votre Plan',
    section_payment: 'PAIEMENT', section_payment_h2: 'Moyens de Paiement Algériens',
  },
  ar: {
    // Navigation
    nav_catalog: 'الكتالوج', nav_videos: 'الفيديوهات', nav_articles: 'المقالات',
    nav_pricing: 'الأسعار', nav_about: 'حول', nav_contact: 'اتصل بنا',
    nav_payment: 'الدفع', nav_software: 'البرامج', nav_companies: 'الشركات',
    nav_dir_companies: 'دليل الشركات', nav_jobs: 'التوظيف',
    nav_tenders: 'طلبات العروض', nav_pro_dir: 'الدليل المهني',
    // Auth
    btn_login: 'تسجيل الدخول', btn_register: 'إنشاء حساب',
    modal_title: 'الدخول إلى الهندسة.dz',
    tab_login: 'تسجيل الدخول', tab_register: 'إنشاء حساب',
    label_email: 'البريد الإلكتروني', label_password: 'كلمة المرور',
    label_firstname: 'الاسم الأول', label_lastname: 'اللقب',
    label_phone: 'الهاتف (الجزائر)', label_level: 'المستوى الدراسي',
    label_password_new: 'كلمة المرور (8 أحرف على الأقل)',
    btn_signin: 'تسجيل الدخول', btn_create: 'إنشاء حساب مجاني',
    forgot_pwd: 'نسيت كلمة المرور؟',
    or_continue: 'أو تابع عبر',
    // Hero
    hero_badge: '🇩🇿 المرجع الوطني للهندسة المدنية',
    hero_title1: 'جميع مراسيم DTR و RPA', hero_title2: 'ومقررات الهندسة المدنية', hero_title3: 'وفق البرنامج الجزائري',
    hero_sub: '2 400 مورد موثّق — معايير، دروس، فيديوهات وبرامج — متاحة لطلاب ومهندسي الجزائر من الـ48 ولاية.',
    hcard1_title: 'DTR & RPA', hcard1_sub: 'النصوص التنظيمية الجزائرية الكاملة',
    hcard2_title: 'الدروس والمحاضرات', hcard2_sub: 'وفق برنامج وزارة التعليم العالي',
    hcard3_title: 'البرامج والرسم التقني', hcard3_sub: 'تدريب على الأدوات المهنية',
    btn_explore: 'استكشف الكتالوج', btn_free: 'تجربة مجانية',
    stat_resources: 'مورد', stat_students: 'طالب',
    stat_wilayas: 'ولاية', stat_videos: 'فيديو',
    // Cart
    add_cart: 'إضافة', cart_title: 'سلة التسوق', cart_empty: 'السلة فارغة',
    cart_total: 'المجموع', checkout: 'إتمام الطلب', subscribe: 'اشترك',
    // Misc
    monthly: 'شهري', annual: 'سنوي', watch: 'مشاهدة', read_more: 'قراءة',
    close: 'إغلاق', menu: 'القائمة', search: 'بحث',
    // Sections
    section_catalog: 'الكتالوج', section_catalog_h2: 'الموارد والكتب الرقمية',
    section_catalog_sub: 'كتب رقمية، دروس PDF، ملخصات، امتحانات محلولة — متوافقة مع البرنامج الجزائري.',
    section_videos: 'مكتبة الفيديو', section_videos_h2: 'الفيديوهات التعليمية',
    section_articles: 'علمي', section_articles_h2: 'المقالات والمنشورات',
    section_pricing: 'الأسعار', section_pricing_h2: 'اختر خطتك',
    section_payment: 'الدفع', section_payment_h2: 'وسائل الدفع الجزائرية',
  },
  en: {
    // Navigation
    nav_catalog: 'Catalogue', nav_videos: 'Videos', nav_articles: 'Articles',
    nav_pricing: 'Pricing', nav_about: 'About', nav_contact: 'Contact',
    nav_payment: 'Payment', nav_software: 'Software', nav_companies: 'Companies',
    nav_dir_companies: 'Company Directory', nav_jobs: 'Recruitment',
    nav_tenders: 'Tenders', nav_pro_dir: 'Professional Directory',
    // Auth
    btn_login: 'Login', btn_register: 'Sign Up',
    modal_title: 'Access Al Handassa.dz',
    tab_login: 'Login', tab_register: 'Register',
    label_email: 'Email', label_password: 'Password',
    label_firstname: 'First Name', label_lastname: 'Last Name',
    label_phone: 'Phone (Algeria)', label_level: 'Education Level',
    label_password_new: 'Password (min. 8 characters)',
    btn_signin: 'Sign In', btn_create: 'Create Free Account',
    forgot_pwd: 'Forgot password?',
    or_continue: 'or continue with',
    // Hero
    hero_badge: '🇩🇿 Algeria\'s civil engineering reference',
    hero_title1: 'All DTR, RPA standards', hero_title2: 'and civil engineering courses', hero_title3: 'aligned with the Algerian curriculum',
    hero_sub: '2,400 verified resources — standards, courses, videos and software — for students and engineers across all 48 wilayas.',
    hcard1_title: 'DTR & RPA', hcard1_sub: 'Complete Algerian regulatory texts',
    hcard2_title: 'Courses & Lecture Notes', hcard2_sub: 'Aligned with MESRS curriculum',
    hcard3_title: 'Software & CAD', hcard3_sub: 'Training on professional tools',
    btn_explore: 'Explore Catalogue', btn_free: 'Free Trial',
    stat_resources: 'Resources', stat_students: 'Students',
    stat_wilayas: 'Wilayas', stat_videos: 'Videos',
    // Cart
    add_cart: 'Add', cart_title: 'My Cart', cart_empty: 'Your cart is empty',
    cart_total: 'Total', checkout: 'Checkout', subscribe: 'Subscribe',
    // Misc
    monthly: 'Monthly', annual: 'Annual', watch: 'Watch', read_more: 'Read',
    close: 'Close', menu: 'Menu', search: 'Search',
    // Sections
    section_catalog: 'CATALOGUE', section_catalog_h2: 'Resources & Digital Books',
    section_catalog_sub: 'Digital books, PDF courses, lecture notes, solved exams — all aligned with the Algerian curriculum.',
    section_videos: 'VIDEO LIBRARY', section_videos_h2: 'Educational Videos',
    section_articles: 'SCIENTIFIC', section_articles_h2: 'Articles & Publications',
    section_pricing: 'PRICING', section_pricing_h2: 'Choose Your Plan',
    section_payment: 'PAYMENT', section_payment_h2: 'Algerian Payment Methods',
  }
};

function t(key) { return i18n[state.lang][key] || key; }

// ── LANGUAGE SWITCH ─────────────────────────────────────────────────────────
const LANG_META = {
  fr: { flag: '🇫🇷', label: 'FR', dir: 'ltr', toast: '🌐 Langue : Français' },
  ar: { flag: '🇩🇿', label: 'AR', dir: 'rtl', toast: '🌐 اللغة : العربية' },
  en: { flag: '🇬🇧', label: 'EN', dir: 'ltr', toast: '🌐 Language: English' },
};

function setLanguage(lang) {
  if (!i18n[lang]) return;
  state.lang  = lang;
  state.isRTL = lang === 'ar';
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir  = LANG_META[lang].dir;
  document.body.classList.toggle('rtl', state.isRTL);
  // Mettre à jour le bouton affiché
  const flagEl  = document.getElementById('lang-flag');
  const labelEl = document.getElementById('lang-label');
  if (flagEl)  flagEl.textContent  = LANG_META[lang].flag;
  if (labelEl) labelEl.textContent = LANG_META[lang].label;
  // Marquer l'option active
  document.querySelectorAll('.lang-menu li').forEach(li => li.classList.remove('active'));
  document.querySelectorAll('.lang-menu li').forEach((li, i) => {
    if (['fr','ar','en'][i] === lang) li.classList.add('active');
  });
  // Fermer le dropdown
  document.getElementById('lang-dropdown')?.classList.remove('open');
  updateTranslations();
  if (typeof showToast === 'function') showToast(LANG_META[lang].toast, 'info');
}

// Rétrocompat — anciens boutons qui appelaient toggleLanguage()
function toggleLanguage() {
  const cycle = { fr: 'ar', ar: 'en', en: 'fr' };
  setLanguage(cycle[state.lang] || 'fr');
}

function updateTranslations() {
  const t = i18n[state.lang];
  // Textes — innerHTML pour les éléments qui contiennent des enfants (ex: h2 avec <span>)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] === undefined) return;
    if (el.children.length > 0) {
      // Remplacer seulement le premier nœud texte, garder les enfants
      const firstText = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
      if (firstText) firstText.textContent = t[key];
      else el.insertBefore(document.createTextNode(t[key]), el.firstChild);
    } else {
      el.textContent = t[key];
    }
  });
  // aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (t[key] !== undefined) el.setAttribute('aria-label', t[key]);
  });
  // og:locale pour le SEO dynamique
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.setAttribute('content', { fr:'fr_DZ', ar:'ar_DZ', en:'en_US' }[state.lang] || 'fr_DZ');
  // lang sur <html>
  document.documentElement.lang = state.lang;
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
const TYPE_ICON = { ouvrage:'📚', cours_pdf:'📄', exercices:'✏️', normes:'📋', logiciels:'💻', pack:'📦', sujet:'📝', document_word:'📝' };
const TYPE_LABEL = { ouvrage:'Ouvrage', cours_pdf:'Cours PDF', exercices:'Exercices', td_pdf:'TD PDF', tp_pdf:'TP PDF', tuto_pdf:'Tuto PDF', normes:'Normes DTR/RPA', logiciels:'Logiciels', pack:'Pack', sujet:"Sujet d'examen", document_word:'Document de Chantier' };
const LEVEL_LABEL = { debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', tous:'Tous niveaux' };
const LEVEL_CLASS = { debutant:'level-bg', intermediaire:'level-int', avance:'level-adv', tous:'level-bg' };
const CAT_ICON = { 'beton-arme':'🏗️', structures:'📐', geotechnique:'🔬', hydraulique:'🌊', materiaux:'🧱', topographie:'📏', architecture:'🏛️', parasismique:'📋', 'routes-vrd':'🛣️', logiciels:'💻', 'pfe-memoires':'🎓', 'developpement-durable':'🌱', 'gestion-projet':'📋', 'securite':'🦺' };

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function formatDuration(secs) {
  if (!secs) return '–';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// ── YouTube helpers ───────────────────────────────────────────────────────────
function ytId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?#]+)/);
  return m ? m[1] : null;
}

// ── Escape pour attributs onclick (JS string entre guillemets simples) ────────
// &#39; est décodé par le HTML avant l'exécution JS → casse les chaînes.
// On utilise \' qui reste intact et est valide en JS.
function escJs(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')   // \ → \\
    .replace(/'/g,  "\\'")    // ' → \'
    .replace(/\r?\n/g, ' ');  // newlines → espace
}

// ── Détection vidéo locale (/uploads/...) ─────────────────────────────────────
function isLocalVideo(url) {
  return url && (url.startsWith('/uploads/') || url.startsWith('http://localhost:5000/uploads/'));
}
function localVideoUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
  return url;
}

// ── PLAYLIST STATE ────────────────────────────────────────────────────────────
const _playlist = { items: [], current: 0, source: '' };

// Charger l'API YouTube IFrame une seule fois
(function() {
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
})();

let _ytPlayer = null;
let _ytReady  = false;
let _ytPendingId = null;

window.onYouTubeIframeAPIReady = function() {
  _ytReady = true;
  if (_ytPendingId) { _ytLoad(_ytPendingId); _ytPendingId = null; }
};

function _ytLoad(videoId, startSeconds) {
  if (!_ytReady) { _ytPendingId = videoId; _ytPendingStart = startSeconds || 0; return; }
  if (_ytPlayer) {
    if (startSeconds) {
      _ytPlayer.loadVideoById({ videoId, startSeconds });
    } else {
      _ytPlayer.loadVideoById(videoId);
    }
    return;
  }
  const playerVars = { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 };
  if (startSeconds) playerVars.start = startSeconds;
  _ytPlayer = new YT.Player('yt-player', {
    videoId,
    playerVars,
    events: {
      onStateChange(e) {
        if (e.data === YT.PlayerState.ENDED) playlistNext();
      }
    }
  });
}

function _buildPlaylistModal() {
  if (document.getElementById('yt-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'yt-modal';
  modal.className = 'yt-overlay';
  modal.innerHTML = `
  <div class="yt-dialog">
    <!-- Header -->
    <div class="yt-header">
      <div class="yt-header-left">
        <span class="yt-source-badge" id="yt-source-label"></span>
        <span class="yt-title" id="yt-modal-title"></span>
      </div>
      <div class="yt-header-right">
        <span class="yt-counter" id="yt-counter"></span>
        <button class="yt-close-btn" onclick="closeVideoModal()" title="Fermer">✕</button>
      </div>
    </div>
    <!-- Body -->
    <div class="yt-body">
      <!-- Lecteur -->
      <div class="yt-player-wrap">
        <div id="yt-player"></div>
      </div>
      <!-- Panneau droit : sommaire ou playlist -->
      <div class="yt-playlist-panel" id="yt-playlist-panel">
        <div class="yt-panel-header">
          <span id="yt-panel-label">📋 Playlist</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="yt-panel-count" id="yt-panel-count"></span>
            <a class="yt-source-link" id="yt-source-link" href="#" target="_blank" rel="noopener" style="display:none;">▶ Source</a>
          </div>
        </div>
        <div class="yt-panel-items" id="yt-panel-items"></div>
      </div>
    </div>
    <!-- Footer nav -->
    <div class="yt-footer">
      <button class="yt-nav-btn" id="yt-prev-btn" onclick="playlistPrev()">⏮ Précédent</button>
      <span class="yt-footer-info">▶ Vidéo externe — Al Handassa.dz</span>
      <button class="yt-nav-btn" id="yt-next-btn" onclick="playlistNext()">Suivant ⏭</button>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeVideoModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeVideoModal();
    if (e.key === 'ArrowRight') playlistNext();
    if (e.key === 'ArrowLeft')  playlistPrev();
  });
  document.body.appendChild(modal);
}

function _ytSeek(seconds) {
  if (_ytPlayer && _ytPlayer.seekTo) {
    _ytPlayer.seekTo(seconds, true);
    _ytPlayer.playVideo();
    // Highlight chapitre actif
    document.querySelectorAll('.yt-chapter-item').forEach(el => el.classList.remove('active'));
    event?.currentTarget?.classList?.add('active');
  }
}

function toggleVideoSommaire(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  // Mettre à jour le bouton toggle dans le header
  const header = el.closest('.video-sommaire-wrap')?.querySelector('.video-sommaire-toggle-btn');
  if (header) header.textContent = isOpen ? '▾' : '▴';
}

async function openVideoModal(id, title, source, startSeconds) {
  _buildPlaylistModal();

  // Charger la playlist de la même source si disponible
  if (source && source !== _playlist.source) {
    _playlist.source = source;
    _playlist.items  = [];
    try {
      const res = await api.videos({ source, limit: 100, page: 1 });
      if (res.data && res.data.length > 0) {
        _playlist.items = res.data.filter(v => v.is_free && ytId(v.video_url));
      }
    } catch(e) { /* silent */ }
  }

  // Si pas de playlist, créer une entrée unique
  if (!_playlist.items.length) {
    _playlist.items  = [{ video_url: `https://www.youtube.com/watch?v=${id}`, title, source, duration_seconds: 0, thumbnail_url: null }];
    _playlist.source = source || '';
  }

  // Trouver l'index de la vidéo cliquée
  const idx = _playlist.items.findIndex(v => ytId(v.video_url) === id);
  _playlist.current = idx >= 0 ? idx : 0;

  _renderPlaylistItems();
  _playlist._startSeconds = startSeconds || 0;
  _activateVideo(_playlist.current);

  const modal = document.getElementById('yt-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function _renderPlaylistItems() {
  const container = document.getElementById('yt-panel-items');
  const panelCount = document.getElementById('yt-panel-count');
  if (!container) return;
  panelCount.textContent = `${_playlist.items.length} vidéos`;
  container.innerHTML = _playlist.items.map((v, i) => {
    const vid  = ytId(v.video_url);
    const thumb = v.thumbnail_url || (vid ? `https://img.youtube.com/vi/${vid}/default.jpg` : '');
    const dur  = formatDuration(v.duration_seconds);
    return `
    <div class="yt-item" id="yt-item-${i}" onclick="playlistGoto(${i})">
      <div class="yt-item-num">${i + 1}</div>
      <div class="yt-item-thumb" style="background-image:url('${thumb}')">
        <div class="yt-item-play">▶</div>
      </div>
      <div class="yt-item-info">
        <div class="yt-item-title">${esc(v.title)}</div>
        <div class="yt-item-dur">${dur}</div>
      </div>
    </div>`;
  }).join('');
}

function _activateVideo(idx) {
  const v = _playlist.items[idx];
  if (!v) return;
  const vid = ytId(v.video_url);
  if (!vid) return;

  _playlist.current = idx;

  // Mettre à jour le header
  const titleEl   = document.getElementById('yt-modal-title');
  const counterEl = document.getElementById('yt-counter');
  const sourceEl  = document.getElementById('yt-source-label');
  const prevBtn   = document.getElementById('yt-prev-btn');
  const nextBtn   = document.getElementById('yt-next-btn');

  if (titleEl)   titleEl.textContent   = v.title;
  if (counterEl) counterEl.textContent = `${idx + 1} / ${_playlist.items.length}`;
  if (sourceEl)  sourceEl.textContent  = v.source || _playlist.source || '';
  if (prevBtn)   prevBtn.disabled = idx === 0;
  if (nextBtn)   nextBtn.disabled = idx === _playlist.items.length - 1;

  // Mettre à jour l'item actif dans la liste
  document.querySelectorAll('.yt-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.getElementById(`yt-item-${idx}`);
  if (activeItem) {
    activeItem.classList.add('active');
    activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Panneau droit : sommaire ou playlist
  const chapters = Array.isArray(v.chapters) ? v.chapters : [];
  const panelLabel   = document.getElementById('yt-panel-label');
  const panelCount   = document.getElementById('yt-panel-count');
  const panelItems   = document.getElementById('yt-panel-items');
  const sourceLink   = document.getElementById('yt-source-link');

  if (chapters.length > 0) {
    // Mode sommaire
    if (panelLabel) panelLabel.textContent = '📋 Sommaire';
    if (panelCount) panelCount.textContent = `${chapters.length} étapes`;
    if (sourceLink) { sourceLink.style.display = 'inline-flex'; sourceLink.href = `https://www.youtube.com/watch?v=${vid}`; }
    if (panelItems) {
      panelItems.innerHTML = chapters.map((ch, i) => `
        <div class="yt-chapter-item" onclick="_ytSeek(${ch.seconds})">
          <span class="yt-ch-num">${i + 1}</span>
          <span class="yt-ch-title">${ch.title}</span>
          <span class="yt-ch-time">${ch.time}</span>
        </div>`).join('');
    }
  } else {
    // Mode playlist normal
    if (panelLabel) panelLabel.textContent = '📋 Playlist';
    if (sourceLink) sourceLink.style.display = 'none';
    _renderPlaylistItems();
  }

  // Charger la vidéo (avec timestamp si fourni)
  _ytLoad(vid, _playlist._startSeconds || 0);
  _playlist._startSeconds = 0;
}

function playlistGoto(idx) {
  const v = _playlist.items[idx];
  if (!v) return;
  // Vidéo locale ou YouTube ?
  if (isLocalVideo(v.video_url)) {
    _activateLocalVideo(idx);
  } else {
    _activateVideo(idx);
  }
}

function playlistNext() {
  if (_playlist.current < _playlist.items.length - 1)
    playlistGoto(_playlist.current + 1);
}

function playlistPrev() {
  if (_playlist.current > 0)
    playlistGoto(_playlist.current - 1);
}

function closeVideoModal() {
  const modal = document.getElementById('yt-modal');
  if (!modal) return;
  modal.style.display = 'none';
  if (_ytPlayer) { try { _ytPlayer.pauseVideo(); } catch(e){} }
  document.body.style.overflow = '';
}

// ── Lecteur vidéo locale (MP4) — utilise le même modal playlist ───────────────
async function openLocalVideo(url, title, source) {
  _buildPlaylistModal();

  // Récupérer la playlist de la même source
  if (source && source !== _playlist.source) {
    _playlist.source = source;
    _playlist.items  = [];
    try {
      const res = await api.videos({ source, limit: 100, page: 1 });
      if (res.data && res.data.length > 0) {
        _playlist.items = res.data.filter(v => v.is_free && (isLocalVideo(v.video_url) || ytId(v.video_url)));
      }
    } catch(e) {}
  }

  if (!_playlist.items.length) {
    _playlist.items  = [{ video_url: url, title, source, duration_seconds: 0, thumbnail_url: null }];
    _playlist.source = source || '';
  }

  // Trouver l'index de la vidéo cliquée
  const idx = _playlist.items.findIndex(v => localVideoUrl(v.video_url) === url || v.video_url === url);
  _playlist.current = idx >= 0 ? idx : 0;

  // Remplacer le player zone par un <video> HTML5
  const playerWrap = document.getElementById('yt-player')?.parentElement;
  if (playerWrap && !document.getElementById('local-html5-player')) {
    // Détruire le player YouTube si existant
    _ytPlayer = null;
    playerWrap.innerHTML = `<video id="local-html5-player" controls
      style="width:100%;height:100%;min-height:300px;display:block;background:#000;"
      controlsList="nodownload">
      <source id="local-html5-src" src="" type="video/mp4">
    </video>`;
    // Auto-avance à la fin
    document.getElementById('local-html5-player').addEventListener('ended', playlistNext);
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') playlistNext();
      if (e.key === 'ArrowLeft')  playlistPrev();
    });
  }

  _renderPlaylistItems();
  _activateLocalVideo(_playlist.current);

  const modal = document.getElementById('yt-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function _activateLocalVideo(idx) {
  const v = _playlist.items[idx];
  if (!v) return;
  _playlist.current = idx;

  const titleEl   = document.getElementById('yt-modal-title');
  const counterEl = document.getElementById('yt-counter');
  const sourceEl  = document.getElementById('yt-source-label');
  const prevBtn   = document.getElementById('yt-prev-btn');
  const nextBtn   = document.getElementById('yt-next-btn');

  if (titleEl)   titleEl.textContent   = v.title;
  if (counterEl) counterEl.textContent = `${idx + 1} / ${_playlist.items.length}`;
  if (sourceEl)  sourceEl.textContent  = v.source || _playlist.source || '';
  if (prevBtn)   prevBtn.disabled = idx === 0;
  if (nextBtn)   nextBtn.disabled = idx === _playlist.items.length - 1;

  // Item actif dans la liste
  document.querySelectorAll('.yt-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.getElementById(`yt-item-${idx}`);
  if (activeItem) {
    activeItem.classList.add('active');
    activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Charger la vidéo dans le player HTML5
  const videoUrl = isLocalVideo(v.video_url) ? localVideoUrl(v.video_url) : v.video_url;
  const player = document.getElementById('local-html5-player');
  const src    = document.getElementById('local-html5-src');
  if (player && src) {
    src.src = videoUrl;
    player.load();
    player.play().catch(() => {});
  }
}

// ── PDF VIEWER MODAL ──────────────────────────────────────────────────────────
const _pdfState = { items: [], current: 0, collection: '' };

function _buildPdfModal() {
  if (document.getElementById('pdf-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'pdf-modal';
  modal.className = 'pdf-overlay';
  modal.innerHTML = `
  <div class="pdf-dialog">
    <!-- Header -->
    <div class="pdf-header">
      <div class="pdf-header-left">
        <span class="pdf-type-badge">📄 PDF</span>
        <span class="pdf-title" id="pdf-modal-title"></span>
      </div>
      <div class="pdf-header-right">
        <span class="pdf-counter" id="pdf-counter"></span>
        <a id="pdf-download-btn" href="#" download class="pdf-dl-btn" title="Télécharger">⬇️</a>
        <button class="pdf-close-btn" onclick="closePdfModal()" title="Fermer">✕</button>
      </div>
    </div>
    <!-- Body -->
    <div class="pdf-body">
      <!-- Visionneuse -->
      <div class="pdf-viewer-wrap">
        <iframe id="pdf-iframe" src="" type="application/pdf" style="width:100%;height:100%;border:none;display:block;background:#fff;"></iframe>
        <div class="pdf-loading" id="pdf-loading">
          <div class="pdf-spinner"></div>
          <p>Chargement du document...</p>
        </div>
      </div>
      <!-- Sidebar -->
      <div class="pdf-sidebar" id="pdf-sidebar">
        <div class="pdf-sidebar-header">
          <span>📚 Collection</span>
          <span class="pdf-panel-count" id="pdf-panel-count"></span>
        </div>
        <div class="pdf-sidebar-items" id="pdf-sidebar-items"></div>
      </div>
    </div>
    <!-- Footer -->
    <div class="pdf-footer">
      <button class="pdf-nav-btn" id="pdf-prev-btn" onclick="pdfPrev()">⏮ Précédent</button>
      <span class="pdf-footer-info" id="pdf-collection-label"></span>
      <button class="pdf-nav-btn" id="pdf-next-btn" onclick="pdfNext()">Suivant ⏭</button>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closePdfModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePdfModal();
    if (e.key === 'ArrowRight') pdfNext();
    if (e.key === 'ArrowLeft')  pdfPrev();
  });
  document.body.appendChild(modal);
}

// ── HTML VIEWER MODAL (pour logiciels avec preview HTML) ──────────────────────
function openHtmlModal(url, title) {
  // Créer le modal s'il n'existe pas
  if (!document.getElementById('html-viewer-modal')) {
    const m = document.createElement('div');
    m.id = 'html-viewer-modal';
    m.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);' +
      'display:none;align-items:center;justify-content:center;';
    m.innerHTML = `
      <div style="width:92vw;height:90vh;background:#fff;border-radius:12px;
                  display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5);">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    padding:12px 18px;background:#1B3A6B;color:#fff;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.1rem;">💻</span>
            <span id="html-modal-title" style="font-weight:700;font-size:.95rem;"></span>
          </div>
          <div style="display:flex;gap:10px;align-items:center;">
            <a id="html-modal-newwin" href="#" target="_blank"
               style="color:#fff;font-size:.78rem;text-decoration:none;
                      border:1px solid rgba(255,255,255,.4);padding:4px 10px;border-radius:6px;">
              ↗ Ouvrir dans un onglet
            </a>
            <button onclick="document.getElementById('html-viewer-modal').style.display='none';document.body.style.overflow='';"
                    style="background:rgba(255,255,255,.15);border:none;color:#fff;
                           font-size:1.2rem;cursor:pointer;padding:2px 8px;border-radius:6px;">✕</button>
          </div>
        </div>
        <iframe id="html-modal-iframe" src="" style="flex:1;border:none;width:100%;background:#fff;"></iframe>
      </div>`;
    m.addEventListener('click', e => {
      if (e.target === m) { m.style.display = 'none'; document.body.style.overflow = ''; }
    });
    document.body.appendChild(m);
  }
  const modal = document.getElementById('html-viewer-modal');
  document.getElementById('html-modal-title').textContent = title;
  document.getElementById('html-modal-newwin').href = url;
  document.getElementById('html-modal-iframe').src = url;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

async function openPdfModal(url, title, collection, productType) {
  _buildPdfModal();

  // Charger la collection si disponible
  const collKey = (collection||'') + '|' + (productType||'');
  if (collection && collKey !== _pdfState.collection) {
    _pdfState.collection = collKey;
    _pdfState.items = [];
    try {
      const params = { tag: collection, limit: 100 };
      if (productType) params.type = productType;
      const res = await api.products(params);
      if (res.data && res.data.length > 0) {
        _pdfState.items = res.data.filter(p =>
          (p.preview_url && p.preview_url.startsWith('/uploads/')) ||
          (p.is_free && p.file_url && p.file_url.startsWith('/uploads/'))
        );
      }
    } catch(e) {}
  }

  // Fallback : entrée unique
  if (!_pdfState.items.length) {
    _pdfState.items = [{ title, preview_url: url.replace('http://localhost:5000',''), tags: [] }];
    _pdfState.collection = '';
  }

  const idx = _pdfState.items.findIndex(p =>
    (p.preview_url && `http://localhost:5000${p.preview_url}` === url) ||
    (p.file_url && `http://localhost:5000${p.file_url}` === url)
  );
  _pdfState.current = idx >= 0 ? idx : 0;

  _renderPdfSidebar();
  _activatePdf(_pdfState.current, url, title);

  const pModal = document.getElementById('pdf-modal');
  if (pModal) { pModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function _renderPdfSidebar() {
  const container = document.getElementById('pdf-sidebar-items');
  const count = document.getElementById('pdf-panel-count');
  if (!container) return;
  count.textContent = `${_pdfState.items.length} docs`;
  container.innerHTML = _pdfState.items.map((p, i) => {
    const fname = (p.file_url || '').split('/').pop().replace(/^cd5-|^labo-/,'').replace('.pdf','').replace(/_/g,' ');
    return `
    <div class="pdf-item ${i === _pdfState.current ? 'active' : ''}" id="pdf-item-${i}" onclick="pdfGoto(${i})">
      <div class="pdf-item-num">${i + 1}</div>
      <div class="pdf-item-icon">📄</div>
      <div class="pdf-item-info">
        <div class="pdf-item-title">${esc(p.title || fname)}</div>
        <div class="pdf-item-size">${p.pages_count ? p.pages_count + ' pages' : 'PDF'}</div>
      </div>
    </div>`;
  }).join('');
}

function _activatePdf(idx, urlOverride, titleOverride) {
  const p = _pdfState.items[idx];
  if (!p && !urlOverride) return;
  _pdfState.current = idx;

  // Utiliser preview_url pour les payants, file_url pour les gratuits
  const bestUrl = p ? (p.preview_url ? `http://localhost:5000${p.preview_url}` : `http://localhost:5000${p.file_url}`) : null;
  const pdfUrl = urlOverride || bestUrl;
  const pdfTitle = titleOverride || p.title || 'Document';

  document.getElementById('pdf-modal-title').textContent = pdfTitle;
  document.getElementById('pdf-counter').textContent = `${idx + 1} / ${_pdfState.items.length}`;
  document.getElementById('pdf-collection-label').textContent = _pdfState.collection || '📄 Al Handassa.dz';
  document.getElementById('pdf-prev-btn').disabled = idx === 0;
  document.getElementById('pdf-next-btn').disabled = idx === _pdfState.items.length - 1;

  const dlBtn = document.getElementById('pdf-download-btn');
  if (dlBtn) { dlBtn.href = pdfUrl; dlBtn.download = pdfTitle + '.pdf'; }

  // Active item sidebar
  document.querySelectorAll('.pdf-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.getElementById(`pdf-item-${idx}`);
  if (activeItem) {
    activeItem.classList.add('active');
    activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Charger le PDF
  const iframe = document.getElementById('pdf-iframe');
  const loading = document.getElementById('pdf-loading');
  if (loading) loading.style.display = 'flex';
  if (iframe) {
    iframe.onload = () => { if (loading) loading.style.display = 'none'; };
    iframe.src = pdfUrl;
  }
}

function pdfGoto(idx) {
  _activatePdf(idx);
}
function pdfNext() { if (_pdfState.current < _pdfState.items.length - 1) pdfGoto(_pdfState.current + 1); }
function pdfPrev() { if (_pdfState.current > 0) pdfGoto(_pdfState.current - 1); }

function closePdfModal() {
  const modal = document.getElementById('pdf-modal');
  if (!modal) return;
  modal.classList.remove('active');
  const iframe = document.getElementById('pdf-iframe');
  if (iframe) iframe.src = '';
  document.body.style.overflow = '';
}

function downloadPdf(url, title) {
  const a = document.createElement('a');
  a.href = url; a.download = title + '.pdf';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
}

// ── WORD DOC MODAL ────────────────────────────────────────────────────────────
const _wordState = { items: [], current: 0, sections: {} };

async function openWordDocModal(previewUrl, title, productId, catSlug) {
  _buildWordModal();

  // Définir les sections selon la catégorie
  const isAffiche = catSlug === 'securite';
  const SECTIONS_CHANTIER = [
    '1. Autorisation & Documents administratifs',
    '2. Organisation et sécurité de chantier',
    '3. Suivi et contrôle en cours des travaux',
    '4. Gestion des sous-traitants & matériaux',
    '5. Réception & remise des documents',
    '6. Documents RH & Formation',
  ];
  const SECTIONS_AFFICHES = ['Affichage de securite'];
  const SECTIONS = isAffiche ? SECTIONS_AFFICHES : SECTIONS_CHANTIER;

  // Mettre à jour le label de collection dans le header
  const collLabel = document.querySelector('#word-doc-modal .word-collection-label');
  if (collLabel) collLabel.textContent = isAffiche ? '🦺 Affiches de Chantier — Algérie' : '📋 Documents de Chantier — Algérie';

  // Charger les documents du même groupe
  const apiParams = { type: 'document_word', limit: 100 };
  if (catSlug) apiParams.category = catSlug;
  try {
    const res = await api.products(apiParams);
    if (res.data && res.data.length > 0) {
      _wordState.items = res.data;
    }
  } catch(e) {
    _wordState.items = [{ id: productId, title, preview_url: previewUrl.replace('http://localhost:5000',''), tags: [] }];
  }
  if (!_wordState.items.length) {
    _wordState.items = [{ id: productId, title, preview_url: previewUrl.replace('http://localhost:5000',''), tags: [] }];
  }

  // Grouper par section
  _wordState.sections = {};
  for (const s of SECTIONS) _wordState.sections[s] = [];
  for (const doc of _wordState.items) {
    let sec;
    if (isAffiche) {
      sec = (doc.tags || []).find(t => t === 'Affichage de securite') || 'Affichage de securite';
    } else {
      sec = (doc.tags || []).find(t => t.startsWith('1.') || t.startsWith('2.') || t.startsWith('3.') || t.startsWith('4.') || t.startsWith('5.') || t.startsWith('6.'));
    }
    const key = sec || 'Autres';
    if (!_wordState.sections[key]) _wordState.sections[key] = [];
    _wordState.sections[key].push(doc);
  }

  const idx = _wordState.items.findIndex(d => d.id === productId || (d.preview_url && `http://localhost:5000${d.preview_url}` === previewUrl));
  _wordState.current = idx >= 0 ? idx : 0;

  _renderWordSommaire();
  _activateWordDoc(_wordState.current, previewUrl, title);
  const wModal = document.getElementById('word-doc-modal');
  if (wModal) { wModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function _buildWordModal() {
  if (document.getElementById('word-doc-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'word-doc-modal';
  modal.className = 'word-overlay';
  modal.innerHTML = `
<div class="word-dialog">
  <div class="word-header">
    <div class="word-header-left">
      <span class="word-icon">📝</span>
      <div>
        <div class="word-collection-label">📋 Documents de Chantier — Algérie</div>
        <div id="word-modal-title" class="word-title-label">Document</div>
      </div>
    </div>
    <div class="word-header-right">
      <span id="word-counter" class="word-counter">1 / 1</span>
      <button id="word-buy-btn" class="word-buy-btn" onclick="_wordBuy()">⬇️ Télécharger (.docx)</button>
      <button class="word-close-btn" onclick="closeWordModal()" title="Fermer">✕</button>
    </div>
  </div>
  <div class="word-body">
    <div class="word-sommaire" id="word-sommaire">
      <div class="word-sommaire-header">📋 Sommaire</div>
      <div id="word-sommaire-items" class="word-sommaire-items"></div>
    </div>
    <div class="word-viewer-wrap">
      <div class="word-watermark-banner">
        🔒 Aperçu avec filigrane — <strong>Téléchargement en format .docx disponible après achat</strong>
      </div>
      <div id="word-loading" class="word-loading" style="display:none">
        <div class="word-spinner"></div><span>Chargement...</span>
      </div>
      <iframe id="word-iframe" class="word-iframe" src="" frameborder="0" allowfullscreen></iframe>
    </div>
  </div>
  <div class="word-footer">
    <button class="word-nav-btn" id="word-prev-btn" onclick="wordPrev()">◀ Précédent</button>
    <div class="word-footer-info">
      <span id="word-doc-info" class="word-doc-info">Document de chantier</span>
    </div>
    <button class="word-nav-btn" id="word-next-btn" onclick="wordNext()">Suivant ▶</button>
  </div>
</div>`;
  document.body.appendChild(modal);
}

function _renderWordSommaire() {
  const container = document.getElementById('word-sommaire-items');
  if (!container) return;
  let html = '';
  for (const [section, docs] of Object.entries(_wordState.sections)) {
    if (!docs.length) continue;
    html += `<div class="word-section-header">${section}</div>`;
    for (const doc of docs) {
      const globalIdx = _wordState.items.indexOf(doc);
      const isActive = globalIdx === _wordState.current;
      const price = doc.price > 0 ? `<span class="word-item-price">${parseInt(doc.price).toLocaleString('fr-DZ')} DA</span>` : '';
      html += `
      <div class="word-item ${isActive ? 'active' : ''}" id="word-item-${globalIdx}" onclick="wordGoto(${globalIdx})">
        <div class="word-item-icon">📝</div>
        <div class="word-item-info">
          <div class="word-item-title">${esc(doc.title)}</div>
          ${price}
        </div>
        <div class="word-item-lock">🔒</div>
      </div>`;
    }
  }
  container.innerHTML = html;
}

function _activateWordDoc(idx, urlOverride, titleOverride) {
  const doc = _wordState.items[idx];
  if (!doc && !urlOverride) return;
  _wordState.current = idx;

  const previewUrl = urlOverride || (doc.preview_url ? `http://localhost:5000${doc.preview_url}` : '');
  const docTitle = titleOverride || doc?.title || 'Document';
  const docPrice = doc?.price || 0;

  document.getElementById('word-modal-title').textContent = docTitle;
  document.getElementById('word-counter').textContent = `${idx + 1} / ${_wordState.items.length}`;
  document.getElementById('word-prev-btn').disabled = idx === 0;
  document.getElementById('word-next-btn').disabled = idx === _wordState.items.length - 1;
  document.getElementById('word-doc-info').textContent = docPrice > 0
    ? `💰 ${parseInt(docPrice).toLocaleString('fr-DZ')} DA — Format Word (.docx)`
    : '📄 Document de chantier';

  const buyBtn = document.getElementById('word-buy-btn');
  if (buyBtn) {
    buyBtn.dataset.id = doc?.id || '';
    buyBtn.dataset.title = docTitle;
    buyBtn.dataset.price = docPrice;
  }

  // Mise à jour sidebar
  document.querySelectorAll('.word-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.getElementById(`word-item-${idx}`);
  if (activeItem) { activeItem.classList.add('active'); activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

  // Charger PDF filigrané
  const iframe = document.getElementById('word-iframe');
  const loading = document.getElementById('word-loading');
  if (loading) loading.style.display = 'flex';
  if (iframe) {
    iframe.onload = () => { if (loading) loading.style.display = 'none'; };
    iframe.src = previewUrl;
  }
}

function _wordBuy() {
  const btn = document.getElementById('word-buy-btn');
  if (!btn) return;
  const doc = _wordState.items[_wordState.current];
  if (!doc) return;
  const cartItem = { id: doc.id, title: doc.title, icon: '📝', type: 'Document de Chantier', price: parseFloat(doc.price) || 0, item_type: 'product' };
  addToCart(cartItem);
  closeWordModal();
}

function wordGoto(idx) { _activateWordDoc(idx); }
function wordNext() { if (_wordState.current < _wordState.items.length - 1) wordGoto(_wordState.current + 1); }
function wordPrev() { if (_wordState.current > 0) wordGoto(_wordState.current - 1); }

function closeWordModal() {
  const modal = document.getElementById('word-doc-modal');
  if (!modal) return;
  modal.classList.remove('active');
  const iframe = document.getElementById('word-iframe');
  if (iframe) iframe.src = '';
  document.body.style.overflow = '';
}

function formatPrice(p, is_free) {
  if (is_free || parseFloat(p) === 0) return '<span class="video-price-free">🆓 Gratuit</span>';
  return `<span class="video-price-paid">💎 ${parseInt(p).toLocaleString('fr-DZ')} DZD</span>`;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');
}

// ── SKELETON ─────────────────────────────────────────────────────────────────
function skeletonCards(n, cls) {
  return Array.from({length: n}, () => `<div class="${cls} skeleton-card"><div class="skeleton-thumb"></div><div class="skeleton-body"><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div></div></div>`).join('');
}

// ── PRODUCT CARD ─────────────────────────────────────────────────────────────
function productCard(p) {
  const icon = CAT_ICON[p.category_slug] || TYPE_ICON[p.type] || '📦';
  const typeLabel = TYPE_LABEL[p.type] || p.type;
  const effPrice = parseFloat(p.effective_price ?? p.price);
  const oldPrice = p.discount_price && parseFloat(p.discount_price) !== effPrice
    ? `<div class="price-old">${parseInt(p.price).toLocaleString('fr-DZ')} DZD</div>` : '';
  const priceHtml = p.is_free
    ? `<div class="price-free">🆓 Gratuit</div>`
    : `<div class="price-current"><span class="currency">DZD</span> ${parseInt(effPrice).toLocaleString('fr-DZ')}</div>${oldPrice}`;

  const badge = p.is_featured ? `<span class="badge badge-red">🔥 Bestseller</span>` :
                p.is_free     ? `<span class="badge badge-green">✅ Gratuit</span>` : '';

  const stars = p.rating_avg
    ? '★'.repeat(Math.round(p.rating_avg)) + '☆'.repeat(5 - Math.round(p.rating_avg))
    : '★★★★★';
  const ratingCount = p.rating_count > 0 ? `${p.rating_avg} (${p.rating_count} avis)` : 'Nouveau';

  const isWordDoc = p.type === 'document_word';
  // Pour les documents Word : prévisualisation via preview_url (PDF filigrané)
  const wordPreviewUrl = isWordDoc && p.preview_url ? `http://localhost:5000${p.preview_url}` : null;
  // Pour les ouvrages avec aperçu PDF filigrané (payants OU gratuits avec preview séparé)
  const hasPdfPreview = !isWordDoc && p.preview_url && p.preview_url.endsWith('.pdf');
  const pdfPreviewUrl = hasPdfPreview ? `http://localhost:5000${p.preview_url}` : null;
  // PDF libre lisible directement (gratuit, pas de preview séparé, fichier local)
  const isLocalPdf = !isWordDoc && !hasPdfPreview && p.is_free && p.file_url && p.file_url.startsWith('/uploads/');
  const pdfUrl = isLocalPdf ? `http://localhost:5000${p.file_url}` : null;
  // Téléchargement gratuit (fichier local, qu'il y ait un preview ou non)
  const isFreeDownload = p.is_free && p.file_url && p.file_url.startsWith('/uploads/');
  const dlUrl = isFreeDownload ? `http://localhost:5000${p.file_url}` : null;
  // Pour les logiciels/ressources HTML : consultation libre via preview_url
  const isHtmlPreview = p.type === 'logiciels' && p.preview_url && p.preview_url.endsWith('.html');
  const htmlConsultUrl = isHtmlPreview ? `http://localhost:5000${p.preview_url}` : null;
  // Titre safe pour onclick (échappe guillemets ET apostrophes)
  const safeTitle = esc(p.title).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const isPurchased = !p.is_free && state.purchasedIds.has(String(p.id));
  const btnLabel = isPurchased ? '⬇️ Mon téléchargement' : p.is_free ? '⬇️ Télécharger' : '🛒 Acheter';
  const cartItem = JSON.stringify({id: p.id, title: p.title, icon, type: typeLabel, price: effPrice, item_type: 'product'}).replace(/"/g, '&quot;');

  const _mediaBase = API_BASE.replace(/\/api$/, '');
  // Pas de miniature pour les sujets d'examen ni les affiches de chantier
  const _noThumbTypes = ['sujet', 'document_word'];
  const _noThumbCategories = ['securite'];
  const _noThumbTags = ['Planification'];
  const hasThumb = !_noThumbTypes.includes(p.type)
    && !_noThumbCategories.includes(p.category_slug)
    && !_noThumbTags.some(t => (p.tags || []).includes(t))
    && !!p.thumbnail_url;
  const thumbImg = hasThumb
    ? `<img src="${_mediaBase}${esc(p.thumbnail_url)}" alt="${esc(p.title)}" loading="lazy"
         style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;z-index:1;border-radius:12px 12px 0 0;"
         onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='')">`
    : '';
  // Icône affichée si pas de thumb OU si l'image échoue à charger
  const thumbIcon = `<span class="product-thumb-icon" style="${hasThumb ? 'display:none' : ''}">${icon}</span>`;

  return `
<a href="product?slug=${p.slug}" class="product-card-link">
<div class="product-card" data-category="${p.type}" data-level="${p.study_level}" data-id="${p.id}">
  <div class="product-thumb">
    ${thumbImg}${thumbIcon}
    <div class="product-badges">${badge}</div>
    <button class="product-wishlist" onclick="event.preventDefault();event.stopPropagation();handleWishlist(this,'${p.id}','product','${p.title.replace(/'/g,"\\'")}')" title="Favoris">🤍</button>
    <div class="product-type-icon">${TYPE_ICON[p.type] || '📦'}</div>
  </div>
  <div class="product-body">
    <div class="product-category">${typeLabel} • ${p.category_name || 'Génie Civil'}</div>
    <div class="product-title">${p.title}</div>
    <div class="product-author">
      <div class="avatar">${initials(p.instructor_name)}</div>
      ${p.instructor_name || 'Al Handassa.dz'}
    </div>
    <div class="product-rating">
      <span class="stars">${stars}</span>
      <span class="rating-count">${ratingCount}</span>
    </div>
  </div>
  <div class="product-footer">
    <div class="price-block">${priceHtml}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">

      <!-- Bouton Avis (toujours visible) -->
      <button class="pdf-read-btn" style="font-size:.75rem;padding:5px 10px;"
        onclick='event.preventDefault();event.stopPropagation();openReviewModal("${p.id}","${safeTitle}")'
        title="Voir et laisser un avis">⭐ Avis</button>

      <!-- Bouton Lire (toujours visible — ouvre le PDF ou aperçu disponible) -->
      <button class="pdf-read-btn" style="font-size:.75rem;padding:5px 10px;"
        onclick='event.preventDefault();event.stopPropagation();${
          isWordDoc && wordPreviewUrl
            ? `openWordDocModal("${wordPreviewUrl}","${safeTitle}","${p.id}","${p.category_slug||''}")`
            : isHtmlPreview
            ? `openHtmlModal("${htmlConsultUrl}","${safeTitle}")`
            : hasPdfPreview
            ? `openPdfModal("${pdfPreviewUrl}","${safeTitle}","${esc((p.tags&&p.tags[0])||p.category_name||'').replace(/"/g,"&quot;").replace(/'/g,"&#39;")}","${p.type||''}")`
            : isLocalPdf
            ? `openPdfModal("${pdfUrl}","${safeTitle}","${esc(p.tags?.[0]||p.category_name||'').replace(/"/g,"&quot;").replace(/'/g,"&#39;")}","${p.type||''}")`
            : `window.location.href="product?slug=${p.slug}"`
        }'
        title="Lire le document">🔵 Lire</button>

      <!-- Bouton Télécharger / Acheter (toujours visible) -->
      <button class="${isPurchased ? 'co-purchased-btn' : 'add-cart-btn'}"
        onclick='event.preventDefault();event.stopPropagation();${
          isPurchased
            ? `secureDownload("${p.id}","${safeTitle}")`
            : isFreeDownload
              ? `downloadPdf("${dlUrl}","${esc(p.title).replace(/"/g,"&quot;")}")`
              : `addToCart(JSON.parse(\`${cartItem}\`))`}'>${btnLabel}</button>

    </div>
  </div>
</div>
</a>`;
}

// ── VIDEO CARD ────────────────────────────────────────────────────────────────
function videoCard(v, idx) {
  const varClass = ['', 'v2', 'v3', 'v4', 'v5', 'v6'][idx % 6];
  const icon = CAT_ICON[v.category_slug] || '🎬';
  const levelLabel = LEVEL_LABEL[v.study_level] || v.study_level;
  const levelCls = LEVEL_CLASS[v.study_level] || 'level-bg';
  const cartItem = JSON.stringify({id: v.id, title: v.title, icon: '🎬', type: 'Vidéo', price: parseFloat(v.price) || 0, item_type: 'video'}).replace(/"/g, '&quot;');

  // ── Détection YouTube ou vidéo locale ────────────────────────────────────
  const yt   = ytId(v.video_url);
  const local = isLocalVideo(v.video_url);
  const thumb = v.thumbnail_url || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null);

  const thumbHtml = thumb
    ? `<img src="${esc(thumb)}" alt="${esc(v.title)}" loading="lazy"
         style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:12px 12px 0 0;"
         onerror="this.style.display='none'">`
    : `<span style="font-size:2.5rem">${icon}</span>`;

  // Bouton : YouTube, vidéo locale, ou panier
  let watchAction;
  if (v.is_free && yt) {
    watchAction = `openVideoModal('${yt}', '${escJs(v.title)}', '${escJs(v.source)}')`;
  } else if (v.is_free && local) {
    watchAction = `openLocalVideo('${escJs(localVideoUrl(v.video_url))}', '${escJs(v.title)}', '${escJs(v.source)}')`;
  } else {
    watchAction = `addToCart(${cartItem})`;
  }

  const ytBadge    = yt    ? `<span style="position:absolute;top:8px;left:8px;background:rgba(255,0,0,.85);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;letter-spacing:.5px;">▶ YouTube</span>` : '';
  const localBadge = local ? `<span style="position:absolute;top:8px;left:8px;background:rgba(27,58,107,.9);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;letter-spacing:.5px;">🎬 Vidéo</span>` : '';

  // Badge sommaire sur la carte (minimal)
  const chapters = Array.isArray(v.chapters) ? v.chapters : [];
  const hasSommaire = chapters.length > 0 && yt;
  const sommaireHtml = hasSommaire
    ? `<span class="video-chapters-badge" onclick="event.stopPropagation();${watchAction}">📋 ${chapters.length} étapes</span>`
    : '';

  return `
<div class="video-card ${varClass}" data-id="${v.id}">
  <div class="video-thumb ${varClass}" style="position:relative;${thumb ? 'padding:0;overflow:hidden;' : ''}cursor:pointer;" onclick="${watchAction}">
    ${thumbHtml}
    ${ytBadge}${localBadge}
    <div class="play-btn" style="${thumb ? 'position:absolute;inset:0;margin:auto;width:48px;height:48px;' : ''}">▶</div>
    <span class="video-duration" style="${thumb ? 'position:absolute;bottom:8px;right:8px;' : ''}">${formatDuration(v.duration_seconds)}</span>
    <span class="video-level ${levelCls}" style="${thumb ? 'position:absolute;bottom:8px;left:8px;' : ''}">${levelLabel}</span>
  </div>
  <div class="video-body">
    <div class="video-tag">${v.category_name || 'Cours'}</div>
    <div class="video-title">${v.title}</div>
    <div class="video-meta">
      <span class="video-author">👨‍🏫 ${v.instructor_name || 'Al Handassa.dz'}</span>
      <span class="video-views">👁 ${(v.views_count || 0).toLocaleString('fr-DZ')} vues</span>
    </div>
    ${sommaireHtml}

  </div>
  <div class="video-footer">
    ${formatPrice(v.price, v.is_free)}
    <button class="video-watch-btn" onclick="${watchAction}">${v.is_free ? '▶ Regarder' : 'Voir le cours'}</button>
  </div>
</div>`;
}

// ── ARTICLE CARD ──────────────────────────────────────────────────────────────
function articleCard(a) {
  const icon = CAT_ICON[a.category_slug] || '📰';
  const date = a.published_at ? new Date(a.published_at).toLocaleDateString('fr-DZ', {year:'numeric',month:'short',day:'numeric'}) : '';

  return `
<article class="article-card" data-id="${a.id}">
  <div class="article-thumb">${icon}</div>
  <div class="article-body">
    <div class="article-meta">
      <span class="article-category">${a.category_name || 'Article'}</span>
      <span class="article-read-time">⏱ ${a.read_time_min || 5} min</span>
    </div>
    <h3 class="article-title">${a.title}</h3>
    <p class="article-excerpt">${a.excerpt || ''}</p>
    <div class="article-footer">
      <div class="article-author">
        <div class="avatar sm">${initials(a.author_name)}</div>
        <div>
          <div class="author-name">${a.author_name || 'Al Handassa.dz'}</div>
          <div class="author-date">${date}</div>
        </div>
      </div>
      <div class="article-actions">
        <span class="article-views">👁 ${(a.views_count || 0).toLocaleString('fr-DZ')}</span>
        <a href="article?slug=${encodeURIComponent(a.slug)}" class="btn btn-sm btn-outline">Lire →</a>
      </div>
    </div>
  </div>
</article>`;
}

// ── LOAD PRODUCTS SPLIT (multi-types séparés par section) ────────────────────
// sections = [{type, label}]  — supporte 2, 3 sections ou plus
async function loadProductsSplit(tag, type1, type2, label1, label2, extraSections = []) {
  const grid     = document.getElementById('products-grid');
  const splitBox = document.getElementById('split-view');
  if (!splitBox) return;

  if (grid) grid.style.display = 'none';
  splitBox.style.display = 'block';
  splitBox.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#888">⏳ Chargement…</div>`;

  try {
    // Toutes les sections à charger
    const allSections = [
      { type: type1, label: label1 },
      { type: type2, label: label2 },
      ...extraSections
    ];

    const results = await Promise.all(
      allSections.map(s => api.products({ type: s.type, tag, limit: 50 }))
    );

    const hdr = (label, count) => `
      <div style="display:flex;align-items:center;gap:.6rem;
                  font-size:1.05rem;font-weight:700;color:#1B3A6B;
                  padding:.7rem 0 .9rem;border-bottom:3px solid #1B3A6B;
                  margin-bottom:1.2rem;">
        <span>${label}</span>
        <span style="background:#1B3A6B;color:#fff;font-size:.75rem;
                     font-weight:700;padding:.15rem .6rem;border-radius:999px;">${count}</span>
      </div>`;

    const subgrid = (items) =>
      `<div class="products-grid" style="margin-bottom:2.5rem">${items.map(productCard).join('')}</div>`;

    let html = '';
    let total = 0;
    results.forEach((res, i) => {
      const items = res.data || [];
      total += items.length;
      if (items.length) html += hdr(allSections[i].label, items.length) + subgrid(items);
    });

    if (!total) {
      splitBox.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#888">📭 Aucun produit trouvé.</div>`;
      return;
    }

    splitBox.innerHTML = html;
    initScrollAnimations();
  } catch (err) {
    console.error('[loadProductsSplit]', err);
    splitBox.innerHTML = `<div style="text-align:center;padding:60px 20px">⚠️ Erreur : ${err.message}</div>`;
  }
}

// ── LOAD PRODUCTS ─────────────────────────────────────────────────────────────
async function loadProducts(params = {}) {
  const grid     = document.getElementById('products-grid');
  const splitBox = document.getElementById('split-view');
  if (!grid) return;
  // Rétablir la grille normale et masquer le split
  grid.style.display = '';
  if (splitBox) splitBox.style.display = 'none';
  grid.innerHTML = skeletonCards(6, 'product-card');

  try {
    // Moins de cartes sur mobile pour réduire le scroll
    const isMobile = window.innerWidth <= 768;
    const limit = isMobile ? 4 : 9;
    // Exclure les logiciels du catalogue (ils ont leur propre section)
    const excludeLogiciels = !params.type ? { exclude_type: 'logiciels' } : {};
    // Documents de Chantier : exclure affiches (securite) et fiches labo (labo-beton)
    const excludeAffiches = (params.type === 'document_word' && !params.category)
      ? { exclude_category: 'securite,labo-beton,fiches-bureau-topo,fiches-terrain-topo,entreprise-go,entreprise-so,entreprise-qua,entreprise-rec' } : {};
    const res = await api.products({ limit, ...excludeLogiciels, ...excludeAffiches, ...params });
    if (!res.data || res.data.length === 0) {
      grid.innerHTML = `<div class="empty-state">📭 Aucun produit trouvé.</div>`;
      return;
    }
    grid.innerHTML = res.data.map(productCard).join('');
    initScrollAnimations();
  } catch (err) {
    console.error('[loadProducts] erreur:', err);
    grid.innerHTML = `<div class="empty-state">⚠️ Erreur de chargement (${err.message}). <button class="btn btn-sm btn-outline" onclick="loadProducts()">Réessayer</button></div>`;
  }
}

// ── LOAD VIDEOS ───────────────────────────────────────────────────────────────
const _videosState = { page: 1, total: 0, loading: false };
let _videosCurrentFilter = {};

function filterVideosBySource(btn, source) {
  // Mettre à jour le bouton actif
  document.querySelectorAll('.vsrc-btn').forEach(b => b.classList.remove('vsrc-active'));
  btn.classList.add('vsrc-active');
  // Mémoriser le filtre actif pour "Voir plus"
  _videosCurrentFilter = source ? { source } : {};
  loadVideos(_videosCurrentFilter);
}

async function loadVideos(params = {}, append = false) {
  const grid = document.getElementById('videos-grid');
  const moreBtn = document.getElementById('videos-more-btn');
  if (!grid) return;

  if (!append) {
    _videosState.page = 1;
    grid.innerHTML = skeletonCards(6, 'video-card');
  } else {
    _videosState.page++;
  }

  _videosState.loading = true;
  if (moreBtn) moreBtn.disabled = true;

  try {
    const limit = window.innerWidth <= 768 ? 3 : 6;
    const res = await api.videos({ limit, page: _videosState.page, ...params });
    _videosState.total = res.pagination?.total || 0;

    if (!res.data || res.data.length === 0) {
      if (!append) grid.innerHTML = `<div class="empty-state">📭 Aucune vidéo trouvée.</div>`;
      if (moreBtn) moreBtn.style.display = 'none';
      return;
    }

    const startIdx = (_videosState.page - 1) * limit;
    const html = res.data.map((v, i) => videoCard(v, startIdx + i)).join('');
    if (append) {
      grid.insertAdjacentHTML('beforeend', html);
    } else {
      grid.innerHTML = html;
    }

    // Afficher / masquer le bouton "Voir plus"
    const loaded = grid.querySelectorAll('.video-card').length;
    if (moreBtn) {
      const remaining = _videosState.total - loaded;
      if (remaining > 0) {
        moreBtn.style.display = 'inline-flex';
        moreBtn.textContent = `🎥 Voir plus (${remaining} vidéo${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`;
      } else {
        moreBtn.style.display = 'none';
      }
    }

    initScrollAnimations();
  } catch (err) {
    if (!append) grid.innerHTML = `<div class="empty-state">⚠️ Erreur de chargement. <button class="btn btn-sm btn-outline" onclick="loadVideos()">Réessayer</button></div>`;
  } finally {
    _videosState.loading = false;
    if (moreBtn) moreBtn.disabled = false;
  }
}

// ── LOGICIELS SECTION (index.html) ────────────────────────────────────────────
const _LOG_LEVEL_MAP = { debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', tous:'Tous niveaux' };
let _allLogiciels = []; // [{catLabel, catSlug, icon, softwares:[...]}]
let _logicielsCatFilter = '';

function filterLogicielsByCat(btn, cat) {
  document.querySelectorAll('#logiciels-cat-filters .vsrc-btn').forEach(b => b.classList.remove('vsrc-active'));
  btn.classList.add('vsrc-active');
  _logicielsCatFilter = cat;
  _renderLogiciels();
}

function _renderLogiciels() {
  const content = document.getElementById('logiciels-content');
  if (!content) return;
  const filtered = _logicielsCatFilter
    ? _allLogiciels.filter(c => c.catSlug === _logicielsCatFilter)
    : _allLogiciels;
  if (!filtered.length) {
    content.innerHTML = `<div class="empty-state">📭 Aucun logiciel trouvé.</div>`;
    return;
  }
  content.innerHTML = filtered.map(cat => {
    const shortTitle = cat.catLabel.split(' — ')[0].trim();
    const cards = cat.softwares.map(_logicielCard).join('');
    return `
      <section class="log-category" style="margin-bottom:40px">
        <div class="log-category-header">
          <div class="log-cat-title-block">
            <h2 class="log-cat-title">${cat.icon} ${shortTitle}</h2>
          </div>
          <span class="log-cat-count">${cat.softwares.length} logiciel${cat.softwares.length > 1 ? 's' : ''}</span>
        </div>
        <div class="log-sw-grid">${cards}</div>
      </section>`;
  }).join('');
  initScrollAnimations();
}

function _logicielCard(sw) {
  const level = _LOG_LEVEL_MAP[sw.level] || sw.level || '';
  const e = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return `
    <div class="log-sw-card">
      <div class="log-sw-header">
        <span class="log-sw-icon">${e(sw.icon || '💻')}</span>
        <div class="log-sw-title-block">
          <h3 class="log-sw-name">${e(sw.name)}</h3>
          <span class="log-sw-cat">${e(sw.category || '')}</span>
        </div>
        ${sw.badge ? `<span class="log-sw-badge" style="background:${e(sw.badge_color || '#1B3A6B')}">${e(sw.badge)}</span>` : ''}
      </div>
      <p class="log-sw-desc">${e(sw.description || '')}</p>
      ${sw.features?.length ? `<ul class="log-sw-features">${sw.features.map(f => `<li><i class="fas fa-check-circle"></i> ${e(f)}</li>`).join('')}</ul>` : ''}
      <div class="log-sw-footer">
        <div class="log-sw-meta">
          ${sw.platforms?.length ? `<span class="log-sw-pill"><i class="fas fa-desktop"></i> ${sw.platforms.map(e).join(' / ')}</span>` : ''}
          ${level ? `<span class="log-sw-pill"><i class="fas fa-graduation-cap"></i> ${e(level)}</span>` : ''}
          ${sw.price_info ? `<span class="log-sw-pill log-sw-pill-price"><i class="fas fa-tag"></i> ${e(sw.price_info)}</span>` : ''}
        </div>
        <div class="log-sw-links">
          ${sw.trial_url ? `<a class="log-sw-btn log-sw-btn-trial" href="${e(sw.trial_url)}" target="_blank" rel="noopener"><i class="fas fa-play-circle"></i> ${e(sw.trial_label || 'Essai gratuit')}</a>` : ''}
          ${sw.url ? `<a class="log-sw-btn log-sw-btn-site" href="${e(sw.url)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> ${e(sw.url_label || 'Site officiel')}</a>` : ''}
        </div>
      </div>
    </div>`;
}

async function loadLogiciels() {
  const content = document.getElementById('logiciels-content');
  if (!content) return;
  content.innerHTML = skeletonCards(6, 'log-sw-card');

  try {
    const res = await api.products({ type: 'logiciels', limit: 20 });
    if (!res.data || !res.data.length) {
      content.innerHTML = `<div class="empty-state">📭 Aucun logiciel disponible.</div>`;
      return;
    }

    const details = await Promise.all(
      res.data.map(p =>
        fetch(`${API_BASE}/products/${p.slug}`)
          .then(r => r.json())
          .then(r => r.data)
          .catch(() => null)
      )
    );

    const catIconMap = {
      'architecture-bim-logiciels': '🏛️',
      'architecture-bim-guide-logiciels': '🏛️',
      'genie-civil-structure-logiciels': '🏗️',
      'topographie-sig-logiciels': '🗺️',
      'drone-photogrammetrie-logiciels': '🛸',
      'thermique-energie-logiciels': '🌡️',
      'eclairage-lumiere-logiciels': '💡',
    };
    // Produits avec liste de logiciels (fiches référentiels)
    _allLogiciels = details
      .filter(p => p && Array.isArray(p.metadata?.software_list))
      .map(p => ({
        catLabel: p.title.split('—')[0].trim(),
        catSlug: p.slug,
        icon: catIconMap[p.slug] || '💻',
        softwares: p.metadata.software_list,
      }));

    // Produits achetables avec consultation HTML (ex: Ecotec)
    const achetables = res.data.filter(p =>
      p.preview_url && p.preview_url.endsWith('.html')
    );

    const filterBar = document.getElementById('logiciels-cat-filters');
    if (filterBar) {
      const catBtns = _allLogiciels.map(c =>
        `<button class="vsrc-btn" data-cat="${c.catSlug}" onclick="filterLogicielsByCat(this,'${c.catSlug}')">${c.icon} ${c.catLabel}</button>`
      ).join('');
      filterBar.innerHTML =
        `<button class="vsrc-btn vsrc-active" data-cat="" onclick="filterLogicielsByCat(this,'')">🖥️ Tous les logiciels</button>` + catBtns;
    }

    _renderLogiciels();

    // Afficher les ressources achetables (Ecotec, etc.) en bas de section
    if (achetables.length) {
      const existing = document.getElementById('logiciels-achetables');
      if (!existing) {
        const wrap = document.createElement('div');
        wrap.id = 'logiciels-achetables';
        wrap.style.cssText = 'margin-top:32px;';
        wrap.innerHTML = `
          <h3 style="font-size:1.1rem;font-weight:700;color:#1B3A6B;margin-bottom:16px;">📦 Ressources & Méthodes à télécharger</h3>
          <div class="products-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
            ${achetables.map(productCard).join('')}
          </div>`;
        content.appendChild(wrap);
      }
    }
  } catch (err) {
    content.innerHTML = `<div class="empty-state">⚠️ Erreur de chargement. <button class="btn btn-sm btn-outline" onclick="loadLogiciels()">Réessayer</button></div>`;
  }
}

// ── LOAD ARTICLES ─────────────────────────────────────────────────────────────
let _articlesPage = 1;
const _articlesLimit = 9;

async function loadArticles(params = {}, append = false) {
  const grid = document.getElementById('articles-grid');
  if (!grid) return;
  if (!append) {
    _articlesPage = 1;
    grid.innerHTML = skeletonCards(_articlesLimit, 'article-card');
  }

  // Bouton "Voir plus"
  const moreBtn = document.getElementById('articles-more-btn');

  try {
    const res = await api.articles({ limit: _articlesLimit, page: _articlesPage, ...params });
    if (!res.data || res.data.length === 0) {
      if (!append) grid.innerHTML = `<div class="empty-state">📭 Aucun article trouvé.</div>`;
      if (moreBtn) moreBtn.style.display = 'none';
      return;
    }
    const cards = res.data.map(articleCard).join('');
    if (append) grid.insertAdjacentHTML('beforeend', cards);
    else        grid.innerHTML = cards;
    initScrollAnimations();

    // Afficher/cacher le bouton "Voir plus"
    if (moreBtn) {
      const total = res.pagination?.total || 0;
      const shown = _articlesPage * _articlesLimit;
      moreBtn.style.display = shown < total ? 'inline-flex' : 'none';
    }
  } catch (err) {
    if (!append) grid.innerHTML = `<div class="empty-state">⚠️ Erreur de chargement.</div>`;
  }
}

function loadMoreArticles() {
  _articlesPage++;
  loadArticles({}, true);
}

// ── CATALOG FILTERS ───────────────────────────────────────────────────────────
const FILTER_MAP = {
  all: {}, ouvrage: {type:'ouvrage'}, cours: {type:'cours_pdf'},
  exercices: {type:'exercices'}, td: {type:'td_pdf'}, tp: {type:'tp_pdf'}, tuto: {type:'tuto_pdf'},
  normes: {type:'normes'}, sujet: {type:'sujet'}, gratuit: {free:'true'},
  document_word: {type:'document_word'},
  affiches_chantier: {type:'document_word', category:'securite'},
  'labo-beton': {type:'document_word', category:'labo-beton'},
  'topo-docs': {type:'document_word', tag:'Fiches Topographie'},
  'entreprise-btp': {type:'document_word', tag:'Documents Entreprise BTP'},
};

function initFilters() {
  const subfiltersWrap      = document.getElementById('sujet-level-filters');
  const sujetThemeWrap      = document.getElementById('sujet-theme-filters');
  const tutoFiltersWrap     = document.getElementById('tuto-subfilters');
  const coursFiltersWrap    = document.getElementById('cours-subfilters');
  const tdFiltersWrap       = document.getElementById('td-subfilters');
  const tpFiltersWrap       = document.getElementById('tp-subfilters');
  const laboFiltersWrap     = document.getElementById('subfilters-labo');
  const topoFiltersWrap       = document.getElementById('subfilters-topo');
  const entrepriseFiltersWrap = document.getElementById('subfilters-entreprise');

  // Tous les blocs de sous-filtres
  const allSubfilters = [subfiltersWrap, sujetThemeWrap, tutoFiltersWrap, coursFiltersWrap, tdFiltersWrap, tpFiltersWrap, laboFiltersWrap, topoFiltersWrap, entrepriseFiltersWrap];

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const filter = this.dataset.filter;

      // Masquer tous les sous-filtres d'abord
      allSubfilters.forEach(w => w && (w.style.display = 'none'));

      // Afficher le bon sous-filtre selon le filtre actif
      if (filter === 'sujet') {
        if (subfiltersWrap)   subfiltersWrap.style.display = 'block';
        if (sujetThemeWrap)   sujetThemeWrap.style.display = 'block';
        document.querySelectorAll('.root-card[data-tag]').forEach(b => b.classList.remove('active'));
        subfiltersWrap?.querySelector('[data-tag=""]')?.classList.add('active');
        document.querySelectorAll('.theme-chip[data-sujet-tag]').forEach(b => b.classList.remove('active'));
        sujetThemeWrap?.querySelector('[data-sujet-tag=""]')?.classList.add('active');
        _loadSujetCounts();
      }
      if (filter === 'tuto' && tutoFiltersWrap) {
        tutoFiltersWrap.style.display = 'block';
        document.querySelectorAll('.root-card[data-tuto-tag]').forEach(b => b.classList.remove('active'));
        tutoFiltersWrap.querySelector('[data-tuto-tag=""]')?.classList.add('active');
        _loadTutoCounts();
      }
      if (filter === 'cours' && coursFiltersWrap) {
        coursFiltersWrap.style.display = 'block';
        document.querySelectorAll('.theme-chip[data-cours-tag]').forEach(b => b.classList.remove('active'));
        coursFiltersWrap.querySelector('[data-cours-tag=""]')?.classList.add('active');
      }
      if (filter === 'td' && tdFiltersWrap) {
        tdFiltersWrap.style.display = 'block';
        document.querySelectorAll('.theme-chip[data-td-tag]').forEach(b => b.classList.remove('active'));
        tdFiltersWrap.querySelector('[data-td-tag=""]')?.classList.add('active');
      }
      if (filter === 'tp' && tpFiltersWrap) {
        tpFiltersWrap.style.display = 'block';
        document.querySelectorAll('.theme-chip[data-tp-tag]').forEach(b => b.classList.remove('active'));
        tpFiltersWrap.querySelector('[data-tp-tag=""]')?.classList.add('active');
      }
      if (filter === 'labo-beton' && laboFiltersWrap) {
        laboFiltersWrap.style.display = 'block';
        document.querySelectorAll('.theme-chip[data-labo-tag]').forEach(b => b.classList.remove('active'));
        laboFiltersWrap.querySelector('[data-labo-tag=""]')?.classList.add('active');
      }
      if (filter === 'topo-docs' && topoFiltersWrap) {
        topoFiltersWrap.style.display = 'block';
        document.querySelectorAll('.theme-chip[data-topo-cat]').forEach(b => b.classList.remove('active'));
        topoFiltersWrap.querySelector('[data-topo-cat=""]')?.classList.add('active');
      }
      if (filter === 'entreprise-btp' && entrepriseFiltersWrap) {
        entrepriseFiltersWrap.style.display = 'block';
        document.querySelectorAll('.theme-chip[data-entreprise-cat]').forEach(b => b.classList.remove('active'));
        entrepriseFiltersWrap.querySelector('[data-entreprise-cat=""]')?.classList.add('active');
      }

      const params = FILTER_MAP[this.dataset.filter] || {};
      const searchVal = document.getElementById('catalog-search')?.value.trim();
      if (searchVal) params.search = searchVal;
      loadProducts(params);
    });
  });

  // ── Cartes racines sujets ─────────────────────────────────
  // Map diplôme → id du groupe de chips modules
  const DIPLOME_MODULES = {
    '':           'sujet-modules-all',
    'BAC PRO':    'sujet-modules-bac',
    'BTS':        'sujet-modules-bts',
    'Licence':    'sujet-modules-lic',
    'Master':     'sujet-modules-mas',
    'Ingénieur':  'sujet-modules-ing',
  };

  function _showSujetModules(diplomeTag) {
    // Masquer tous les groupes de modules
    Object.values(DIPLOME_MODULES).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    // Afficher le groupe correspondant au diplôme
    const targetId = DIPLOME_MODULES[diplomeTag] ?? 'sujet-modules-all';
    const target = document.getElementById(targetId);
    if (target) {
      target.style.display = 'flex';
      // Activer le premier chip (Tous)
      target.querySelectorAll('.theme-chip').forEach(b => b.classList.remove('active'));
      target.querySelector('.theme-chip')?.classList.add('active');
    }
  }

  document.querySelectorAll('.root-card[data-tag]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.root-card[data-tag]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tag = this.dataset.tag;
      // Afficher les modules du diplôme sélectionné
      _showSujetModules(tag);
      const params = { type: 'sujet' };
      if (tag) params.tag = tag;
      const searchVal = document.getElementById('catalog-search')?.value.trim();
      if (searchVal) params.search = searchVal;
      loadProducts(params);
    });
  });

  // ── Chips thèmes Cours PDF ────────────────────────────────
  // Affiche UNIQUEMENT les cours_pdf pour le thème sélectionné
  document.querySelectorAll('.theme-chip[data-cours-tag]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.theme-chip[data-cours-tag]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tag = this.dataset.coursTag;
      const params = { type: 'cours_pdf' };
      if (tag) params.tag = tag;
      loadProducts(params);
    });
  });

  // ── Chips modules Sujets d'examen ────────────────────────
  // Filtre par module EN PLUS du diplôme déjà sélectionné via root-card
  document.querySelectorAll('.theme-chip[data-sujet-tag]').forEach(btn => {
    btn.addEventListener('click', function () {
      // Désactiver tous les chips de tous les groupes modules
      document.querySelectorAll('.theme-chip[data-sujet-tag]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const moduleTag = this.dataset.sujetTag;
      // Récupérer le diplôme actif (root-card)
      const activeRoot = document.querySelector('.root-card[data-tag].active');
      const diplomeTag = activeRoot ? activeRoot.dataset.tag : '';
      const params = { type: 'sujet' };
      // Si module = diplôme (ex: "BAC PRO" chip "Tous BAC") → filtrer par diplôme seul
      // Si module différent du diplôme → filtrer par module (tag le plus précis)
      if (moduleTag) params.tag = moduleTag;
      else if (diplomeTag) params.tag = diplomeTag;
      const searchVal = document.getElementById('catalog-search')?.value.trim();
      if (searchVal) params.search = searchVal;
      loadProducts(params);
    });
  });

  // ── Chips thèmes TD PDF ───────────────────────────────────
  // Affiche UNIQUEMENT les td_pdf pour le thème sélectionné
  document.querySelectorAll('.theme-chip[data-td-tag]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.theme-chip[data-td-tag]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tag = this.dataset.tdTag;
      const params = { type: 'td_pdf' };
      if (tag) params.tag = tag;
      loadProducts(params);
    });
  });

  // ── Chips thèmes TP PDF ───────────────────────────────────
  // Affiche UNIQUEMENT les tp_pdf pour le thème sélectionné
  document.querySelectorAll('.theme-chip[data-tp-tag]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.theme-chip[data-tp-tag]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tag = this.dataset.tpTag;
      const params = { type: 'tp_pdf' };
      if (tag) params.tag = tag;
      loadProducts(params);
    });
  });

  // ── Chips Documents Entreprise BTP ────────────────────────
  document.querySelectorAll('.theme-chip[data-entreprise-cat]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.theme-chip[data-entreprise-cat]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.entrepriseCat;
      const params = cat
        ? { type: 'document_word', category: cat }
        : { type: 'document_word', tag: 'Documents Entreprise BTP' };
      loadProducts(params);
    });
  });

  // ── Chips Documents Topographie ───────────────────────────
  document.querySelectorAll('.theme-chip[data-topo-cat]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.theme-chip[data-topo-cat]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.topoCat;
      const params = cat
        ? { type: 'document_word', category: cat }
        : { type: 'document_word', tag: 'Fiches Topographie' };
      loadProducts(params);
    });
  });

  // ── Chips Fiches Laboratoire ──────────────────────────────
  document.querySelectorAll('.theme-chip[data-labo-tag]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.theme-chip[data-labo-tag]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tag = this.dataset.laboTag;
      const params = { type: 'document_word', category: 'labo-beton' };
      if (tag) params.tag = tag;
      loadProducts(params);
    });
  });

  // ── Cartes tutos ─────────────────────────────────────────
  document.querySelectorAll('.root-card[data-tuto-tag]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.root-card[data-tuto-tag]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tag = this.dataset.tutoTag;
      const params = { type: 'tuto_pdf' };
      if (tag) params.tag = tag;
      const searchVal = document.getElementById('catalog-search')?.value.trim();
      if (searchVal) params.search = searchVal;
      loadProducts(params);
    });
  });

  // ── Barre de recherche catalogue ─────────────────────────
  const searchInput = document.getElementById('catalog-search');
  const clearBtn    = document.getElementById('catalog-search-clear');
  if (!searchInput) return;

  let _searchTimer;
  searchInput.addEventListener('input', function () {
    const val = this.value.trim();
    clearBtn.style.display = val ? 'flex' : 'none';
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      // Récupérer le filtre de type actif
      const activeFilter = document.querySelector('.filter-btn.active');
      const typeParams = FILTER_MAP[activeFilter?.dataset.filter || 'all'] || {};
      const params = { ...typeParams };
      if (val) params.search = val;
      loadProducts(params);
    }, 350); // délai 350ms pour ne pas surcharger l'API
  });
}

// Charger les compteurs de tutos par logiciel
async function _loadTutoCounts() {
  const items = [
    { id: 'tc-all',     tag: '' },
    { id: 'tc-revit',   tag: 'Revit' },
    { id: 'tc-archicad',tag: 'Archicad' },
  ];
  for (const { id, tag } of items) {
    const el = document.getElementById(id);
    if (!el) continue;
    try {
      const params = { type: 'tuto_pdf', limit: 1 };
      if (tag) params.tag = tag;
      const res = await api.products(params);
      const total = res.pagination?.total || 0;
      el.textContent = total > 0 ? `${total} tuto${total > 1 ? 's' : ''}` : '0';
    } catch { el.textContent = '—'; }
  }
}

// Charger les compteurs de sujets par niveau pour les badges
async function _loadSujetCounts() {
  const levels = [
    { id: 'lc-all', tag: '' },
    { id: 'lc-bac', tag: 'BAC PRO' },
    { id: 'lc-bts', tag: 'BTS' },
    { id: 'lc-lic', tag: 'Licence' },
    { id: 'lc-mas', tag: 'Master' },
    { id: 'lc-ing', tag: 'Ingénieur' },
  ];
  for (const { id, tag } of levels) {
    const el = document.getElementById(id);
    if (!el) continue;
    try {
      const params = { type: 'sujet', limit: 1 };
      if (tag) params.tag = tag;
      const res = await api.products(params);
      const total = res.pagination?.total || 0;
      el.textContent = total > 0 ? `${total} sujet${total > 1 ? 's' : ''}` : '0';
    } catch { el.textContent = '—'; }
  }
}

function clearCatalogSearch() {
  const searchInput = document.getElementById('catalog-search');
  const clearBtn    = document.getElementById('catalog-search-clear');
  if (searchInput) searchInput.value = '';
  if (clearBtn)    clearBtn.style.display = 'none';
  // Recharger avec le filtre de type actif uniquement
  const activeFilter = document.querySelector('.filter-btn.active');
  const params = FILTER_MAP[activeFilter?.dataset.filter || 'all'] || {};
  loadProducts(params);
}

function filterByLevel(dbValue) {
  // dbValue vient directement de la table study_levels.db_value
  document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' });
  loadProducts({ level: dbValue });
}

async function loadLevelCards() {
  const grid = document.getElementById('levels-grid');
  if (!grid) return;
  try {
    const res  = await fetch('http://localhost:5000/api/study-levels');
    const json = await res.json();
    const levels = json.data || [];
    if (!levels.length) { grid.innerHTML = ''; return; }

    // Définition des racines avec ordre, couleur et libellé
    const RACINES = [
      { key: 'bac',       label: 'BAC',                       icon: '🎓', color: '#2563eb', bg: '#eff6ff' },
      { key: 'bts',       label: 'BTS',                       icon: '📐', color: '#16a34a', bg: '#f0fdf4' },
      { key: 'licence',   label: 'Licence',                   icon: '🏛️', color: '#9333ea', bg: '#faf5ff' },
      { key: 'master',    label: 'Mastère',                   icon: '🔬', color: '#ea580c', bg: '#fff7ed' },
      { key: 'ingenieur', label: 'Ingénieur & Architecte',    icon: '⚙️', color: '#1B3A6B', bg: '#f0f4fa' },
      { key: 'prepa',     label: 'Classes Préparatoires',     icon: '📖', color: '#64748b', bg: '#f8fafc' },
    ];

    // Grouper les niveaux par racine
    const groups = {};
    RACINES.forEach(r => { groups[r.key] = []; });
    levels.forEach(l => {
      const r = l.racine || 'bac';
      if (!groups[r]) groups[r] = [];
      groups[r].push(l);
    });

    // Générer le HTML groupé
    let html = '';
    RACINES.forEach(racine => {
      const items = groups[racine.key];
      if (!items || !items.length) return;

      html += `
        <div class="level-group">
          <div class="level-group-header" style="--racine-color:${racine.color}">
            <span class="level-group-icon">${racine.icon}</span>
            <span class="level-group-name">${racine.label}</span>
          </div>
          <div class="level-group-cards">
            ${items.map(l => `
              <div class="level-card" style="--card-color:${racine.color};--card-bg:${racine.bg}"
                   onclick="filterByLevel('${l.db_value}')">
                <div class="level-icon">${l.icon || racine.icon}</div>
                <h3>${l.label_fr}</h3>
                <span class="level-count">Voir les ressources →</span>
              </div>`).join('')}
          </div>
        </div>`;
    });

    grid.innerHTML = html;
  } catch (e) {
    console.warn('Impossible de charger les niveaux:', e.message);
    grid.innerHTML = '';
  }
}

// ── NAVBAR SCROLL ─────────────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const handler = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
    document.getElementById('back-top')?.classList.toggle('show', window.scrollY > 400);
  };
  window.addEventListener('scroll', handler, { passive: true });
}

// ── HAMBURGER ─────────────────────────────────────────────────────────────────
function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('nav-links');
  btn?.addEventListener('click', () => {
    menu?.classList.toggle('open');
    btn.classList.toggle('active');
    const spans = btn.querySelectorAll('span');
    if (btn.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  document.addEventListener('click', e => {
    if (!btn?.contains(e.target) && !menu?.contains(e.target)) {
      menu?.classList.remove('open');
      btn?.classList.remove('active');
      btn?.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

// ── CART ──────────────────────────────────────────────────────────────────────
function initCart() {
  const open  = () => { document.getElementById('cart-sidebar')?.classList.add('open'); document.getElementById('cart-overlay')?.classList.add('show'); document.body.style.overflow = 'hidden'; renderCart(); };
  const close = () => { document.getElementById('cart-sidebar')?.classList.remove('open'); document.getElementById('cart-overlay')?.classList.remove('show'); document.body.style.overflow = ''; };
  document.getElementById('cart-btn')?.addEventListener('click', open);
  document.getElementById('cart-close')?.addEventListener('click', close);
  document.getElementById('cart-overlay')?.addEventListener('click', close);
}

function addToCart(product) {
  if (state.cartItems.find(i => i.id === product.id)) {
    showToast(`"${product.title}" déjà dans le panier`, 'info'); return;
  }
  state.cartItems.push(product);
  updateCartBadge();
  showToast(`🛒 "${product.title}" ajouté !`, 'success');
  if (document.getElementById('cart-sidebar')?.classList.contains('open')) renderCart();
}

function removeFromCart(id) {
  state.cartItems = state.cartItems.filter(i => i.id !== id);
  updateCartBadge(); renderCart();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) { badge.textContent = state.cartItems.length; badge.style.display = state.cartItems.length > 0 ? 'flex' : 'none'; }
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totalEl   = document.getElementById('cart-total');
  if (!container) return;

  if (state.cartItems.length === 0) {
    container.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>Votre panier est vide</p></div>`;
    if (totalEl) totalEl.textContent = '0 DZD';
    return;
  }

  container.innerHTML = state.cartItems.map(item => `
    <div class="cart-item">
      <div class="cart-item-thumb">${item.icon}</div>
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-type">${item.type}</div>
        <div class="cart-item-price">${item.price === 0 ? 'Gratuit' : item.price.toLocaleString('fr-DZ') + ' DZD'}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Supprimer">✕</button>
    </div>`).join('');

  const sum = state.cartItems.reduce((a, i) => a + i.price, 0);
  if (totalEl) totalEl.textContent = sum.toLocaleString('fr-DZ') + ' DZD';
}

// ── AUTH STATE ────────────────────────────────────────────────────────────────
function initAuth() {
  const user = Auth.getUser();
  if (user) {
    state.user = user;
    updateNavbarForUser(user);
    // Charger les achats pour afficher "Télécharger" sur les cartes
    loadMyPurchases();
  }
}

async function loadMyPurchases() {
  if (!Auth.isLoggedIn()) return;
  try {
    const res = await api.myPurchases();
    const purchases = res.data || [];
    state.purchasedIds = new Set(purchases.map(p => String(p.id)));
    _refreshProductCards();
  } catch { /* silencieux */ }
}

function updateNavbarForUser(user) {
  const actionsEl = document.getElementById('nav-auth-actions');
  if (!actionsEl) return;

  const plan = user.subscription_plan || 'free';
  const planBadge = plan === 'pro' ? '💎' : plan === 'standard' ? '⭐' : '';
  actionsEl.innerHTML = `
    <div class="user-menu">
      <button class="user-menu-btn" id="user-menu-btn">
        <div class="user-avatar-sm">${initials(user.first_name + ' ' + user.last_name)}</div>
        <span class="user-name-sm">${user.first_name} ${planBadge}</span>
        <span class="chevron">▾</span>
      </button>
      <div class="user-dropdown" id="user-dropdown">
        <div class="dropdown-header">
          <strong>${user.first_name} ${user.last_name}</strong>
          <span class="dropdown-email">${user.email}</span>
          <span class="dropdown-plan plan-${plan}">Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} ${planBadge}</span>
        </div>
        <a href="#" class="dropdown-item" onclick="showMyDownloads()">⬇️ Mes Téléchargements</a>
        ${plan === 'free'
          ? `<a href="#" class="dropdown-item dropdown-upgrade" onclick="document.getElementById('user-dropdown')?.classList.remove('open');openSubscriptionModal('standard')">⭐ Passer au Premium</a>`
          : `<a href="#" class="dropdown-item" onclick="showMySubscription()">💳 Mon Abonnement</a>`}
        <div class="dropdown-divider"></div>
        <a href="#" class="dropdown-item dropdown-logout" onclick="handleLogout()">🚪 Déconnexion</a>
      </div>
    </div>`;

  document.getElementById('user-menu-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('user-dropdown')?.classList.toggle('open');
  });
  document.addEventListener('click', () => document.getElementById('user-dropdown')?.classList.remove('open'));
}

async function handleLogout() {
  await api.logout();
  state.user = null;
  showToast('👋 Déconnexion réussie.', 'info');
  setTimeout(() => location.reload(), 800);
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function initModal() {
  const overlay = document.getElementById('auth-modal');
  document.querySelectorAll('[data-modal="auth"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (Auth.isLoggedIn()) { showToast('Vous êtes déjà connecté !', 'info'); return; }
      overlay?.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
      document.body.style.overflow = '';
    });
  });
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) { overlay.classList.remove('show'); document.body.style.overflow = ''; }
  });

  // Tabs
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.modal-panel').forEach(p => p.style.display = 'none');
      const target = document.getElementById('panel-' + this.dataset.tab);
      if (target) target.style.display = 'block';
    });
  });
}

// ── FORMS (REAL API) ──────────────────────────────────────────────────────────
const LEVEL_MAP = {
  'Bac Technique': 'bac_technique', 'BTS Génie Civil': 'bts',
  'Licence Génie Civil': 'licence', 'Licence Architecture': 'licence',
  'Master Génie Civil': 'master', 'Master Architecture': 'master',
  "École d'Ingénieurs": 'ingenieur', 'Professionnel': 'professionnel',
};

function initForms() {
  // ── Login
  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type=submit]');
    const email = f.querySelector('[name=email]')?.value.trim();
    const password = f.querySelector('[name=password]')?.value;
    if (!email || !password) { showToast('Remplissez tous les champs.', 'warning'); return; }

    btn.disabled = true; btn.textContent = '⏳ Connexion...';
    try {
      const res = await api.login(email, password);
      state.user = res.user;
      showToast(`🎉 Bienvenue ${res.user.first_name} !`, 'success');
      document.getElementById('auth-modal')?.classList.remove('show');
      document.body.style.overflow = '';
      updateNavbarForUser(res.user);
      loadMyPurchases(); // Charger les achats pour mettre à jour les cartes
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = '🚀 Se Connecter';
    }
  });

  // ── Register
  document.getElementById('register-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type=submit]');

    const first_name = f.querySelector('[name=first_name]')?.value.trim();
    const last_name  = f.querySelector('[name=last_name]')?.value.trim();
    const email      = f.querySelector('[name=email]')?.value.trim();
    const phone      = f.querySelector('[name=phone]')?.value.trim();
    const password   = f.querySelector('[name=password]')?.value;
    const levelVal   = f.querySelector('[name=study_level]')?.value;
    const study_level = LEVEL_MAP[levelVal] || null;

    if (!first_name || !last_name || !email || !password) {
      showToast('Remplissez tous les champs obligatoires.', 'warning'); return;
    }
    if (password.length < 8) { showToast('Mot de passe : minimum 8 caractères.', 'warning'); return; }

    btn.disabled = true; btn.textContent = '⏳ Création...';
    try {
      const res = await api.register({ first_name, last_name, email, phone: phone || undefined, password, study_level });
      state.user = res.user;
      showToast(`✅ Bienvenue ${res.user.first_name} ! Compte créé avec succès.`, 'success');
      document.getElementById('auth-modal')?.classList.remove('show');
      document.body.style.overflow = '';
      updateNavbarForUser(res.user);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = '✅ Créer mon Compte Gratuit';
    }
  });

  // ── Forgot password — toggle panels
  document.getElementById('forgot-password-link')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('panel-login').querySelector('form').style.display = 'none';
    document.querySelector('#panel-login .form-divider') && (document.querySelector('#panel-login .form-divider').style.display = 'none');
    document.querySelector('#panel-login .social-login') && (document.querySelector('#panel-login .social-login').style.display = 'none');
    document.getElementById('forgot-password-link').closest('div').style.display = 'none';
    document.getElementById('panel-forgot').style.display = 'block';
    document.getElementById('forgot-msg').style.display = 'none';
    document.getElementById('forgot-email').value = '';
  });

  document.getElementById('back-to-login-link')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('panel-forgot').style.display = 'none';
    document.getElementById('panel-login').querySelector('form').style.display = '';
    document.querySelector('#panel-login .form-divider') && (document.querySelector('#panel-login .form-divider').style.display = '');
    document.querySelector('#panel-login .social-login') && (document.querySelector('#panel-login .social-login').style.display = '');
    document.getElementById('forgot-password-link').closest('div').style.display = '';
  });

  // ── Forgot password — submit
  document.getElementById('forgot-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const btn   = e.target.querySelector('button[type=submit]');
    const msg   = document.getElementById('forgot-msg');

    if (!email) { showToast('Entrez votre adresse email.', 'warning'); return; }

    btn.disabled = true;
    btn.innerHTML = '⏳ Envoi en cours…';
    msg.style.display = 'none';

    try {
      await api.forgotPassword(email);
      msg.style.cssText = 'display:block;background:#f0fdf4;color:#166534;border:1px solid #86efac;padding:12px;border-radius:8px;font-size:13px;text-align:center';
      msg.textContent = '📧 Si cet email existe, un lien de réinitialisation a été envoyé. Vérifiez votre boîte mail.';
      btn.style.display = 'none';
    } catch (err) {
      msg.style.cssText = 'display:block;background:#fef2f2;color:#991b1b;border:1px solid #fca5a5;padding:12px;border-radius:8px;font-size:13px;text-align:center';
      msg.textContent = err.message || 'Une erreur est survenue.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '📧 Envoyer le lien';
    }
  });

  // ── Newsletter
  document.getElementById('nl-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = e.target.querySelector('[name=nl_email]')?.value.trim();
    const first_name = e.target.querySelector('[name=nl_name]')?.value.trim() || 'Abonné';
    if (!email) return;
    try {
      await api.subscribe(email, first_name);
      showToast('📧 Inscription confirmée ! Bienvenue sur Al Handassa.dz', 'success');
      e.target.reset();
    } catch (err) {
      showToast(err.message || '❌ Erreur d\'inscription.', 'error');
    }
  });
}

// ── WISHLIST ──────────────────────────────────────────────────────────────────
async function handleWishlist(btn, itemId, itemType, title) {
  if (!Auth.isLoggedIn()) {
    showToast('🔐 Connectez-vous pour ajouter aux favoris.', 'warning');
    document.getElementById('auth-modal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    return;
  }
  const active = btn.classList.toggle('wished');
  btn.textContent = active ? '❤️' : '🤍';
  try {
    await api.toggleWishlist(
      itemType === 'product' ? itemId : undefined,
      itemType === 'video'   ? itemId : undefined
    );
    showToast(active ? `❤️ "${title}" ajouté aux favoris` : `🤍 Retiré des favoris`, active ? 'success' : 'info');
  } catch {
    btn.classList.toggle('wished', !active);
    btn.textContent = active ? '🤍' : '❤️';
    showToast('Erreur favoris.', 'error');
  }
}

// ── CHECKOUT ──────────────────────────────────────────────────────────────────
// ── CHECKOUT MODAL ────────────────────────────────────────────────────────────

function _closeCheckout() {
  document.getElementById('checkout-modal')?.remove();
  document.body.style.overflow = '';
}

function _checkoutTab(method) {
  document.querySelectorAll('#checkout-modal .co-tab').forEach(b => b.classList.toggle('active', b.dataset.method === method));
  document.querySelectorAll('#checkout-modal .co-panel').forEach(p => p.style.display = p.dataset.panel === method ? '' : 'none');
}

async function _submitCheckout(orderId, method) {
  const btn = document.getElementById('co-submit-btn');
  const ref = document.getElementById('co-reference')?.value.trim() || '';
  const code = document.getElementById('co-prepaid-code')?.value.trim() || '';
  if (!btn) return;
  btn.disabled = true; btn.textContent = '⏳ Traitement…';
  try {
    let result;
    if (method === 'ccp_virement' || method === 'baridimob') {
      result = await api.manualPayment(orderId, method, ref, '');
    } else if (method === 'code_prepaye') {
      result = await api.redeemPrepaid(code);
    }
    // Succès : afficher l'écran de téléchargement
    _showCheckoutSuccess(orderId, result);
  } catch (err) {
    btn.disabled = false; btn.textContent = '✅ Confirmer le paiement';
    showToast(err.message, 'error');
  }
}

async function _showCheckoutSuccess(orderId, paymentResult) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;
  // Recharger les produits achetés
  let purchases = [];
  try {
    const res = await api.myPurchases();
    purchases = res.data || [];
    state.purchasedIds = new Set(purchases.map(p => p.id));
    // Re-render les cartes pour afficher boutons "Télécharger"
    _refreshProductCards();
  } catch {}

  const itemsHtml = purchases.length
    ? purchases.map(p => `
        <div class="co-dl-item">
          <div class="co-dl-info">
            <span class="co-dl-icon">${p.type === 'ouvrage' ? '📚' : p.type === 'document_word' ? '📋' : '📄'}</span>
            <span class="co-dl-title">${p.title}</span>
          </div>
          ${p.has_file
            ? `<button class="co-dl-btn" onclick="secureDownload('${p.id}','${p.title.replace(/'/g,"\\'")}')">⬇️ Télécharger</button>`
            : `<span class="co-dl-soon">📩 Livraison sous 24h</span>`}
        </div>`).join('')
    : '<p style="color:#666;text-align:center">Vos achats apparaîtront ici.</p>';

  modal.innerHTML = `
  <div class="checkout-box co-success">
    <div class="co-success-icon">🎉</div>
    <h2 class="co-success-title">Paiement confirmé !</h2>
    <p class="co-success-sub">Vos ressources sont prêtes à être téléchargées.</p>
    <div class="co-dl-list">${itemsHtml}</div>
    <button class="btn btn-primary" style="margin-top:20px;width:100%" onclick="_closeCheckout()">Fermer</button>
  </div>`;
}

function _refreshProductCards() {
  // Mettre à jour les boutons des cartes déjà rendues
  document.querySelectorAll('.product-card').forEach(card => {
    const id = card.dataset.id;
    if (id && state.purchasedIds?.has(id)) {
      const footer = card.querySelector('.product-footer > div:last-child');
      if (footer && !footer.querySelector('.co-purchased-btn')) {
        const addBtn = footer.querySelector('.add-cart-btn');
        if (addBtn && !addBtn.classList.contains('co-purchased-btn')) {
          addBtn.className = 'co-purchased-btn';
          addBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); secureDownload(id, card.querySelector('.product-title')?.textContent || ''); };
          addBtn.textContent = '⬇️ Mon téléchargement';
        }
      }
    }
  });
}

async function secureDownload(productId, title) {
  if (!Auth.isLoggedIn()) {
    showToast('🔐 Connectez-vous pour télécharger.', 'warning');
    document.getElementById('auth-modal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    return;
  }
  showToast(`⏳ Préparation de "${title}"…`, 'info');
  try {
    await api.downloadProduct(productId);
    showToast(`✅ Téléchargement de "${title}" démarré !`, 'success');
  } catch (err) {
    showToast(err.message || 'Erreur de téléchargement', 'error');
  }
}

async function checkout() {
  if (state.cartItems.length === 0) { showToast('🛒 Votre panier est vide', 'warning'); return; }
  if (!Auth.isLoggedIn()) {
    showToast('🔐 Connectez-vous pour passer commande.', 'warning');
    document.getElementById('auth-modal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    return;
  }

  const items = state.cartItems.map(i => ({ id: i.id, type: i.item_type || 'product' }));
  const total = state.cartItems.reduce((a, i) => a + i.price, 0);
  const totalFmt = total.toLocaleString('fr-DZ');

  // Créer la commande d'abord
  let order;
  try {
    const res = await api.createOrder(items, null);
    order = res.data;
  } catch (err) {
    showToast(err.message, 'error'); return;
  }

  // Fermer le panier
  document.getElementById('cart-sidebar')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('show');
  state.cartItems = [];
  updateCartBadge();
  renderCart();

  // Construire la liste des articles pour l'affichage
  const itemsListHtml = (order.items || items.map(i => {
    const ci = state.cartItems.find(c => c.id === i.id);
    return { title: ci?.title || 'Article', unit_price: ci?.price || 0 };
  })).map(it => `
    <div class="co-order-item">
      <span>${it.title}</span>
      <span>${(it.unit_price||0).toLocaleString('fr-DZ')} DZD</span>
    </div>`).join('');

  // Ouvrir le modal checkout
  const existing = document.getElementById('checkout-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.className = 'checkout-overlay';
  modal.innerHTML = `
  <div class="checkout-box">
    <button class="co-close" onclick="_closeCheckout()">✕</button>
    <h2 class="co-title">💳 Finaliser la commande</h2>
    <div class="co-order-number">Commande #${order.order_number || order.id?.slice(0,8)}</div>

    <!-- Récapitulatif -->
    <div class="co-summary">
      ${itemsListHtml}
      <div class="co-total-row">
        <strong>Total à payer</strong>
        <strong class="co-total-amt">${totalFmt} DZD</strong>
      </div>
    </div>

    <!-- Onglets méthodes de paiement -->
    <div class="co-tabs">
      <button class="co-tab active" data-method="ccp_virement" onclick="_checkoutTab('ccp_virement')">🏦 CCP Virement</button>
      <button class="co-tab" data-method="baridimob" onclick="_checkoutTab('baridimob')">📱 BaridiMob</button>
      <button class="co-tab" data-method="code_prepaye" onclick="_checkoutTab('code_prepaye')">🎟️ Code Prépayé</button>
    </div>

    <!-- Panel CCP Virement -->
    <div class="co-panel" data-panel="ccp_virement">
      <div class="co-bank-info">
        <div class="co-bank-row"><span>Numéro CCP</span><strong>0000000 0000000 / Clé 00</strong></div>
        <div class="co-bank-row"><span>Au nom de</span><strong>Al Handassa.dz</strong></div>
        <div class="co-bank-row"><span>Montant exact</span><strong>${totalFmt} DZD</strong></div>
      </div>
      <p class="co-instructions">Effectuez le virement CCP puis saisissez votre numéro de reçu de virement :</p>
      <input id="co-reference" class="co-input" type="text" placeholder="Ex: RV-2024-12345" maxlength="60"/>
      <button id="co-submit-btn" class="btn btn-primary btn-full co-submit"
        onclick="_submitCheckout('${order.id}','ccp_virement')">✅ Confirmer le paiement</button>
    </div>

    <!-- Panel BaridiMob -->
    <div class="co-panel" data-panel="baridimob" style="display:none">
      <div class="co-bank-info">
        <div class="co-bank-row"><span>Application</span><strong>BaridiMob / Edahabia</strong></div>
        <div class="co-bank-row"><span>N° Bénéficiaire</span><strong>0799 000 000</strong></div>
        <div class="co-bank-row"><span>Montant exact</span><strong>${totalFmt} DZD</strong></div>
      </div>
      <p class="co-instructions">Envoyez le montant via BaridiMob et saisissez la référence de transaction :</p>
      <input id="co-reference" class="co-input" type="text" placeholder="Ex: BM-20241201-XXXXX" maxlength="60"/>
      <button id="co-submit-btn" class="btn btn-primary btn-full co-submit"
        onclick="_submitCheckout('${order.id}','baridimob')">✅ Confirmer le paiement</button>
    </div>

    <!-- Panel Code Prépayé -->
    <div class="co-panel" data-panel="code_prepaye" style="display:none">
      <p class="co-instructions">Saisissez votre code prépayé Al Handassa.dz :</p>
      <input id="co-prepaid-code" class="co-input" type="text" placeholder="Ex: HDZ-XXXX-XXXX-XXXX" maxlength="30" style="text-transform:uppercase;letter-spacing:2px"/>
      <button id="co-submit-btn" class="btn btn-primary btn-full co-submit"
        onclick="_submitCheckout('${order.id}','code_prepaye')">🎟️ Activer le code</button>
    </div>
  </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', e => { if (e.target === modal) _closeCheckout(); });
}

// ── DASHBOARD UTILISATEUR ────────────────────────────────────────────────────

async function showMyDownloads() {
  document.getElementById('user-dropdown')?.classList.remove('open');
  if (!Auth.isLoggedIn()) return;

  const modal = document.createElement('div');
  modal.className = 'sub-overlay';
  modal.innerHTML = `<div class="sub-box" style="max-width:540px"><button class="sub-close" onclick="this.closest('.sub-overlay').remove();document.body.style.overflow=''">✕</button>
    <h2 style="font-size:1.2rem;font-weight:800;color:#1B3A6B;margin:0 0 18px">⬇️ Mes Téléchargements</h2>
    <div id="my-dl-list"><div style="text-align:center;padding:30px;color:#94a3b8">⏳ Chargement…</div></div>
  </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); document.body.style.overflow = ''; } });

  try {
    const res = await api.myPurchases();
    const list = document.getElementById('my-dl-list');
    if (!res.data?.length) {
      list.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px">Aucun achat pour l\'instant.<br><small>Consultez notre catalogue pour commencer.</small></p>';
      return;
    }
    list.innerHTML = `<div class="co-dl-list">${res.data.map(p => `
      <div class="co-dl-item">
        <div class="co-dl-info">
          <span class="co-dl-icon">${p.type === 'ouvrage' ? '📚' : p.type === 'document_word' ? '📋' : '📄'}</span>
          <span class="co-dl-title">${p.title}</span>
        </div>
        ${p.has_file
          ? `<button class="co-dl-btn" onclick="secureDownload('${p.id}','${p.title.replace(/'/g,"\\'").replace(/"/g,"&quot;")}')">⬇️ Télécharger</button>`
          : '<span class="co-dl-soon">📩 Livraison sous 24h</span>'}
      </div>`).join('')}</div>`;
  } catch (err) {
    document.getElementById('my-dl-list').innerHTML = `<p style="color:#dc2626;text-align:center">${err.message}</p>`;
  }
}

async function showMySubscription() {
  document.getElementById('user-dropdown')?.classList.remove('open');
  if (!Auth.isLoggedIn()) return;

  const modal = document.createElement('div');
  modal.className = 'sub-overlay';
  modal.innerHTML = `<div class="sub-box" style="max-width:480px"><button class="sub-close" onclick="this.closest('.sub-overlay').remove();document.body.style.overflow=''">✕</button>
    <h2 style="font-size:1.2rem;font-weight:800;color:#1B3A6B;margin:0 0 18px">💳 Mon Abonnement</h2>
    <div id="my-sub-content"><div style="text-align:center;padding:30px;color:#94a3b8">⏳ Chargement…</div></div>
  </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); document.body.style.overflow = ''; } });

  try {
    const res = await api.mySubscription();
    const plan = res.current_plan || 'free';
    const expires = res.expires_at ? new Date(res.expires_at) : null;
    const isActive = plan !== 'free' && expires && expires > new Date();
    const p = SUB_PLANS[plan] || SUB_PLANS.free;
    const expiresStr = expires ? expires.toLocaleDateString('fr-DZ', { day:'numeric', month:'long', year:'numeric' }) : '—';
    const daysLeft = expires ? Math.ceil((expires - new Date()) / (1000 * 60 * 60 * 24)) : 0;

    document.getElementById('my-sub-content').innerHTML = `
      <div class="sub-status-card ${isActive ? 'active' : 'inactive'}">
        <div class="sub-status-icon">${p.icon}</div>
        <div class="sub-status-info">
          <div class="sub-status-plan">Plan ${p.name}</div>
          <div class="sub-status-expires">${isActive ? `Expire le ${expiresStr} (${daysLeft} jours)` : plan === 'free' ? 'Plan gratuit' : 'Expiré'}</div>
        </div>
        <div class="sub-status-badge ${isActive ? 'badge-active' : 'badge-free'}">${isActive ? '✅ Actif' : plan === 'free' ? 'Gratuit' : '❌ Expiré'}</div>
      </div>
      ${isActive ? `
        <button class="btn btn-outline" style="width:100%;margin-top:12px;font-size:13px"
          onclick="if(confirm('Annuler le renouvellement automatique ?'))api.cancelSubscription().then(()=>showToast('Annulation confirmée','success')).catch(e=>showToast(e.message,'error'))">
          ⚠️ Annuler le renouvellement
        </button>` : `
        <button class="btn btn-primary" style="width:100%;margin-top:16px"
          onclick="this.closest('.sub-overlay').remove();document.body.style.overflow='';openSubscriptionModal('standard')">
          ⭐ Renouveler mon abonnement
        </button>`}`;
  } catch (err) {
    document.getElementById('my-sub-content').innerHTML = `<p style="color:#dc2626;text-align:center">${err.message}</p>`;
  }
}

// ── SUBSCRIPTION MODAL ───────────────────────────────────────────────────────

const SUB_PLANS = {
  free:     { name: 'Gratuit',      icon: '🎁', monthly: 0,    annual: 0 },
  standard: { name: 'Standard',     icon: '🚀', monthly: 990,  annual: 8900 },
  pro:      { name: 'Pro Ingénieur',icon: '🏆', monthly: 2490, annual: 22500 },
};

function _closeSubModal() {
  document.getElementById('sub-modal')?.remove();
  document.body.style.overflow = '';
}

function _subToggleCycle(plan) {
  const modal = document.getElementById('sub-modal');
  if (!modal) return;
  const isAnnual = modal.dataset.cycle === 'annual';
  modal.dataset.cycle = isAnnual ? 'monthly' : 'annual';
  const cycle = modal.dataset.cycle;
  const p = SUB_PLANS[plan];
  const price = p[cycle];
  const periodTxt = cycle === 'annual' ? '/ an' : '/ mois';
  modal.querySelector('.sub-price-amount').textContent = price === 0 ? 'Gratuit' : `${price.toLocaleString('fr-DZ')} DZD`;
  modal.querySelector('.sub-price-period').textContent = periodTxt;
  modal.querySelector('.sub-toggle-btn').textContent = cycle === 'annual'
    ? '📅 Passer en mensuel' : '💰 Passer en annuel (−25%)';
  modal.querySelector('.sub-save-badge').style.display = cycle === 'annual' ? 'inline-block' : 'none';
}

function _subSelectMethod(method) {
  const modal = document.getElementById('sub-modal');
  if (!modal) return;
  modal.querySelectorAll('.sub-method-btn').forEach(b => b.classList.toggle('active', b.dataset.method === method));
  modal.querySelectorAll('.sub-method-panel').forEach(p => p.style.display = p.dataset.panel === method ? '' : 'none');
}

async function _submitSubscription(plan) {
  const modal = document.getElementById('sub-modal');
  if (!modal) return;
  const cycle = modal.dataset.cycle || 'monthly';
  const activeMethod = modal.querySelector('.sub-method-btn.active')?.dataset.method || 'ccp_virement';
  const reference = modal.querySelector('.sub-ref-input')?.value.trim() || '';
  const code = modal.querySelector('.sub-code-input')?.value.trim() || '';
  const btn = modal.querySelector('.sub-submit-btn');
  if (!btn) return;
  btn.disabled = true; btn.textContent = '⏳ Traitement…';

  try {
    // 1. Créer l'abonnement (commande)
    const subRes = await api.createSubscription(plan, cycle, activeMethod);
    const orderId = subRes.order_id;

    // 2. Valider le paiement
    if (activeMethod === 'code_prepaye') {
      await api.redeemPrepaid(code);
    } else {
      await api.manualPayment(orderId, activeMethod, reference, '');
    }

    // 3. Succès — afficher confirmation
    _showSubSuccess(plan, cycle);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '✅ Confirmer l\'abonnement';
    showToast(err.message, 'error');
  }
}

function _showSubSuccess(plan, cycle) {
  const modal = document.getElementById('sub-modal');
  if (!modal) return;
  const p = SUB_PLANS[plan];
  const price = p[cycle];
  const months = cycle === 'annual' ? 12 : 1;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + months);
  const expiresStr = expires.toLocaleDateString('fr-DZ', { day:'numeric', month:'long', year:'numeric' });

  modal.innerHTML = `
  <div class="sub-box sub-success">
    <div class="sub-success-icon">${p.icon}</div>
    <h2 class="sub-success-title">Abonnement activé !</h2>
    <div class="sub-success-plan">${p.name}</div>
    <p class="sub-success-desc">
      Votre abonnement ${p.name} est actif jusqu'au<br>
      <strong>${expiresStr}</strong>
    </p>
    <div class="sub-success-perks">
      ${plan === 'standard' ? `
        <div class="sub-perk">✅ Téléchargements illimités</div>
        <div class="sub-perk">✅ 50+ ouvrages numériques</div>
        <div class="sub-perk">✅ Normes DTR/RPA complètes</div>` : plan === 'pro' ? `
        <div class="sub-perk">✅ Tout le plan Standard</div>
        <div class="sub-perk">✅ 200+ publications scientifiques</div>
        <div class="sub-perk">✅ Webinaires live & Certificat</div>` : ''}
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:20px" onclick="_closeSubModal();location.reload()">
      🚀 Accéder à ma bibliothèque
    </button>
  </div>`;
}

async function openSubscriptionModal(plan) {
  // Plan gratuit → juste ouvrir le login ou un message
  if (plan === 'free') {
    if (!Auth.isLoggedIn()) {
      document.getElementById('auth-modal')?.classList.add('show');
      document.body.style.overflow = 'hidden';
    } else {
      showToast('✅ Vous bénéficiez déjà du plan gratuit !', 'info');
      document.querySelector('#pricing')?.scrollIntoView({ behavior:'smooth' });
    }
    return;
  }

  if (!Auth.isLoggedIn()) {
    showToast('🔐 Connectez-vous pour vous abonner.', 'warning');
    document.getElementById('auth-modal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    return;
  }

  // Vérifier si déjà abonné
  try {
    const sub = await api.mySubscription();
    const currentPlan = sub.current_plan || 'free';
    const expires = sub.expires_at ? new Date(sub.expires_at) : null;
    if (currentPlan === plan && expires && expires > new Date()) {
      showToast(`✅ Vous êtes déjà abonné au plan ${plan} jusqu'au ${expires.toLocaleDateString('fr-DZ')} !`, 'info');
      return;
    }
  } catch {}

  const p = SUB_PLANS[plan];
  const defaultCycle = state.billingCycle || 'monthly';
  const price = p[defaultCycle];
  const periodTxt = defaultCycle === 'annual' ? '/ an' : '/ mois';

  const existing = document.getElementById('sub-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'sub-modal';
  modal.className = 'sub-overlay';
  modal.dataset.cycle = defaultCycle;
  modal.innerHTML = `
  <div class="sub-box">
    <button class="sub-close" onclick="_closeSubModal()">✕</button>

    <!-- En-tête plan -->
    <div class="sub-plan-header">
      <span class="sub-plan-icon">${p.icon}</span>
      <div>
        <div class="sub-plan-name">Plan ${p.name}</div>
        <div class="sub-plan-tagline">${plan === 'standard' ? 'Pour les étudiants actifs' : 'Pour professionnels & master'}</div>
      </div>
    </div>

    <!-- Prix + toggle cycle -->
    <div class="sub-pricing-block">
      <div class="sub-price-display">
        <span class="sub-price-amount">${price === 0 ? 'Gratuit' : `${price.toLocaleString('fr-DZ')} DZD`}</span>
        <span class="sub-price-period">${periodTxt}</span>
      </div>
      <div class="sub-save-badge" style="display:${defaultCycle==='annual'?'inline-block':'none'}">🎉 Économisez 25%</div>
      <button class="sub-toggle-btn" onclick="_subToggleCycle('${plan}')">
        ${defaultCycle === 'annual' ? '📅 Passer en mensuel' : '💰 Passer en annuel (−25%)'}
      </button>
    </div>

    <!-- Méthodes de paiement -->
    <div class="sub-methods">
      <button class="sub-method-btn active" data-method="ccp_virement" onclick="_subSelectMethod('ccp_virement')">🏦 CCP</button>
      <button class="sub-method-btn" data-method="baridimob" onclick="_subSelectMethod('baridimob')">📱 BaridiMob</button>
      <button class="sub-method-btn" data-method="code_prepaye" onclick="_subSelectMethod('code_prepaye')">🎟️ Code</button>
    </div>

    <!-- Panel CCP -->
    <div class="sub-method-panel" data-panel="ccp_virement">
      <div class="sub-bank-info">
        <div class="sub-bank-row"><span>Numéro CCP</span><strong>0000000 0000000 / Clé 00</strong></div>
        <div class="sub-bank-row"><span>Bénéficiaire</span><strong>Al Handassa.dz</strong></div>
        <div class="sub-bank-row"><span>Montant</span><strong class="sub-price-ref">${price.toLocaleString('fr-DZ')} DZD</strong></div>
      </div>
      <p class="sub-instructions">Effectuez le virement puis saisissez le numéro de reçu :</p>
      <input class="sub-ref-input co-input" type="text" placeholder="N° reçu de virement CCP" maxlength="60"/>
    </div>

    <!-- Panel BaridiMob -->
    <div class="sub-method-panel" data-panel="baridimob" style="display:none">
      <div class="sub-bank-info">
        <div class="sub-bank-row"><span>Application</span><strong>BaridiMob / Edahabia</strong></div>
        <div class="sub-bank-row"><span>N° Bénéficiaire</span><strong>0799 000 000</strong></div>
        <div class="sub-bank-row"><span>Montant</span><strong class="sub-price-ref">${price.toLocaleString('fr-DZ')} DZD</strong></div>
      </div>
      <p class="sub-instructions">Envoyez le montant via BaridiMob puis saisissez la référence :</p>
      <input class="sub-ref-input co-input" type="text" placeholder="Référence transaction BaridiMob" maxlength="60"/>
    </div>

    <!-- Panel Code -->
    <div class="sub-method-panel" data-panel="code_prepaye" style="display:none">
      <p class="sub-instructions">Saisissez votre code d'abonnement Al Handassa.dz :</p>
      <input class="sub-code-input co-input" type="text" placeholder="HDZ-XXXX-XXXX-XXXX"
        maxlength="30" style="text-transform:uppercase;letter-spacing:2px"/>
    </div>

    <button class="sub-submit-btn btn btn-primary btn-full" onclick="_submitSubscription('${plan}')">
      ✅ Confirmer l'abonnement
    </button>
    <p class="sub-fine-print">🔒 Paiement sécurisé · Annulation à tout moment · Accès immédiat</p>
  </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', e => { if (e.target === modal) _closeSubModal(); });
}

// ── PRICING TOGGLE ────────────────────────────────────────────────────────────
const prices = { free: { monthly:0, annual:0 }, standard: { monthly:990, annual:8900 }, pro: { monthly:2490, annual:22500 } };

function initPricingToggle() {
  document.getElementById('billing-toggle')?.addEventListener('click', () => {
    state.billingCycle = state.billingCycle === 'monthly' ? 'annual' : 'monthly';
    document.getElementById('billing-toggle')?.classList.toggle('annual');
    updatePrices();
  });
}

function updatePrices() {
  document.querySelectorAll('[data-plan]').forEach(el => {
    const plan = el.dataset.plan;
    const price = prices[plan]?.[state.billingCycle];
    if (price !== undefined) el.textContent = price === 0 ? 'Gratuit' : price.toLocaleString('fr-DZ');
  });
  const txt = state.billingCycle === 'monthly' ? '/ mois' : '/ an';
  ['price-period-standard','price-period-pro'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = txt; });
  document.getElementById('toggle-monthly')?.classList.toggle('active', state.billingCycle === 'monthly');
  document.getElementById('toggle-annual')?.classList.toggle('active', state.billingCycle === 'annual');
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  toast.style.borderLeft = `4px solid ${{success:'#16a34a',error:'#dc2626',info:'#1B3A6B',warning:'#d97706'}[type] || '#1B3A6B'}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'📢'}</span><span>${message}</span>`;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}

// ── SCROLL ANIMATIONS ─────────────────────────────────────────────────────────
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.product-card, .video-card, .article-card, .level-card, .pricing-card, .testimonial-card, .payment-card').forEach(el => {
    if (el.style.opacity !== '1') {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      obs.observe(el);
    }
  });
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function animateHeroBars() {
  setTimeout(() => {
    document.querySelectorAll('.hcard-fill').forEach(bar => {
      bar.style.width = bar.dataset.width || '75%';
    });
  }, 600);
}

function animateCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      let current = 0;
      const step = target / (2000 / 16);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current).toLocaleString('fr-DZ') + suffix;
        if (current >= target) clearInterval(timer);
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('[data-count]').forEach(c => observer.observe(c));
}

// ── SMOOTH SCROLL ─────────────────────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); document.getElementById('nav-links')?.classList.remove('open'); }
    });
  });
}

// ── PAYMENT DEMO ──────────────────────────────────────────────────────────────
function initPayment() {
  document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', function () {
      const method = this.querySelector('.payment-name')?.textContent;
      showToast(`💳 ${method} — Intégration disponible`, 'info');
    });
  });
}

// ── BACK TO TOP ───────────────────────────────────────────────────────────────
document.getElementById('back-top')?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNavbar();
  initHamburger();
  initCart();
  initFilters();
  initModal();
  initPricingToggle();
  initSmoothScroll();
  animateHeroBars();
  loadLevelCards(); // Chargement dynamique des cartes niveaux depuis la DB
  animateCounters();
  initForms();
  initPayment();
  updateCartBadge();

  // Appliquer la langue sauvegardée au chargement
  setLanguage(state.lang);

  // Fermer le dropdown langue si clic en dehors
  document.addEventListener('click', e => {
    const dd = document.getElementById('lang-dropdown');
    if (dd && !dd.contains(e.target)) dd.classList.remove('open');
  });

  // Chargement asynchrone des sections dynamiques
  loadProducts();
  loadVideos();
  loadLogiciels();
  loadArticles();
  initScrollAnimations();
});
