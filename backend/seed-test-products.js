// Seed test products into Al Handassa.dz database

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const testProducts = [
  // Cours PDF
  {
    title: 'Cours Béton Armé - Bases Fondamentales',
    slug: 'cours-beton-bases',
    type: 'cours_pdf',
    category_name: 'Béton Armé',
    category_slug: 'beton-arme',
    price: 2500,
    is_free: false,
    description: 'Cours complet sur le béton armé couvrant les bases de la conception',
    file_url: '/uploads/cours-beton-bases.pdf',
    thumbnail_url: '/img/products/beton.jpg',
    instructor_name: 'Dr. Ahmed Benali',
    study_level: 'Licence',
    rating_avg: 4.8,
    rating_count: 234,
    is_active: true,
    tags: ['Béton', 'Structures', 'Résistance']
  },
  {
    title: 'Calcul de Structures par Éléments Finis',
    slug: 'cours-fem-structures',
    type: 'cours_pdf',
    category_name: 'Calcul Structures',
    category_slug: 'calcul-structures',
    price: 3500,
    is_free: false,
    description: 'Guide pratique du calcul de structures utilisant la méthode des éléments finis',
    file_url: '/uploads/cours-fem.pdf',
    thumbnail_url: '/img/products/fem.jpg',
    instructor_name: 'Pr. Mohamed Hamouche',
    study_level: 'Master',
    rating_avg: 4.6,
    rating_count: 156,
    is_active: true,
    tags: ['FEM', 'Calcul', 'Structures']
  },
  {
    title: 'Topographie et Géodésie',
    slug: 'cours-topographie',
    type: 'cours_pdf',
    category_name: 'Topographie',
    category_slug: 'topographie',
    price: 2000,
    is_free: false,
    description: 'Cours de topographie et géodésie pour ingénieurs civils',
    file_url: '/uploads/cours-topographie.pdf',
    thumbnail_url: '/img/products/topo.jpg',
    instructor_name: 'Ing. Fatima Zakia',
    study_level: 'Licence',
    rating_avg: 4.7,
    rating_count: 189,
    is_active: true,
    tags: ['Topographie', 'Géodésie', 'Levés']
  },
  // TD/TP
  {
    title: 'TD - Calculs de Béton Armé (10 Exercices)',
    slug: 'td-beton-calculs',
    type: 'td_pdf',
    category_name: 'Béton Armé',
    category_slug: 'beton-arme',
    price: 1500,
    is_free: false,
    description: '10 exercices résolus de calcul en béton armé avec corrections détaillées',
    file_url: '/uploads/td-beton-calculs.pdf',
    thumbnail_url: '/img/products/td-beton.jpg',
    instructor_name: 'Dr. Ahmed Benali',
    study_level: 'Licence',
    rating_avg: 4.5,
    rating_count: 87,
    is_active: true,
    tags: ['Exercices', 'Béton', 'Calculs']
  },
  {
    title: 'TP - Essais Géotechniques',
    slug: 'tp-essais-geo',
    type: 'tp_pdf',
    category_name: 'Géotechnique',
    category_slug: 'geotechnique',
    price: 1800,
    is_free: false,
    description: 'Manuel pratique des essais géotechniques en laboratoire',
    file_url: '/uploads/tp-essais-geo.pdf',
    thumbnail_url: '/img/products/tp-geo.jpg',
    instructor_name: 'Pr. Saïd Benouadjit',
    study_level: 'Licence',
    rating_avg: 4.4,
    rating_count: 65,
    is_active: true,
    tags: ['Géotechnique', 'Essais', 'Labo']
  },
  // Normes
  {
    title: 'DTR BC 2.2 - Règles de Calcul des Structures',
    slug: 'normes-dtr-bc-2-2',
    type: 'normes',
    category_name: 'Normes DTR',
    category_slug: 'normes-dtr',
    price: 3000,
    is_free: false,
    description: 'Norme algérienne DTR BC 2.2 - Règles de calcul des structures en béton',
    file_url: '/uploads/dtr-bc-2-2.pdf',
    thumbnail_url: '/img/products/norme-dtr.jpg',
    instructor_name: 'CNERIB',
    study_level: 'Master',
    rating_avg: 4.9,
    rating_count: 234,
    is_active: true,
    tags: ['DTR', 'Normes', 'Béton']
  },
  {
    title: 'DTR C 2.41 - Chauffage et Climatisation',
    slug: 'normes-dtr-c-2-41',
    type: 'normes',
    category_name: 'Normes DTR',
    category_slug: 'normes-dtr',
    price: 2500,
    is_free: false,
    description: 'Norme algérienne pour le chauffage et la climatisation',
    file_url: '/uploads/dtr-c-2-41.pdf',
    thumbnail_url: '/img/products/norme-clim.jpg',
    instructor_name: 'CNERIB',
    study_level: 'Ingénieur',
    rating_avg: 4.6,
    rating_count: 156,
    is_active: true,
    tags: ['DTR', 'Normes', 'CVC']
  },
  // Logiciels/Tutoriels
  {
    title: 'Tutoriel AutoCAD 2024 Complet',
    slug: 'tuto-autocad-2024',
    type: 'tuto_pdf',
    category_name: 'CAO/BIM',
    category_slug: 'cao-bim',
    price: 1200,
    is_free: false,
    description: 'Guide complet d\'AutoCAD 2024 pour les architectes et ingénieurs',
    file_url: '/uploads/tuto-autocad-2024.pdf',
    thumbnail_url: '/img/products/autocad.jpg',
    instructor_name: 'Ing. Karim Mazigh',
    study_level: 'Tous',
    rating_avg: 4.7,
    rating_count: 456,
    is_active: true,
    tags: ['AutoCAD', 'CAO', 'Tutoriel']
  },
  {
    title: 'Guide Revit Architecture',
    slug: 'guide-revit-archi',
    type: 'tuto_pdf',
    category_name: 'CAO/BIM',
    category_slug: 'cao-bim',
    price: 2200,
    is_free: false,
    description: 'Guide pratique de Revit pour la modélisation architecturale BIM',
    file_url: '/uploads/guide-revit-archi.pdf',
    thumbnail_url: '/img/products/revit.jpg',
    instructor_name: 'Arch. Leila Hassani',
    study_level: 'Master',
    rating_avg: 4.8,
    rating_count: 234,
    is_active: true,
    tags: ['Revit', 'BIM', 'Architecture']
  },
  {
    title: 'ETABS - Analyse Sismique des Structures',
    slug: 'tuto-etabs-sismique',
    type: 'tuto_pdf',
    category_name: 'Logiciels Calcul',
    category_slug: 'logiciels-calcul',
    price: 2800,
    is_free: false,
    description: 'Tutoriel ETABS pour l\'analyse sismique des bâtiments',
    file_url: '/uploads/tuto-etabs-sismique.pdf',
    thumbnail_url: '/img/products/etabs.jpg',
    instructor_name: 'Dr. Habib Saïdi',
    study_level: 'Ingénieur',
    rating_avg: 4.9,
    rating_count: 189,
    is_active: true,
    tags: ['ETABS', 'Sismique', 'Calcul']
  },
  // Ouvrages/Packs
  {
    title: 'Pack Complet - Génie Civil Licence (8 Cours + 4 TD)',
    slug: 'pack-licence-complet',
    type: 'pack',
    category_name: 'Packs',
    category_slug: 'packs',
    price: 12000,
    is_free: false,
    description: 'Pack complet pour la Licence en Génie Civil - 8 cours + 4 travaux dirigés',
    file_url: '/uploads/pack-licence.zip',
    thumbnail_url: '/img/products/pack-licence.jpg',
    instructor_name: 'Multiple',
    study_level: 'Licence',
    rating_avg: 4.9,
    rating_count: 567,
    is_active: true,
    tags: ['Pack', 'Licence', 'Complet']
  },
  {
    title: 'Pack Master - Structures (12 Cours + Logiciels)',
    slug: 'pack-master-structures',
    type: 'pack',
    category_name: 'Packs',
    category_slug: 'packs',
    price: 18000,
    is_free: false,
    description: 'Pack complet Master Structures - 12 cours avancés + tutoriels logiciels',
    file_url: '/uploads/pack-master-structures.zip',
    thumbnail_url: '/img/products/pack-master.jpg',
    instructor_name: 'Multiple',
    study_level: 'Master',
    rating_avg: 4.95,
    rating_count: 234,
    is_active: true,
    tags: ['Pack', 'Master', 'Structures']
  }
];

async function seedProducts() {
  try {
    console.log('🌱 Seeding test products...\n');

    for (const product of testProducts) {
      const query = `
        INSERT INTO products (
          title, slug, type, category_name, category_slug, price, is_free,
          description, file_url, thumbnail_url, instructor_name, study_level,
          rating_avg, rating_count, is_active, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        ON CONFLICT (slug) DO NOTHING
      `;

      const values = [
        product.title,
        product.slug,
        product.type,
        product.category_name,
        product.category_slug,
        product.price,
        product.is_free,
        product.description,
        product.file_url,
        product.thumbnail_url,
        product.instructor_name,
        product.study_level,
        product.rating_avg,
        product.rating_count,
        product.is_active,
        JSON.stringify(product.tags)
      ];

      await pool.query(query, values);
      console.log(`✅ Added: ${product.title}`);
    }

    console.log(`\n✅ Successfully seeded ${testProducts.length} test products!`);
    console.log('\n📊 Your site now has:');
    console.log('   • 10 test products');
    console.log('   • All categories covered');
    console.log('   • Real descriptions & pricing');
    console.log('   • Realistic ratings & reviews');

  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedProducts();
