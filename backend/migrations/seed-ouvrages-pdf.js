/**
 * seed-ouvrages-pdf.js
 * Ajoute deux ouvrages PDF de référence :
 *   1. La Maison de A à Z — Gérard Calvat (178p, 33.3MB)
 *   2. Guide pour la Gestion de Chantier — CCW 2012 (179p, 8.5MB)
 * Usage : node migrations/seed-ouvrages-pdf.js
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

const PRODUCTS = [
  {
    title:       'La Maison de A à Z — Le Vocabulaire de la Construction',
    slug:        'la-maison-de-a-a-z-vocabulaire-construction',
    type:        'cours_pdf',
    category_slug: 'architecture',
    study_level: 'tous',
    language:    'fr',
    price:       0,
    is_free:     true,
    is_featured: true,
    file_url:    '/uploads/products/f73751fc-f303-4085-a41b-2e8ac1497081.pdf',
    file_size_mb: 33.3,
    pages_count: 178,
    tags: [
      'vocabulaire construction', 'maison individuelle', 'maçonnerie',
      'fondations', 'charpente', 'couverture', 'plomberie', 'électricité',
      'second œuvre', 'chauffage', 'ventilation', 'gros œuvre',
      'Gérard Calvat', 'référence BTP',
    ],
    description: `Référence incontournable pour tout professionnel du bâtiment, cet ouvrage de Gérard Calvat (5e édition, Éditions Alternatives) rassemble l'ensemble du vocabulaire technique de la construction en maison individuelle et logement collectif.

Organisé en 19 chapitres thématiques, il couvre :
— Le gros œuvre : fondations, murs, planchers, toitures, charpente, couverture
— Le second œuvre : menuiseries, cloisons, revêtements de sols et murs, peintures
— Les équipements : électricité, plomberie, chauffage, ventilation, sanitaires

Chaque terme est illustré et défini avec précision, faisant de ce guide un outil de travail essentiel sur chantier et en bureau d'études.`,
    metadata: {
      resource_type: 'ouvrage_reference',
      author: 'Gérard Calvat',
      publisher: 'Éditions Alternatives',
      edition: '5e édition',
      year: 2003,
      chapters: 19,
      topics: [
        'Gros œuvre & maçonnerie',
        'Charpente & couverture',
        'Menuiseries intérieures & extérieures',
        'Cloisons & revêtements',
        'Électricité & éclairage',
        'Plomberie & sanitaires',
        'Chauffage & ventilation',
        'Vocabulaire illustré',
      ],
    },
  },
  {
    title:       'Guide pour la Gestion de Chantier — Interactif 2012',
    slug:        'guide-gestion-chantier-interactif-2012',
    type:        'cours_pdf',
    category_slug: 'beton-arme',
    study_level: 'tous',
    language:    'fr',
    price:       0,
    is_free:     true,
    is_featured: true,
    file_url:    '/uploads/products/9cc15f41-aa43-4f0f-adfc-bfae7b23718a.pdf',
    file_size_mb: 8.5,
    pages_count: 179,
    tags: [
      'gestion de chantier', 'organisation chantier', 'sécurité chantier',
      'devis', 'sous-traitance', 'réception travaux', 'déchets chantier',
      'administration BTP', 'CCW', 'marché privé', 'marché public',
      'signalisation', 'assurances chantier', 'impétrants',
    ],
    description: `Guide pratique et interactif édité par la Confédération Construction Wallonne (CCW), couvrant toutes les étapes de la gestion d'un chantier de construction, de l'offre à la réception des travaux.

Ce guide PDF interactif est structuré en 5 grandes catégories :
— Conseils (fiches C) : visite de site, coûts, contrats, sécurité, logistique, déchets, amiante…
— Procédures (fiches P) : étapes clés à suivre pour chaque phase du chantier
— Documents (fiches D) : modèles de documents types (bon de transport, mise en demeure, TVA 6%…)
— Informations (fiches I) : enregistrement, agréation, réglementation
— Démarches : tableau chronologique des obligations en marché privé et public

Outil de référence indispensable pour les conducteurs de travaux, chefs de chantier et entrepreneurs.`,
    metadata: {
      resource_type: 'guide_pratique',
      author: 'Confédération Construction Wallonne (CCW)',
      publisher: 'CCW',
      edition: 'Édition 2012',
      year: 2012,
      sections: [
        'Conseils (C1–C25+)',
        'Procédures',
        'Documents types (D1–D16)',
        'Informations réglementaires',
        'Démarches chronologiques',
        'Index & Adresses utiles',
      ],
      topics: [
        'Offre & devis',
        'Contrat & sous-traitance',
        'Installation de chantier',
        'Sécurité des personnes',
        'Gestion des déchets',
        'Transport & signalisation',
        'Réception des travaux',
        'Paiement & contentieux',
      ],
    },
  },
];

async function seedOuvragesPDF() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const P of PRODUCTS) {
      // Récupérer la catégorie
      const catRes = await client.query(
        `SELECT id FROM categories WHERE slug = $1`, [P.category_slug]
      );
      if (!catRes.rows.length) throw new Error(`Catégorie "${P.category_slug}" introuvable.`);
      const categoryId = catRes.rows[0].id;

      const instRes = await client.query(`SELECT id FROM instructors LIMIT 1`);
      const instructorId = instRes.rows[0]?.id || null;

      const existing = await client.query(
        `SELECT id FROM products WHERE slug = $1`, [P.slug]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE products SET
             title=$1, description=$2, metadata=$3, tags=$4,
             file_url=$5, file_size_mb=$6, pages_count=$7,
             is_featured=$8, updated_at=NOW()
           WHERE slug=$9`,
          [
            P.title, P.description, JSON.stringify(P.metadata), P.tags,
            P.file_url, P.file_size_mb, P.pages_count,
            P.is_featured, P.slug,
          ]
        );
        console.log('✅ Mis à jour :', P.title);
      } else {
        await client.query(
          `INSERT INTO products
             (title, slug, description, type, category_id, study_level, instructor_id,
              price, is_free, language, tags, metadata, is_featured, is_active,
              file_url, file_size_mb, pages_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,$14,$15,$16)`,
          [
            P.title, P.slug, P.description, P.type, categoryId,
            P.study_level, instructorId, P.price, P.is_free, P.language,
            P.tags, JSON.stringify(P.metadata), P.is_featured,
            P.file_url, P.file_size_mb, P.pages_count,
          ]
        );
        console.log('✅ Créé :', P.title);
      }
    }

    await client.query('COMMIT');
    console.log(`\n📚 ${PRODUCTS.length} ouvrages PDF intégrés avec succès.`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedOuvragesPDF();
