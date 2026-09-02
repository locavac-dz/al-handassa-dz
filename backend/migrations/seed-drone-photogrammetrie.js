/**
 * seed-drone-photogrammetrie.js
 * Crée la ressource "Drone & Photogrammétrie" dans la catégorie logiciels
 * Usage : node migrations/seed-drone-photogrammetrie.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const PRODUCT = {
  title: 'Drone & Photogrammétrie — Logiciels de Traitement',
  slug:  'drone-photogrammetrie-logiciels',
  type:  'logiciels',
  category_slug: 'logiciels',
  study_level: 'tous',
  language: 'fr',
  price: 0,
  is_free: true,
  is_featured: true,
  tags: ['drone', 'photogrammétrie', 'RTK', 'MNT', 'orthophoto', 'Pix4D', 'Metashape', 'DJI Terra', 'nuages de points', '3D', 'logiciels'],

  description: `Les logiciels incontournables pour la cartographie drone et la photogrammétrie professionnelle.

Les drones RTK + logiciels photogrammétriques permettent aujourd'hui des précisions centimétriques pour les relevés professionnels.

Cette sélection couvre l'ensemble de la chaîne drone : traitement RTK, reconstruction 3D, génération de MNT et courbes de niveau, orthophotos et modèles 3D haute résolution.`,

  metadata: {
    resource_type: 'software_guide',
    software_list: [
      {
        name: 'Pix4Dsurvey',
        icon: '🛸',
        category: 'Traitement drone RTK',
        badge: 'Précision centimétrique',
        badge_color: '#1B3A6B',
        description: 'Logiciel de référence pour le traitement de données drone RTK et la génération de produits cartographiques de haute précision. Permet de créer des MNT, courbes de niveau, orthophotos et nuages de points denses à partir de vols drone avec contrôle au sol ou RTK embarqué.',
        features: [
          'Traitement drone RTK & PPK',
          'Génération MNT & courbes de niveau',
          'Nuages de points denses',
          'Orthophotos haute résolution',
          'Rapports de précision GCP',
          'Export CAO / SIG / BIM',
        ],
        platforms: ['Windows', 'Mac'],
        price_info: 'Licence commerciale (essai gratuit)',
        url: 'https://www.pix4d.com/product/pix4dsurvey',
        url_label: 'Site officiel Pix4Dsurvey',
        trial_url: 'https://www.pix4d.com/product/pix4dsurvey',
        trial_label: 'Essai gratuit',
        level: 'intermediaire',
      },
      {
        name: 'Agisoft Metashape',
        icon: '🔷',
        category: 'Photogrammétrie professionnelle',
        badge: 'Reconstruction 3D',
        badge_color: '#c0392b',
        description: 'Solution de photogrammétrie professionnelle très utilisée dans les domaines de la topographie, de l\'archéologie et des sciences de la Terre. Permet la reconstruction 3D complète à partir de photos aériennes ou terrestres : nuages de points, maillages, textures et orthophotos de haute qualité.',
        features: [
          'Reconstruction 3D à partir de photos',
          'Nuages de points denses',
          'Maillage & texturation 3D',
          'Orthophotos & MNT',
          'Traitement GPU accéléré',
          'Compatible drone & terrestre',
        ],
        platforms: ['Windows', 'Mac', 'Linux'],
        price_info: 'Licence Standard / Pro',
        url: 'https://www.agisoft.com',
        url_label: 'Site officiel Metashape',
        trial_url: 'https://www.agisoft.com/downloads/installer/',
        trial_label: 'Télécharger (essai 30 jours)',
        level: 'intermediaire',
      },
      {
        name: 'DJI Terra',
        icon: '🟡',
        category: 'Cartographie drone DJI',
        badge: 'Orthophotos & 3D',
        badge_color: '#e67e22',
        description: 'Logiciel de planification de vol et de traitement cartographique officiel de DJI. Conçu pour les drones DJI professionnels (Phantom 4 RTK, Matrice 300, Mavic 3 Enterprise). Permet la génération d\'orthophotos, de modèles 3D et de MNT directement depuis les données de vol DJI.',
        features: [
          'Planification de vol automatique',
          'Traitement orthophoto 2D',
          'Modèles 3D & nuages de points',
          'Compatible drones DJI Pro',
          'Rapport de mission intégré',
          'Export SHP, KML, DXF',
        ],
        platforms: ['Windows'],
        price_info: 'Gratuit (version de base) / Pro payant',
        url: 'https://www.dji.com/dji-terra',
        url_label: 'Site officiel DJI Terra',
        trial_url: 'https://www.dji.com/dji-terra/downloads',
        trial_label: 'Télécharger gratuitement',
        level: 'debutant',
      },
    ],
  },
};

async function seedDronePhotogrammetrie() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const catRes = await client.query(`SELECT id FROM categories WHERE slug = 'logiciels'`);
    if (!catRes.rows.length) throw new Error('Catégorie "logiciels" introuvable.');
    const categoryId = catRes.rows[0].id;

    const instRes = await client.query(`SELECT id FROM instructors LIMIT 1`);
    const instructorId = instRes.rows[0]?.id || null;

    const existing = await client.query(
      `SELECT id FROM products WHERE slug = $1`, [PRODUCT.slug]
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE products SET
           title=$1, description=$2, metadata=$3, tags=$4, is_featured=$5, updated_at=NOW()
         WHERE slug=$6`,
        [
          PRODUCT.title,
          PRODUCT.description,
          JSON.stringify(PRODUCT.metadata),
          PRODUCT.tags,
          PRODUCT.is_featured,
          PRODUCT.slug,
        ]
      );
      console.log('✅ Produit mis à jour :', PRODUCT.title);
    } else {
      await client.query(
        `INSERT INTO products
           (title, slug, description, type, category_id, study_level, instructor_id,
            price, is_free, language, tags, metadata, is_featured, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE)`,
        [
          PRODUCT.title,
          PRODUCT.slug,
          PRODUCT.description,
          PRODUCT.type,
          categoryId,
          PRODUCT.study_level,
          instructorId,
          PRODUCT.price,
          PRODUCT.is_free,
          PRODUCT.language,
          PRODUCT.tags,
          JSON.stringify(PRODUCT.metadata),
          PRODUCT.is_featured,
        ]
      );
      console.log('✅ Produit créé :', PRODUCT.title);
    }

    await client.query('COMMIT');
    console.log(`\n🛸 Ressource "Drone & Photogrammétrie" : ${PRODUCT.metadata.software_list.length} logiciels intégrés`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDronePhotogrammetrie();
