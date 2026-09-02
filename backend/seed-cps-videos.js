/**
 * seed-cps-videos.js
 * Insère les épisodes "C'est pas sorcier" relatifs au génie civil / BTP / architecture
 * dans la table videos.
 *
 * Usage :
 *   node backend/seed-cps-videos.js            -- dry-run (affiche sans insérer)
 *   node backend/seed-cps-videos.js --insert   -- insère en base
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ──────────────────────────────────────────────────────────────────────────────
// Liste des épisodes (confirmés sur YouTube)
// ──────────────────────────────────────────────────────────────────────────────
const EPISODES = [
  // ── BÉTON / MATÉRIAUX ────────────────────────────────────────────────────
  {
    yt: '_h1fSZ180GA',
    title: "Béton : Les sorciers au pied du mur",
    description: "Comment fabrique-t-on le béton ? Ciment, eau, granulats, adjuvants... Jamy explique la chimie du béton et visite une centrale à béton. Fred assiste à un chantier de construction d'un immeuble en béton armé.",
    tags: ['béton', 'matériaux', 'construction', 'chantier', 'béton armé'],
    duration: 2700,
  },
  // ── PONTS / OUVRAGES D'ART ──────────────────────────────────────────────
  {
    yt: 'Cqo8VDyDRAE',
    title: "Viaduc de Millau : les sorciers font pont",
    description: "Le viaduc de Millau, le pont le plus haut du monde (270 m). Comment a-t-on construit ces piles géantes ? Quelles forces s'exercent sur un pont à haubans ? Fred et Jamy sur le plus grand chantier de France.",
    tags: ['pont', 'viaduc', 'millau', 'ouvrages d\'art', 'haubans', 'génie civil'],
    duration: 2600,
  },
  {
    yt: 'ujwYjL1OdQc',
    title: "Les ponts — C'est pas sorcier",
    description: "Des ponts romains aux ponts suspendus modernes : histoire et principes de construction. Arcs, poutres, haubans, câbles — comment chaque type de pont tient-il debout ?",
    tags: ['pont', 'ouvrages d\'art', 'génie civil', 'structure', 'travaux publics'],
    duration: 2600,
  },
  {
    yt: 'XM7sL6MZZcc',
    title: "Comment construire un pont ?",
    description: "Étapes de construction d'un pont moderne : études géotechniques, fondations, piles, tablier, chaussée. Toutes les techniques expliquées avec des animations claires.",
    tags: ['pont', 'construction', 'fondations', 'génie civil', 'travaux publics'],
    duration: 900,
  },
  {
    yt: 'EsCItouOhho',
    title: "À quoi les arches servent-elles ?",
    description: "L'arche, invention géniale transmise par les Romains : pourquoi cette forme permet-elle de soutenir des charges colossales ? Des arènes de Nîmes aux voûtes cathédrales.",
    tags: ['architecture', 'arche', 'structure', 'pont', 'histoire'],
    duration: 600,
  },
  {
    yt: 'EEItmFyJAKY',
    title: "Pont du Gard et Arènes de Nîmes",
    description: "Les chefs-d'œuvre de l'architecture romaine : l'aqueduc du Pont du Gard et les arènes de Nîmes. Comment les Romains construisaient-ils sans béton armé ?",
    tags: ['pont du gard', 'architecture romaine', 'aqueduc', 'arènes', 'patrimoine'],
    duration: 2600,
  },
  // ── BARRAGES / HYDRAULIQUE ───────────────────────────────────────────────
  {
    yt: 'sVtH9hEmv_Y',
    title: "Comment fonctionnent les barrages ?",
    description: "Barrages-poids, barrages-voûtes, barrages en remblai... Jamy explique les forces qui s'exercent sur un barrage et comment on retient des millions de tonnes d'eau. Visite d'un barrage hydroélectrique.",
    tags: ['barrage', 'hydraulique', 'génie civil', 'hydroélectricité', 'ouvrages d\'art'],
    duration: 900,
  },
  {
    yt: '-KWM8ztoLfA',
    title: "Quelle pression s'exerce sur les barrages ?",
    description: "Comprendre les forces de la poussée hydrostatique sur un barrage. Pourquoi les barrages sont-ils plus épais à la base ? Calculs de pression et résistance des matériaux.",
    tags: ['barrage', 'pression', 'hydraulique', 'mécanique des fluides', 'génie civil'],
    duration: 600,
  },
  // ── TUNNELS / ROUTES ─────────────────────────────────────────────────────
  {
    yt: 'QeDLBAuw030',
    title: "Tunnel sous la Manche — C'est pas sorcier",
    description: "Le chantier le plus ambitieux du XXe siècle : 50 km sous la mer entre la France et l'Angleterre. Comment a-t-on percé ce tunnel ? Tunneliers, étanchéité, ventilation — tout est expliqué.",
    tags: ['tunnel', 'génie civil', 'travaux publics', 'tunnelier', 'eurotunnel'],
    duration: 2600,
  },
  {
    yt: 'hqaGARKqgqI',
    title: "Les sorciers taillent la route",
    description: "Comment perce-t-on un tunnel de montagne ? Comment fabrique-t-on l'asphalte ? Fred visite une carrière de granulats et une centrale d'enrobage, Jamy explique les explosifs et le tunnelier.",
    tags: ['tunnel', 'route', 'autoroute', 'travaux publics', 'asphalte', 'génie civil'],
    duration: 2600,
  },
  {
    yt: '5zdoe9Bn5a4',
    title: "De quoi sont constituées les parois d'un tunnel ?",
    description: "Les couches successives qui font la robustesse d'un tunnel : roche, béton projeté, cintres métalliques, revêtement définitif. Comment garantir l'étanchéité et la sécurité ?",
    tags: ['tunnel', 'génie civil', 'structure', 'béton', 'travaux souterrains'],
    duration: 600,
  },
  {
    yt: 'kCkWw_lGugo',
    title: "Comment la forme d'un tunnel est-elle obtenue ?",
    description: "La section circulaire ou en fer à cheval — pourquoi ces formes ? Résistance aux contraintes du terrain, répartition des charges, géomécanique expliquée simplement.",
    tags: ['tunnel', 'génie civil', 'mécanique des sols', 'géomécanique'],
    duration: 600,
  },
  {
    yt: 'lBRzblVqiBg',
    title: "Comment construisons-nous les autoroutes ?",
    description: "De la conception d'un tracé autoroutier à la pose de l'asphalte final : terrassements, fondations, couches de chaussée, échangeurs, signalisation. Un chantier colossal expliqué étape par étape.",
    tags: ['autoroute', 'route', 'travaux publics', 'chaussée', 'infrastructure'],
    duration: 2600,
  },
  // ── ARCHITECTURE / BÂTIMENT ──────────────────────────────────────────────
  {
    yt: 'rRIxyik6TIU',
    title: "La Grande Arche de la Défense",
    description: "Comment a-t-on construit ce cube gigantesque de 110 mètres de côté à La Défense ? Fondations sur pieux, pré-contrainte, ascenseurs panoramiques — les secrets de ce monument moderne.",
    tags: ['architecture', 'grande arche', 'bâtiment', 'structure', 'paris'],
    duration: 2600,
  },
  {
    yt: 'rgRqXTHi9iM',
    title: "Les tours infernales",
    description: "Comment construit-on les gratte-ciel les plus hauts du monde ? Fondations profondes, structures en acier ou béton, résistance au vent et aux séismes, ascenseurs ultra-rapides.",
    tags: ['gratte-ciel', 'tour', 'bâtiment', 'structure', 'architecture', 'hauteur'],
    duration: 2600,
  },
  {
    yt: 'CR8Tnik9-K8',
    title: "Nos maisons de demain",
    description: "La maison du futur : isolation thermique, matériaux biosourcés, domotique, maisons passives et à énergie positive. Comment construira-t-on les logements de 2050 ?",
    tags: ['maison', 'construction', 'énergie', 'isolation', 'habitat', 'développement durable'],
    duration: 2600,
  },
  {
    yt: 'dEuPRQSsV30',
    title: "Pourquoi construire des logements en forme de cube ?",
    description: "Optimisation des surfaces, orientation solaire, résistance structurelle : pourquoi les formes simples dominent-elles l'architecture moderne ? Urbanisme et contraintes économiques.",
    tags: ['architecture', 'logement', 'urbanisme', 'construction', 'formes'],
    duration: 600,
  },
  // ── SÉISMES / GÉOTECHNIQUE ───────────────────────────────────────────────
  {
    yt: 'to6bJMp-FfQ',
    title: "Risque sismique : la menace d'une catastrophe",
    description: "Comment les séismes se produisent-ils ? Quelles règles parasismiques guident la construction ? Différence entre zones sismiques, calcul des structures parasismiques, renforcement des bâtiments existants.",
    tags: ['séisme', 'parasismique', 'risque naturel', 'génie civil', 'RPA', 'structure'],
    duration: 2600,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

async function getCategory(client) {
  // Cherche une catégorie "Vidéos éducatives" ou similaire, sinon prend la première
  const r = await client.query(
    `SELECT id FROM categories WHERE slug ILIKE '%video%' OR slug ILIKE '%education%' OR name_fr ILIKE '%vidéo%' ORDER BY id LIMIT 1`
  );
  if (r.rows.length) return r.rows[0].id;
  const r2 = await client.query('SELECT id FROM categories ORDER BY id LIMIT 1');
  return r2.rows[0]?.id || null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  const INSERT = process.argv.includes('--insert');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log("  Seed C'est pas sorcier — Al Handassa.dz");
  console.log(`  Mode : ${INSERT ? '⚡ INSERTION EN BASE' : '🔍 DRY-RUN (ajoutez --insert pour insérer)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = await pool.connect();

  // Récupérer les YouTube IDs déjà présents
  const existing = await client.query(
    `SELECT video_url FROM videos WHERE video_url LIKE '%youtube%' AND source = 'C''est pas sorcier'`
  );
  const existingIds = new Set(
    existing.rows.map(r => {
      const m = r.video_url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
      return m ? m[1] : null;
    }).filter(Boolean)
  );
  console.log(`  ${existingIds.size} épisodes déjà en base\n`);

  const categoryId = await getCategory(client);

  let inserted = 0, skipped = 0;

  for (const ep of EPISODES) {
    const videoUrl = `https://www.youtube.com/watch?v=${ep.yt}`;
    const thumbUrl = `https://img.youtube.com/vi/${ep.yt}/hqdefault.jpg`;
    const slug = slugify(ep.title) + '-cps';

    if (existingIds.has(ep.yt)) {
      console.log(`  ⏭  [existe] ${ep.title}`);
      skipped++;
      continue;
    }

    if (!INSERT) {
      console.log(`  🔍 [à insérer] ${ep.title}`);
      console.log(`     YouTube : ${videoUrl}`);
      console.log(`     Tags    : ${ep.tags.join(', ')}`);
      console.log('');
      inserted++;
      continue;
    }

    // Vérifier si le slug existe déjà
    let finalSlug = slug;
    const slugCheck = await client.query('SELECT id FROM videos WHERE slug = $1', [finalSlug]);
    if (slugCheck.rows.length) finalSlug = slug + '-' + Date.now();

    await client.query(
      `INSERT INTO videos (
        title, slug, description, category_id, study_level,
        video_url, video_host, thumbnail_url,
        duration_seconds, is_free, language,
        tags, source, is_active, is_featured, published_at
      ) VALUES (
        $1, $2, $3, $4, 'tous',
        $5, 'youtube', $6,
        $7, TRUE, 'fr',
        $8, $9, TRUE, FALSE, NOW()
      )`,
      [
        ep.title,
        finalSlug,
        ep.description,
        categoryId,
        videoUrl,
        thumbUrl,
        ep.duration || null,
        ep.tags,
        "C'est pas sorcier",
      ]
    );
    console.log(`  ✅ [inséré] ${ep.title}`);
    inserted++;
  }

  client.release();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (INSERT) {
    console.log(`  ✅ Insérés  : ${inserted}`);
    console.log(`  ⏭  Ignorés  : ${skipped} (déjà en base)`);
    console.log(`\n  Vidéothèque enrichie avec ${inserted} épisodes "C'est pas sorcier" !`);
  } else {
    console.log(`  ${inserted} épisodes prêts à être insérés`);
    console.log(`  ${skipped} déjà présents en base`);
    console.log('\n  ▶ Lancez avec --insert pour insérer en base');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
