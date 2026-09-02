/**
 * seed-civil-structure-software.js
 * Crée la ressource "Génie Civil & Structure" dans la catégorie logiciels
 * Usage : node migrations/seed-civil-structure-software.js
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
  title: 'Génie Civil & Structure — Logiciels de Calcul et Modélisation',
  slug:  'genie-civil-structure-logiciels',
  type:  'logiciels',
  category_slug: 'logiciels',
  study_level: 'tous',
  language: 'fr',
  price: 0,
  is_free: true,
  is_featured: true,
  tags: ['Génie Civil', 'Structure', 'Civil 3D', 'ETABS', 'SAP2000', 'Tekla', 'Robot', 'SAFE', 'STAAD', 'Bentley', 'calcul structure', 'logiciels'],

  description: `Sélection des logiciels incontournables pour les ingénieurs en génie civil et structure travaillant sur des projets de bâtiments, d'infrastructures et d'ouvrages d'art.

Cette ressource présente les outils les plus utilisés dans les bureaux d'études structure, les entreprises de travaux publics et les établissements d'enseignement — du calcul aux éléments finis à la conception routière, en passant par la modélisation détaillée des structures en acier et béton armé.

Chaque logiciel est présenté avec ses points forts, son niveau d'utilisation dans l'industrie, et un lien direct vers le site officiel pour l'essai gratuit ou l'achat de licence.`,

  metadata: {
    resource_type: 'software_guide',
    software_list: [
      {
        name: 'Autodesk Civil 3D',
        icon: '🛣️',
        category: 'Infrastructure / VRD',
        badge: 'Référence VRD',
        badge_color: '#1B3A6B',
        description: 'Logiciel de conception d\'infrastructures routières, topographie, réseaux enterrés et terrassement. Standard dans les projets d\'aménagement, VRD et grands travaux publics en Algérie et à l\'international. Intégré à l\'écosystème Autodesk avec Revit et Navisworks.',
        features: ['Conception routière 3D', 'Topographie & MNT', 'Réseaux enterrés (AEP/assainissement)', 'Terrassement automatisé', 'Intégration BIM/Revit'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (essai 30 jours)',
        url: 'https://www.autodesk.fr/products/civil-3d/overview',
        url_label: 'Site officiel Civil 3D',
        trial_url: 'https://www.autodesk.fr/products/civil-3d/free-trial',
        trial_label: 'Essai gratuit 30 jours',
        level: 'intermediaire',
      },
      {
        name: 'Bentley OpenRoads Designer',
        icon: '🏗️',
        category: 'Conception routière',
        badge: 'Grands projets publics',
        badge_color: '#0078d7',
        description: 'Solution de conception routière et d\'infrastructure de Bentley Systems, très utilisée dans les grands projets publics et autoroutiers. Gère les routes, ponts, échangeurs et ouvrages d\'art avec un niveau de détail élevé. Très répandu dans les marchés publics et bureaux d\'études internationaux.',
        features: ['Conception autoroutière avancée', 'Ouvrages d\'art & ponts', 'Intégration géotechnique', 'Plans de fabrication automatiques', 'Format IFC / OpenBIM'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (démo disponible)',
        url: 'https://www.bentley.com/software/openroads-designer/',
        url_label: 'Site officiel Bentley',
        trial_url: 'https://www.bentley.com/try/',
        trial_label: 'Demander une démo',
        level: 'avance',
      },
      {
        name: 'Tekla Structures',
        icon: '🔩',
        category: 'Structure métallique & BA',
        badge: 'Détail de fabrication',
        badge_color: '#e63946',
        description: 'Logiciel BIM de référence pour la modélisation et le détail de fabrication des structures en acier et béton armé. Produit des plans d\'exécution très précis pour la fabrication en atelier et le chantier. Utilisé par les grands bureaux d\'études structure en Algérie et à l\'étranger.',
        features: ['Modélisation structure acier & BA', 'Plans de fabrication détaillés', 'Listes de matériaux automatiques', 'Gestion de chantier BIM', 'Export IFC / CIS/2'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale — Version étudiante disponible',
        url: 'https://www.tekla.com/products/tekla-structures',
        url_label: 'Site officiel Tekla',
        trial_url: 'https://www.tekla.com/try-tekla',
        trial_label: 'Version d\'essai',
        level: 'avance',
      },
      {
        name: 'Robot Structural Analysis',
        icon: '🤖',
        category: 'Calcul de structures',
        badge: 'Intégré Revit',
        badge_color: '#2e7d32',
        description: 'Logiciel de calcul et d\'analyse structurelle d\'Autodesk, pleinement intégré à Revit. Permet d\'effectuer des analyses statiques, dynamiques et sismiques sur des bâtiments en béton armé, acier et bois. Idéal pour les bureaux d\'études qui travaillent déjà dans l\'écosystème Autodesk.',
        features: ['Analyse statique & dynamique', 'Calcul sismique (RPA)', 'Intégration bidirectionnelle Revit', 'Ferraillage automatique', 'Rapports de calcul complets'],
        platforms: ['Windows'],
        price_info: 'Inclus dans Autodesk AEC Collection',
        url: 'https://www.autodesk.fr/products/robot-structural-analysis/overview',
        url_label: 'Site officiel Robot',
        trial_url: 'https://www.autodesk.fr/products/robot-structural-analysis/free-trial',
        trial_label: 'Essai gratuit 30 jours',
        level: 'intermediaire',
      },
      {
        name: 'ETABS',
        icon: '🏢',
        category: 'Calcul bâtiments',
        badge: 'Référence immeubles',
        badge_color: '#7b2d8b',
        description: 'Logiciel de référence pour l\'analyse et la conception de bâtiments en béton armé et charpente métallique — notamment les immeubles, tours et structures complexes. Très utilisé par les bureaux d\'études algériens pour la vérification RPA et le ferraillage. Interface intuitive et résultats fiables.',
        features: ['Analyse des bâtiments multi-étages', 'Vérification sismique RPA/Eurocode', 'Conception automatique des poteaux/poutres', 'Calcul des voiles BA', 'Rapport de conception complet'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (version d\'essai disponible)',
        url: 'https://www.csiamerica.com/products/etabs',
        url_label: 'Site officiel ETABS',
        trial_url: 'https://www.csiamerica.com/support/downloads',
        trial_label: 'Version d\'essai',
        level: 'intermediaire',
      },
      {
        name: 'SAP2000',
        icon: '🌉',
        category: 'Analyse structurelle avancée',
        badge: 'Ouvrages spéciaux',
        badge_color: '#00838f',
        description: 'Logiciel d\'analyse structurelle polyvalent par CSI America, couvrant les bâtiments, ponts, barrages et ouvrages d\'art. Reconnu mondialement pour sa précision et sa fiabilité dans les analyses linéaires et non-linéaires. Très utilisé dans les projets d\'infrastructure complexes et les ouvrages spéciaux.',
        features: ['Analyse linéaire & non-linéaire', 'Calcul de ponts & ouvrages d\'art', 'Analyse sismique avancée', 'Éléments finis 3D', 'Push-over & Time History'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (version d\'essai disponible)',
        url: 'https://www.csiamerica.com/products/sap2000',
        url_label: 'Site officiel SAP2000',
        trial_url: 'https://www.csiamerica.com/support/downloads',
        trial_label: 'Version d\'essai',
        level: 'avance',
      },
      {
        name: 'SAFE',
        icon: '🏛️',
        category: 'Fondations & Dalles',
        badge: 'Fondations & radiers',
        badge_color: '#c62828',
        description: 'Logiciel spécialisé dans le calcul et la conception des fondations superficielles, dalles, radiers et planchers-dalles. Développé par CSI America, il permet une analyse précise des interactions sol-structure. Très prisé pour la conception des sous-sols et des fondations d\'immeubles algériens.',
        features: ['Calcul des radiers & semelles', 'Analyse des planchers-dalles', 'Interaction sol-structure', 'Ferraillage automatique', 'Vérification Eurocode / RPA'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (version d\'essai disponible)',
        url: 'https://www.csiamerica.com/products/safe',
        url_label: 'Site officiel SAFE',
        trial_url: 'https://www.csiamerica.com/support/downloads',
        trial_label: 'Version d\'essai',
        level: 'intermediaire',
      },
      {
        name: 'STAAD.Pro',
        icon: '⚙️',
        category: 'Analyse & conception structurelle',
        badge: 'Standard international',
        badge_color: '#e67e22',
        description: 'Logiciel d\'analyse et de conception structurelle de Bentley Systems, très populaire dans l\'ingénierie internationale. Compatible avec les Eurocodes, AISC, ACI et d\'autres normes mondiales. Utilisé pour les bâtiments industriels, halles métalliques, charpentes et infrastructures.',
        features: ['Analyse statique & dynamique', 'Normes Eurocode / AISC / ACI', 'Conception charpentes métalliques', 'Intégration Bentley OpenBuildings', 'Export IFC & DXF'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (essai disponible)',
        url: 'https://www.bentley.com/software/staad-pro/',
        url_label: 'Site officiel STAAD.Pro',
        trial_url: 'https://www.bentley.com/try/',
        trial_label: 'Demander une démo',
        level: 'intermediaire',
      },
    ],
  },
};

async function seedCivilStructureSoftware() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Récupérer la catégorie logiciels
    const catRes = await client.query(`SELECT id FROM categories WHERE slug = 'logiciels'`);
    if (!catRes.rows.length) throw new Error('Catégorie "logiciels" introuvable.');
    const categoryId = catRes.rows[0].id;

    // Récupérer un instructeur par défaut
    const instRes = await client.query(`SELECT id FROM instructors LIMIT 1`);
    const instructorId = instRes.rows[0]?.id || null;

    // Vérifier si le produit existe déjà
    const existing = await client.query(
      `SELECT id FROM products WHERE slug = $1`, [PRODUCT.slug]
    );

    if (existing.rows.length > 0) {
      // Mettre à jour
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
      // Insérer
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
    console.log(`\n💻 Ressource "Génie Civil & Structure" : ${PRODUCT.metadata.software_list.length} logiciels intégrés`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedCivilStructureSoftware();
