require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});

const VIDEO_ID = 'OWsOuUfTh-w';

// Sommaire — à ajuster selon les vrais timestamps de la vidéo
const CHAPTERS = [
  { time: '0:30',  seconds: 30,   title: 'Introduction & présentation du projet' },
  { time: '2:10',  seconds: 130,  title: 'Matériaux et outils nécessaires' },
  { time: '5:45',  seconds: 345,  title: 'Préparation et vérification du support' },
  { time: '10:20', seconds: 620,  title: 'Pose de la sous-couche isolante' },
  { time: '14:50', seconds: 890,  title: 'Première rangée de lames — technique de démarrage' },
  { time: '22:30', seconds: 1350, title: 'Pose des rangées suivantes — emboîtement et clipsage' },
  { time: '31:00', seconds: 1860, title: 'Découpe des lames — angle et obstacles' },
  { time: '38:45', seconds: 2325, title: 'Contournement des portes et passages' },
  { time: '44:20', seconds: 2660, title: 'Pose des plinthes et finitions' },
  { time: '50:00', seconds: 3000, title: 'Résultat final et conseils' },
];

async function main() {
  // 1. Ajouter colonne chapters si absente
  await pool.query(`ALTER TABLE videos ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'`);
  console.log('Colonne chapters OK');

  // 2. Catégorie matériaux (pose de revêtement = matériaux de construction)
  const catRes = await pool.query("SELECT id FROM categories WHERE slug='materiaux'");
  const catId = catRes.rows[0]?.id || 5;

  const slug = `poser-parquet-flottant-contrecolle-robert-${Date.now()}`;

  const exists = await pool.query("SELECT id FROM videos WHERE video_url LIKE $1", [`%${VIDEO_ID}%`]);
  if (exists.rows.length) {
    // Mise à jour du sommaire
    await pool.query(
      "UPDATE videos SET chapters=$1, updated_at=NOW() WHERE video_url LIKE $2",
      [JSON.stringify(CHAPTERS), `%${VIDEO_ID}%`]
    );
    console.log('Vidéo déjà existante — sommaire mis à jour.');
    await pool.end(); return;
  }

  await pool.query(`
    INSERT INTO videos
      (title, slug, description, category_id, study_level, duration_seconds,
       video_url, video_host, thumbnail_url, price, is_free, is_active,
       language, tags, chapters, views_count, source, published_at, created_at, updated_at)
    VALUES ($1,$2,$3,$4,'debutant',$5,$6,'youtube',$7,0,true,true,'fr',$8,$9,0,$10,NOW(),NOW(),NOW())
  `, [
    'Poser du Parquet Flottant Contrecollé — Tuto Complet',
    slug,
    `Tutoriel complet animé par Robert Longechal pour apprendre à poser un parquet flottant contrecollé de A à Z.
Idéal pour les étudiants en génie civil, les conducteurs de travaux et les professionnels du bâtiment souhaitant maîtriser les techniques de pose de revêtements de sol.
Couvre la préparation du support, la sous-couche, l'emboîtement des lames, les découpes complexes et les finitions.`,
    catId,
    3180, // ~53 min
    `https://www.youtube.com/watch?v=${VIDEO_ID}&t=30s`,
    `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`,
    ['parquet flottant', 'contrecollé', 'pose parquet', 'revêtement sol', 'bricolage BTP', 'finitions', 'matériaux'],
    JSON.stringify(CHAPTERS),
    'Robert Longechal',
  ]);

  console.log('Vidéo insérée avec sommaire (', CHAPTERS.length, 'chapitres).');
  await pool.end();
}
main().catch(e=>{console.error(e.message);pool.end();});
