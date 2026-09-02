/**
 * seed-bim-software.js
 * Crée la ressource "Architecture & BIM" dans la catégorie logiciels
 * Usage : node migrations/seed-bim-software.js
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
  title: 'Architecture & BIM — Guide des Logiciels Essentiels',
  slug:  'architecture-bim-guide-logiciels',
  type:  'logiciels',
  category_slug: 'logiciels',
  study_level: 'tous',
  language: 'fr',
  price: 0,
  is_free: true,
  is_featured: true,
  tags: ['BIM', 'Revit', 'AutoCAD', 'Archicad', 'SketchUp', 'Rhino 3D', 'Lumion', 'Twinmotion', 'Vectorworks', 'architecture', 'logiciels'],

  description: `Sélection des logiciels incontournables pour les architectes, ingénieurs et designers travaillant en architecture et BIM (Building Information Modeling).

Cette ressource présente les outils les plus utilisés dans les bureaux d'études, cabinets d'architecture et établissements d'enseignement — de la modélisation 3D au rendu photoréaliste, en passant par la collaboration BIM multi-disciplinaire.

Chaque logiciel est présenté avec ses points forts, son niveau d'utilisation dans l'industrie, et un lien direct vers le site officiel pour l'essai gratuit ou l'achat de licence.`,

  metadata: {
    resource_type: 'software_guide',
    software_list: [
      {
        name: 'Autodesk Revit',
        icon: '🏛️',
        category: 'BIM',
        badge: 'Standard mondial',
        badge_color: '#1B3A6B',
        description: 'Solution BIM professionnelle pour l\'architecture, la structure et les lots techniques (MEP). Standard de référence dans les bureaux d\'études et cabinets d\'architecture. Idéal pour les projets collaboratifs BIM multi-disciplinaires.',
        features: ['Modélisation BIM 3D', 'Coordination multi-discipline', 'Plans et coupes automatiques', 'Quantitatif automatisé', 'Format IFC'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (essai 30 jours)',
        url: 'https://www.autodesk.fr/products/revit/overview',
        url_label: 'Site officiel Autodesk',
        trial_url: 'https://www.autodesk.fr/products/revit/free-trial',
        trial_label: 'Essai gratuit 30 jours',
        level: 'intermediaire',
      },
      {
        name: 'AutoCAD',
        icon: '📐',
        category: 'DAO',
        badge: 'Référence historique',
        badge_color: '#e63946',
        description: 'Logiciel de dessin technique 2D et modélisation 3D de référence dans l\'architecture et l\'ingénierie depuis plus de 40 ans. Compatible avec la quasi-totalité des logiciels CAO du marché. Disponible en version Architecture, MEP et Civil 3D.',
        features: ['Dessin 2D précis', 'Modélisation 3D', 'Blocs et bibliothèques', 'Cotation automatique', 'Export PDF/DXF/DWG'],
        platforms: ['Windows', 'Mac'],
        price_info: 'Licence commerciale (essai 30 jours)',
        url: 'https://www.autodesk.fr/products/autocad/overview',
        url_label: 'Site officiel AutoCAD',
        trial_url: 'https://www.autodesk.fr/products/autocad/free-trial',
        trial_label: 'Essai gratuit 30 jours',
        level: 'debutant',
      },
      {
        name: 'Archicad',
        icon: '🏗️',
        category: 'BIM',
        badge: 'Favori architectes',
        badge_color: '#2e7d32',
        description: 'Logiciel BIM d\'Graphisoft, très apprécié des architectes pour son interface intuitive et sa puissance de conception architecturale. Excellent pour les projets de toutes tailles avec une prise en main plus rapide que ses concurrents. Version étudiante disponible gratuitement.',
        features: ['BIM orienté architecture', 'Interface intuitive', 'Teamwork collaboration', 'Rendus intégrés', 'OpenBIM / IFC natif'],
        platforms: ['Windows', 'Mac'],
        price_info: 'Licence commerciale — Version étudiante gratuite',
        url: 'https://graphisoft.com/solutions/archicad',
        url_label: 'Site officiel Archicad',
        trial_url: 'https://graphisoft.com/downloads/archicad',
        trial_label: 'Télécharger / Version étudiante',
        level: 'intermediaire',
      },
      {
        name: 'SketchUp Pro',
        icon: '✏️',
        category: 'Modélisation 3D',
        badge: 'Rapidité & facilité',
        badge_color: '#e67e22',
        description: 'Outil de modélisation 3D reconnu pour sa simplicité et sa rapidité de prise en main. Excellent pour les études de concepts architecturaux, les rendus rapides et les présentations clients. Dispose d\'une vaste bibliothèque de composants 3D (3D Warehouse).',
        features: ['Modélisation 3D rapide', '3D Warehouse (bibliothèque)', 'Rendu avec V-Ray', 'Extensions nombreuses', 'Version Web gratuite'],
        platforms: ['Windows', 'Mac'],
        price_info: 'Pro payant — Version Free disponible en ligne',
        url: 'https://www.sketchup.com',
        url_label: 'Site officiel SketchUp',
        trial_url: 'https://www.sketchup.com/try-sketchup',
        trial_label: 'Essai gratuit',
        level: 'debutant',
      },
      {
        name: 'Vectorworks Architect',
        icon: '🎨',
        category: 'BIM / Architecture',
        badge: 'Design créatif',
        badge_color: '#7b2d8b',
        description: 'Solution BIM très appréciée pour les projets d\'architecture créatifs, de paysagisme et de scénographie. Offre une grande liberté de conception avec des outils de dessin vectoriel puissants et une interopérabilité BIM complète.',
        features: ['BIM + dessin vectoriel', 'Architecture & paysage', 'Scénographie & événementiel', 'Rendu Renderworks intégré', 'Import/Export IFC'],
        platforms: ['Windows', 'Mac'],
        price_info: 'Licence commerciale (essai disponible)',
        url: 'https://www.vectorworks.net/architect',
        url_label: 'Site officiel Vectorworks',
        trial_url: 'https://www.vectorworks.net/try',
        trial_label: 'Essai gratuit',
        level: 'intermediaire',
      },
      {
        name: 'Rhino 3D',
        icon: '🦏',
        category: 'Modélisation avancée',
        badge: 'Formes complexes',
        badge_color: '#1565c0',
        description: 'Logiciel de modélisation 3D NURBS de référence pour les formes organiques et complexes en architecture contemporaine, design industriel et ingénierie. Utilisé par les agences d\'architecture les plus innovantes pour des projets à géométrie libre.',
        features: ['Modélisation NURBS', 'Formes organiques libres', 'Plugin Grasshopper (paramétrique)', 'Interopérabilité totale', 'Rendu avec V-Ray / Enscape'],
        platforms: ['Windows', 'Mac'],
        price_info: 'Licence commerciale — Version évaluation disponible',
        url: 'https://www.rhino3d.com',
        url_label: 'Site officiel Rhino 3D',
        trial_url: 'https://www.rhino3d.com/download/',
        trial_label: 'Version d\'évaluation (90 sauvegardes)',
        level: 'avance',
      },
      {
        name: 'Lumion',
        icon: '🌅',
        category: 'Rendu architectural',
        badge: 'Ultra réaliste',
        badge_color: '#c62828',
        description: 'Solution de rendu architectural ultra-réaliste permettant de visualiser des projets en quelques minutes. Importation directe depuis Revit, ArchiCAD, SketchUp, Rhino. Bibliothèque immense d\'objets, matériaux, végétation et effets atmosphériques.',
        features: ['Rendu photoréaliste rapide', 'Bibliothèque 6 000+ objets', 'Animations & visites virtuelles', 'Import Revit / ArchiCAD / SketchUp', 'Effets atmosphériques'],
        platforms: ['Windows'],
        price_info: 'Licence annuelle (essai gratuit)',
        url: 'https://lumion.com',
        url_label: 'Site officiel Lumion',
        trial_url: 'https://lumion.com/free-trial.html',
        trial_label: 'Essai gratuit 14 jours',
        level: 'intermediaire',
      },
      {
        name: 'Twinmotion',
        icon: '⚡',
        category: 'Visualisation temps réel',
        badge: 'Temps réel',
        badge_color: '#00838f',
        description: 'Logiciel de visualisation architecturale en temps réel basé sur Unreal Engine. Synchronisation directe avec Revit, ArchiCAD, SketchUp et Rhino via des plugins dédiés. Gratuit pour les revenus inférieurs à 1M$ — idéal pour les petites agences et étudiants.',
        features: ['Visualisation temps réel', 'Moteur Unreal Engine', 'Sync directe Revit/ArchiCAD', 'VR compatible', 'Gratuit sous conditions'],
        platforms: ['Windows', 'Mac'],
        price_info: 'Gratuit (revenus < 1M$) — Payant au-delà',
        url: 'https://www.twinmotion.com',
        url_label: 'Site officiel Twinmotion',
        trial_url: 'https://www.twinmotion.com/download',
        trial_label: 'Télécharger gratuitement',
        level: 'intermediaire',
      },
    ],
  },
};

async function seedBIMSoftware() {
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
    console.log(`\n💻 Ressource "Architecture & BIM" : ${PRODUCT.metadata.software_list.length} logiciels intégrés`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedBIMSoftware();
