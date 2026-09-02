/**
 * seed-eclairage-software.js
 * Crée la ressource "Éclairage & Lumière" dans la catégorie logiciels
 * Usage : node migrations/seed-eclairage-software.js
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
  title: 'Éclairage & Lumière — Les Références Mondiales en Étude d\'Éclairage',
  slug:  'eclairage-lumiere-logiciels',
  type:  'logiciels',
  category_slug: 'logiciels',
  study_level: 'tous',
  language: 'fr',
  price: 0,
  is_free: true,
  is_featured: true,
  tags: ['éclairage', 'DIALux', 'RELUX', 'AGi32', 'lux', 'UGR', 'éclairage public', 'BIM lumière', 'photométrie', 'simulation lumière', 'logiciels'],

  description: `Les références mondiales en étude d'éclairage pour ingénieurs, architectes et bureaux d'études techniques.

Cette sélection couvre l'ensemble des besoins en ingénierie lumière : calcul d'éclairement, simulation 3D, éclairage intérieur et extérieur, éclairage public, routes, tunnels et grands projets techniques.

Chaque logiciel est présenté avec son domaine d'application, ses fonctionnalités clés et un lien direct vers le site officiel.`,

  metadata: {
    resource_type: 'software_guide',
    software_list: [
      {
        name: 'DIALux Evo',
        icon: '💡',
        category: 'Calcul d\'éclairement & Simulation 3D',
        badge: 'Référence mondiale',
        badge_color: '#1B3A6B',
        description: 'Le logiciel le plus utilisé au monde pour l\'étude et le calcul d\'éclairage professionnel. Gratuit dans sa version principale, DIALux Evo couvre l\'éclairage intérieur, extérieur et public avec simulation 3D photoréaliste. Standard international dans les bureaux d\'études éclairage, architectes et ingénieurs BIM lumière.',
        features: [
          'Calcul d\'éclairement (lux) & UGR',
          'Simulation 3D photoréaliste',
          'Éclairage intérieur & extérieur',
          'Éclairage public & routes',
          'Conformité norme EN 12464',
          'Import Revit / AutoCAD / IFC (BIM lumière)',
        ],
        platforms: ['Windows'],
        price_info: '100% Gratuit (version principale)',
        url: 'https://www.dialux.com',
        url_label: 'Site officiel DIALux',
        trial_url: 'https://www.dialux.com/fr-DE/dialux',
        trial_label: 'Télécharger gratuitement',
        level: 'intermediaire',
      },
      {
        name: 'RELUX',
        icon: '🌟',
        category: 'Simulation lumière naturelle & artificielle',
        badge: 'BIM Lumière & Revit',
        badge_color: '#e63946',
        description: 'Concurrent direct de DIALux, RELUX est très apprécié pour sa simulation avancée de la lumière naturelle et artificielle. Excellent outil BIM lumière avec intégration native Revit et AutoCAD. Permet l\'analyse des capteurs de lumière du jour, du facteur de lumière du jour (FLJ) et des études photométriques complexes.',
        features: [
          'Simulation lumière naturelle & artificielle',
          'Calcul facteur lumière du jour (FLJ)',
          'Capteurs & détecteurs de présence',
          'Intégration BIM native (Revit)',
          'Compatible AutoCAD & modèles 3D',
          'Rapports conformes normes EN',
        ],
        platforms: ['Windows'],
        price_info: '100% Gratuit',
        url: 'https://relux.com/fr/',
        url_label: 'Site officiel RELUX',
        trial_url: 'https://relux.com/fr/relux-desktop/',
        trial_label: 'Télécharger gratuitement',
        level: 'intermediaire',
      },
      {
        name: 'AGi32',
        icon: '🏟️',
        category: 'Photométrie avancée & Grands projets',
        badge: 'Haut niveau professionnel',
        badge_color: '#7b2d8b',
        description: 'Logiciel professionnel de haut niveau utilisé pour les grands projets d\'éclairage techniques : routes, tunnels, stades, éclairage urbain et environnements complexes. Référence pour les ingénieurs spécialisés grâce à sa précision photométrique extrême et ses algorithmes de calcul avancés.',
        features: [
          'Calcul photométrique haute précision',
          'Éclairage routier & autoroutier',
          'Tunnels & ouvrages souterrains',
          'Stades & grands équipements sportifs',
          'Éclairage urbain & architectural',
          'Modélisation 3D avancée',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.agi32.com',
        url_label: 'Site officiel AGi32',
        trial_url: 'https://www.agi32.com/trial/',
        trial_label: 'Version d\'essai',
        level: 'avance',
      },
    ],
  },
};

async function seedEclairageSoftware() {
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
    console.log(`\n💡 Ressource "Éclairage & Lumière" : ${PRODUCT.metadata.software_list.length} logiciels intégrés`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedEclairageSoftware();
