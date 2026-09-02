require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD
});

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,80);
}

const VIDEOS = [
  {
    title: 'TP Laboratoire — Analyse Granulométrique des Granulats',
    description: 'Travaux pratiques de laboratoire : réalisation complète d\'une analyse granulométrique par tamisage des granulats (sable et gravier). Détermination de la courbe granulométrique, du module de finesse et interprétation des résultats selon les normes en vigueur.',
    file: 'labo-analyse_granulo.mp4',
    duration_seconds: 12 * 60,
    study_level: 'debutant',
    category_slug: 'materiaux',
    tags: ['granulométrie', 'tamisage', 'granulats', 'sable', 'TP laboratoire', 'matériaux'],
  },
  {
    title: 'TP Laboratoire — Essai au Bleu de Méthylène (Valeur de Bleu)',
    description: 'Travaux pratiques : détermination de la valeur de bleu de méthylène (VB) d\'un sol ou d\'un granulat. Identification de la teneur en argile et en fines argileuses — essai normalisé NF EN 933-9.',
    file: 'labo-bleu.mp4',
    duration_seconds: 8 * 60,
    study_level: 'intermediaire',
    category_slug: 'materiaux',
    tags: ['bleu de méthylène', 'valeur de bleu', 'argile', 'granulats', 'TP laboratoire', 'sol'],
  },
  {
    title: 'TP Laboratoire — Essai de Compression du Béton',
    description: 'Travaux pratiques : essai de compression sur éprouvettes cylindriques de béton (16x32 cm). Confection des éprouvettes, conservation, surfaçage et rupture à la presse. Détermination de la résistance caractéristique fc28.',
    file: 'labo-compression.mp4',
    duration_seconds: 10 * 60,
    study_level: 'debutant',
    category_slug: 'beton-arme',
    tags: ['compression béton', 'éprouvette', 'fc28', 'résistance', 'TP laboratoire', 'béton'],
  },
  {
    title: 'TP Laboratoire — Essai Équivalent de Sable',
    description: 'Travaux pratiques : mesure de la propreté d\'un sable par l\'essai équivalent de sable (ES). Détermination de l\'indice de propreté par la valeur d\'équivalent de sable — conforme à la norme NF EN 933-8.',
    file: 'labo-equivalent_sable.mp4',
    duration_seconds: 9 * 60,
    study_level: 'debutant',
    category_slug: 'materiaux',
    tags: ['équivalent de sable', 'propreté sable', 'ES', 'granulats', 'TP laboratoire'],
  },
  {
    title: 'TP Laboratoire — Essai de Fendage (Essai Brésilien)',
    description: 'Travaux pratiques : essai de traction indirecte par fendage (essai brésilien) sur éprouvettes cylindriques de béton. Détermination de la résistance à la traction par fendage ft — norme NF EN 12390-6.',
    file: 'labo-fendage.mp4',
    duration_seconds: 7 * 60,
    study_level: 'intermediaire',
    category_slug: 'beton-arme',
    tags: ['fendage', 'essai brésilien', 'traction', 'béton', 'TP laboratoire', 'résistance'],
  },
  {
    title: 'TP Laboratoire — Masse Volumique du Ciment',
    description: 'Travaux pratiques : détermination de la masse volumique absolue du ciment au moyen du voluménomètre de Le Chatelier. Protocole complet — préparation, remplissage et lecture du volume déplacé.',
    file: 'labo-masse_ciment.mp4',
    duration_seconds: 9 * 60,
    study_level: 'debutant',
    category_slug: 'materiaux',
    tags: ['masse volumique', 'ciment', 'Le Chatelier', 'voluménomètre', 'TP laboratoire'],
  },
  {
    title: 'TP Laboratoire — Masse Volumique Absolue du Sable',
    description: 'Travaux pratiques : détermination de la masse volumique absolue du sable par la méthode du pycnomètre. Protocole normalisé pour la caractérisation des granulats fins utilisés en béton.',
    file: 'labo-masse_volumique_absolue.mp4',
    duration_seconds: 10 * 60,
    study_level: 'debutant',
    category_slug: 'materiaux',
    tags: ['masse volumique absolue', 'sable', 'pycnomètre', 'granulats', 'TP laboratoire'],
  },
  {
    title: 'TP Laboratoire — Masse Volumique Apparente du Sable',
    description: 'Travaux pratiques : détermination de la masse volumique apparente (en vrac) du sable par pesée d\'un volume connu. Valeur indispensable pour la formulation des bétons et mortiers.',
    file: 'labo-masse_volumique_apparente.mp4',
    duration_seconds: 7 * 60,
    study_level: 'debutant',
    category_slug: 'materiaux',
    tags: ['masse volumique apparente', 'sable', 'formulation béton', 'TP laboratoire', 'granulats'],
  },
  {
    title: 'TP Laboratoire — Temps de Prise du Ciment (Aiguilles de Vicat)',
    description: 'Travaux pratiques : détermination du début et de la fin de prise du ciment par l\'appareil de Vicat. Protocole complet de préparation de la pâte, suivi de la pénétration et interprétation des résultats — NF EN 196-3.',
    file: 'labo-prise.mp4',
    duration_seconds: 11 * 60,
    study_level: 'debutant',
    category_slug: 'materiaux',
    tags: ['prise ciment', 'Vicat', 'début de prise', 'fin de prise', 'TP laboratoire', 'ciment'],
  },
  {
    title: 'TP Laboratoire — Rectification des Éprouvettes de Béton',
    description: 'Travaux pratiques : rectification mécanique des faces d\'éprouvettes cylindriques de béton avant essai de compression. Technique de planéité des têtes pour garantir la précision des résultats d\'essais.',
    file: 'labo-rectification.mp4',
    duration_seconds: 6 * 60,
    study_level: 'debutant',
    category_slug: 'beton-arme',
    tags: ['rectification', 'éprouvette béton', 'planéité', 'préparation essai', 'TP laboratoire'],
  },
  {
    title: 'TP Laboratoire — Surfaçage des Éprouvettes de Béton',
    description: 'Travaux pratiques : surfaçage au soufre des têtes d\'éprouvettes cylindriques de béton. Technique de préparation des faces avant essai de compression pour assurer une répartition uniforme des contraintes.',
    file: 'labo-surfacage.mp4',
    duration_seconds: 7 * 60,
    study_level: 'debutant',
    category_slug: 'beton-arme',
    tags: ['surfaçage', 'soufre', 'éprouvette béton', 'préparation', 'TP laboratoire'],
  },
  {
    title: 'TP Laboratoire — Teneur en Eau des Matériaux',
    description: 'Travaux pratiques : détermination de la teneur en eau naturelle d\'un sol ou d\'un matériau par dessiccation à l\'étuve (105°C). Protocole normalisé — pesée avant et après séchage, calcul du rapport eau/masse sèche.',
    file: 'labo-teneur_eau.mp4',
    duration_seconds: 7 * 60,
    study_level: 'debutant',
    category_slug: 'materiaux',
    tags: ['teneur en eau', 'dessiccation', 'étuve', 'sol', 'TP laboratoire', 'matériaux'],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const catRes = await client.query('SELECT id, slug FROM categories');
    const cat = {};
    for (const r of catRes.rows) cat[r.slug] = r.id;

    const instRes = await client.query('SELECT id FROM instructors LIMIT 1');
    const instructorId = instRes.rows[0]?.id || null;

    let inserted = 0, skipped = 0;

    for (const v of VIDEOS) {
      const videoPath = `/uploads/videos/${v.file}`;
      const localPath = path.join(__dirname, 'uploads', 'videos', v.file);

      if (!fs.existsSync(localPath)) {
        console.log(`  ⚠️  Fichier introuvable : ${v.file}`);
        skipped++; continue;
      }

      const existing = await client.query('SELECT id FROM videos WHERE video_url=$1', [videoPath]);
      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Existe déjà : ${v.title}`);
        skipped++; continue;
      }

      const slug = slugify(v.title) + '-' + Date.now() + Math.floor(Math.random()*1000);
      const categoryId = cat[v.category_slug];
      if (!categoryId) { console.log(`  ⚠️  Catégorie introuvable : ${v.category_slug}`); skipped++; continue; }

      await client.query(
        `INSERT INTO videos (title, slug, description, duration_seconds, study_level, category_id,
          instructor_id, is_free, views_count, video_url, thumbnail_url, tags, source, is_featured, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,FALSE,NOW())`,
        [v.title, slug, v.description, v.duration_seconds, v.study_level, categoryId,
         instructorId, true, 0, videoPath, null, v.tags, 'TP Laboratoire CERIB']
      );
      console.log(`  ✅ Inséré : ${v.title}`);
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`\n📊 ${inserted} vidéo(s) insérée(s), ${skipped} ignorée(s)`);
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('❌', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
seed();
