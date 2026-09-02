/**
 * seed-beton-deco.js
 * Insère les tutoriels vidéo sur le béton décoratif
 * (béton ciré, désactivé, balayé, imprimé, poli)
 *
 * Usage :
 *   node backend/seed-beton-deco.js            -- dry-run
 *   node backend/seed-beton-deco.js --insert   -- insère en base
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ──────────────────────────────────────────────────────────────────────────────
// Épisodes — béton décoratif
// ──────────────────────────────────────────────────────────────────────────────
const VIDEOS = [

  // ── BÉTON CIRÉ ─────────────────────────────────────────────────────────────
  {
    yt: 'Z-ozkIRxROc',
    title: 'Appliquer du béton ciré de A à Z',
    description: "Tutoriel complet sur l'application du béton ciré : préparation du support, application des couches d'enduit, ponçage, cire de finition et protection. Toutes les étapes expliquées pour un résultat professionnel.",
    tags: ['béton ciré', 'enduit décoratif', 'sol', 'mur', 'tuto', 'finition'],
    duration: 1500,
    source: 'Béton Décoratif',
  },
  {
    yt: 'YKK1Wg9nvhw',
    title: 'Réaliser un béton ciré au sol et au mur — Tuto bricolage',
    description: "Tutoriel pas à pas pour appliquer un béton ciré sur sol et sur mur. Robert vous guide à travers les étapes de préparation, d'application et de finition pour un résultat durable et esthétique.",
    tags: ['béton ciré', 'sol', 'mur', 'bricolage', 'tuto', 'finition intérieure'],
    duration: 1200,
    source: 'Béton Décoratif',
  },
  {
    yt: '6md8jZV3FoA',
    title: 'Comment réaliser un béton ciré soi-même ? — Conseils d\'expert',
    description: "Les 4 étapes clés pour réussir son béton ciré : choix du support, primaire d'accrochage, application de l'enduit en 2 couches croisées, ponçage intermédiaire et vernis de protection. Explications d'un professionnel.",
    tags: ['béton ciré', 'conseils expert', 'technique', 'finition', 'DIY'],
    duration: 900,
    source: 'Béton Décoratif',
  },
  {
    yt: 'w3yhJU33aAE',
    title: 'Béton ciré sur sol, mur et escalier — Application complète',
    description: "Démonstration complète d'application de béton ciré sur différents supports : sol, mur et escalier. Techniques d'enduisage, joints et finitions pour chaque type de surface.",
    tags: ['béton ciré', 'sol', 'mur', 'escalier', 'application', 'technique'],
    duration: 1800,
    source: 'Béton Décoratif',
  },
  {
    yt: 'YRGyN-GFMRk',
    title: 'Béton ciré sur plan de travail cuisine — Tutoriel DIY',
    description: "Comment transformer un plan de travail cuisine avec du béton ciré prêt à l'emploi : dégraissage, primaire, 2 couches d'enduit, ponçage et protection. Résultat professionnel en quelques heures.",
    tags: ['béton ciré', 'plan de travail', 'cuisine', 'DIY', 'rénovation'],
    duration: 1200,
    source: 'Arcane-Industrie',
  },
  {
    yt: 'wO0lAXyp_yY',
    title: 'Béton ciré prêt à l\'emploi Efectto Quartz sur mur — Pas à pas',
    description: "Tutoriel détaillé pour appliquer le béton ciré microcement Efectto Quartz sur mur : préparation, primaire, 2 couches d'enduit coloré, ponçage et vernis de finition. Produit professionnel.",
    tags: ['béton ciré', 'microcement', 'mur', 'Efectto', 'professionnel', 'application'],
    duration: 1500,
    source: 'Béton Décoratif',
  },
  {
    yt: 'WmjT5c_3Ox0',
    title: 'Enduit béton ciré BÉTON DÉCO — Application sur mur',
    description: "Pose d'un enduit effet béton ciré sur mur intérieur : du choix de la couleur à l'application finale. Techniques de projection, talochage et finition pour un rendu béton authentique.",
    tags: ['béton ciré', 'enduit', 'mur', 'intérieur', 'couleur', 'décoration'],
    duration: 900,
    source: 'Béton Décoratif',
  },
  {
    yt: '4w9sApeF95w',
    title: 'MineralSol — Application facile du béton ciré en kit',
    description: "Tutoriel en 9 étapes pour appliquer un kit béton ciré all-in-one sur sol : nettoyage, primaire, deux passes d'enduit, ponçage intermédiaire, vernis de protection. Solution simplifiée.",
    tags: ['béton ciré', 'kit', 'sol', 'application', 'tuto', '9 étapes'],
    duration: 1200,
    source: 'Béton Décoratif',
  },
  {
    yt: 'BAQAt9hf3I8',
    title: 'Béton ciré sur mur et plan lavabo — Tuto Robert Longechal',
    description: "Application du béton ciré sur un mur de salle de bain et un plan lavabo. Gestion des zones humides, angles et finitions résistantes à l'eau. Démonstration pas à pas.",
    tags: ['béton ciré', 'salle de bain', 'mur', 'lavabo', 'humidité', 'bricolage'],
    duration: 1100,
    source: 'Béton Décoratif',
  },

  // ── BÉTON DÉSACTIVÉ ────────────────────────────────────────────────────────
  {
    yt: 'sEOb5IHOH9w',
    title: 'Sol en béton désactivé — Réalisation en 3 étapes',
    description: "Comment réaliser un sol en béton désactivé en 3 étapes : préparer (coffrage, treillis), bétonner (coulage, talochage) et désactiver (application du désactivant, lavage au jet). Résultat aspect granulat.",
    tags: ['béton désactivé', 'sol décoratif', 'extérieur', 'coulage', 'désactivant', 'granulat'],
    duration: 900,
    source: 'Béton Décoratif',
  },
  {
    yt: 't-3t0ARRrzY',
    title: 'Comment réaliser un sol en béton désactivé ? — Weber',
    description: "Guide professionnel Weber pour la réalisation d'un sol en béton désactivé : dosage du béton, coulage, application du désactivant Weber, délai de prise, lavage et finition. Produits spécialisés.",
    tags: ['béton désactivé', 'Weber', 'professionnel', 'dosage', 'sol extérieur', 'allée'],
    duration: 480,
    source: 'Les Tutos Weber',
  },
  {
    yt: 'D1dBvzkR2gY',
    title: 'Réaliser un béton désactivé avec SikaCem Désactivant',
    description: "Tutoriel officiel Sika pour réaliser un béton désactivé esthétique et antidérapant : application du SikaCem Désactivant, temps d'attente, lavage au jet haute pression, résultat granulat apparent.",
    tags: ['béton désactivé', 'Sika', 'désactivant', 'antidérapant', 'extérieur', 'terrasse'],
    duration: 360,
    source: 'Béton Décoratif',
  },
  {
    yt: 'tkI_klgrcYM',
    title: 'Comment faire du béton désactivé — Dosage et technique maçonnerie',
    description: "Explication du dosage correct pour le béton désactivé, choix des granulats, application du produit désactivant, timing de séchage et lavage. Conseils pratiques d'un maçon professionnel.",
    tags: ['béton désactivé', 'dosage', 'maçonnerie', 'granulat', 'technique', 'chantier'],
    duration: 600,
    source: 'Béton Décoratif',
  },
  {
    yt: 'MD9-T2HtUxE',
    title: 'Béton désactivé avec pose de pavés — Étape par étape',
    description: "Réalisation complète d'une allée en béton désactivé avec pose de pavés délimiteurs : terrassement, mise en oeuvre du treillis, coulage, désactivant et lavage. Chantier réel filmé en détail.",
    tags: ['béton désactivé', 'pavés', 'allée', 'chantier', 'coulage', 'étapes'],
    duration: 1800,
    source: 'Béton Décoratif',
  },
  {
    yt: 'RrzcAhd3QAE',
    title: 'Dalle béton désactivé pour terrasse — De A à Z',
    description: "Réalisation d'une dalle en béton désactivé pour terrasse : préparation du sol, coffrage, mise en place du treillis soudé, coulage du béton, vibrage et application du désactivant.",
    tags: ['béton désactivé', 'dalle', 'terrasse', 'treillis', 'coffrage', 'coulage'],
    duration: 1500,
    source: 'Béton Décoratif',
  },

  // ── BÉTON BALAYÉ ───────────────────────────────────────────────────────────
  {
    yt: 'A1zFrQX2qb8',
    title: 'Béton strié ou balayé — Étapes et méthode',
    description: "Technique du béton balayé (strié) : application du béton frais, timing pour le balayage, direction des stries, outils utilisés et conseils pour une texture régulière et antidérapante.",
    tags: ['béton balayé', 'béton strié', 'trottoir', 'antidérapant', 'finition', 'technique'],
    duration: 600,
    source: 'Béton Décoratif',
  },
  {
    yt: 'LLRPGAZnzWc',
    title: 'Comment faire un béton balayé — Technique pratique chantier',
    description: "Démonstration terrain d'un béton balayé : choix du bon moment après coulage, technique de balayage, profondeur des stries et finition des bords. Conseils d'un professionnel en chantier réel.",
    tags: ['béton balayé', 'chantier', 'trottoir', 'finition', 'pratique', 'technique'],
    duration: 720,
    source: 'Béton Décoratif',
  },
  {
    yt: 'OJ1URTQIDMo',
    title: 'Trottoir en béton balayé — Coulage et finition',
    description: "Réalisation d'un trottoir en béton balayé : coffrage, armature, coulage du béton, mise en place et réalisation des stries au balai. Résultat antidérapant pour usage piéton.",
    tags: ['béton balayé', 'trottoir', 'coffrage', 'coulage', 'armature', 'finition'],
    duration: 900,
    source: 'Béton Décoratif',
  },

  // ── BÉTON IMPRIMÉ ──────────────────────────────────────────────────────────
  {
    yt: 'hhOwXaq_MNs',
    title: 'Réalisation d\'un béton imprimé — Tuto complet',
    description: "Principe et mise en oeuvre du béton imprimé (béton matricé) : application du béton, dépôt de la couleur de surface, impression avec les matrices, application du désactivant et lavage. Finition professionnelle.",
    tags: ['béton imprimé', 'béton matricé', 'matrices', 'couleur', 'extérieur', 'terrasse'],
    duration: 1200,
    source: 'Béton Décoratif',
  },
  {
    yt: 'NbQ4T425fTU',
    title: 'Béton imprimé — Tutoriel béton empreinte',
    description: "Mise en oeuvre du béton empreinte (imprimé) : dosage du béton, épandage du primaire colorant, mise en place et pressage des moules, application du désactivant, lavage et finition au vernis.",
    tags: ['béton imprimé', 'empreinte', 'moule', 'colorant', 'vernis', 'allée'],
    duration: 1500,
    source: 'Béton Décoratif',
  },
  {
    yt: 'd9ZkC119vn8',
    title: 'Comment réaliser un béton imprimé ?',
    description: "Guide complet pour réaliser un béton imprimé : préparation du sol, coulage du béton renforcé, application de la poudre de quartz coloré, impression avec les moules caoutchouc, finition et protection.",
    tags: ['béton imprimé', 'quartz coloré', 'moule', 'réalisation', 'terrasse', 'allée'],
    duration: 900,
    source: 'Béton Décoratif',
  },

  // ── BÉTON POLI ─────────────────────────────────────────────────────────────
  {
    yt: 'WeEvqTZue54',
    title: 'FAQ sur le béton poli — Polissage de béton industriel',
    description: "Questions fréquentes sur le polissage de béton : différence entre béton poli et béton ciré, machines utilisées, grains de polissage (30 à 3000), durcisseurs chimiques, rendu brillant ou satiné.",
    tags: ['béton poli', 'polissage', 'sol industriel', 'machine', 'brillant', 'technique'],
    duration: 1200,
    source: 'Béton Décoratif',
  },
  {
    yt: 'OdCZdqIcJ5c',
    title: 'Comment le béton est-il poli ? — Processus complet',
    description: "Le processus de polissage du béton expliqué : meulage grossier (grains 30-60), meulage fin (100-400), polissage (800-1500), cristallisation et protection. Résultat : sol béton miroir durable.",
    tags: ['béton poli', 'polissage', 'meulage', 'cristallisation', 'sol', 'industriel'],
    duration: 900,
    source: 'Béton Décoratif',
  },
  {
    yt: 'fjY0ZAVr73Y',
    title: 'Polissage de béton aux diamants',
    description: "Démonstration du polissage de béton aux outils diamantés : segmentation des étapes de polissage, résines et plateaux diamantés, résultat brillant miroir. Technique professionnelle pour sols industriels et commerciaux.",
    tags: ['béton poli', 'diamant', 'polissage', 'sol industriel', 'professionnel', 'brillant'],
    duration: 780,
    source: 'Béton Décoratif',
  },
];

// ──────────────────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

async function getCategory(client) {
  const r = await client.query(`SELECT id FROM categories WHERE slug ILIKE '%video%' OR name_fr ILIKE '%vidéo%' LIMIT 1`);
  if (r.rows.length) return r.rows[0].id;
  const r2 = await client.query('SELECT id FROM categories ORDER BY id LIMIT 1');
  return r2.rows[0]?.id || null;
}

async function main() {
  const INSERT = process.argv.includes('--insert');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Seed Béton Décoratif — Al Handassa.dz');
  console.log(`  Mode : ${INSERT ? '⚡ INSERTION EN BASE' : '🔍 DRY-RUN (ajoutez --insert)'}`);
  console.log(`  ${VIDEOS.length} vidéos à traiter`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = await pool.connect();

  // IDs YouTube déjà en base
  const existing = await client.query(
    `SELECT video_url FROM videos WHERE video_url LIKE '%youtube%'`
  );
  const existingIds = new Set(
    existing.rows.map(r => {
      const m = r.video_url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
      return m ? m[1] : null;
    }).filter(Boolean)
  );
  console.log(`  ${existingIds.size} vidéos YouTube déjà en base\n`);

  const categoryId = await getCategory(client);
  let inserted = 0, skipped = 0;

  for (const v of VIDEOS) {
    const videoUrl = `https://www.youtube.com/watch?v=${v.yt}`;
    const thumbUrl = `https://img.youtube.com/vi/${v.yt}/hqdefault.jpg`;
    const slug     = slugify(v.title) + '-bdc';

    if (existingIds.has(v.yt)) {
      console.log(`  ⏭  [existe] ${v.title}`);
      skipped++;
      continue;
    }

    if (!INSERT) {
      console.log(`  🔍 [${v.tags[0].toUpperCase()}] ${v.title}`);
      inserted++;
      continue;
    }

    let finalSlug = slug;
    const sc = await client.query('SELECT id FROM videos WHERE slug=$1', [finalSlug]);
    if (sc.rows.length) finalSlug = slug + '-' + Date.now();

    await client.query(
      `INSERT INTO videos (
        title, slug, description, category_id, study_level,
        video_url, video_host, thumbnail_url,
        duration_seconds, is_free, language, tags, source,
        is_active, is_featured, published_at
      ) VALUES (
        $1,$2,$3,$4,'tous',
        $5,'youtube',$6,
        $7,TRUE,'fr',$8,$9,
        TRUE,FALSE,NOW()
      )`,
      [v.title, finalSlug, v.description, categoryId,
       videoUrl, thumbUrl, v.duration || null, v.tags, v.source]
    );
    console.log(`  ✅ [${v.tags[0]}] ${v.title}`);
    inserted++;
  }

  client.release();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(INSERT
    ? `  ✅ Insérés : ${inserted}  |  ⏭ Déjà en base : ${skipped}`
    : `  ${inserted} à insérer  |  ${skipped} déjà présents`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
