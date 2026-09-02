/**
 * seed-topo-software.js
 * Crée la ressource "Topographie & SIG" dans la catégorie logiciels
 * Usage : node migrations/seed-topo-software.js
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
  title: 'Topographie & SIG — Logiciels de Mesure et Traitement',
  slug:  'topographie-sig-logiciels',
  type:  'logiciels',
  category_slug: 'logiciels',
  study_level: 'tous',
  language: 'fr',
  price: 0,
  is_free: true,
  is_featured: true,
  tags: ['Topographie', 'SIG', 'GNSS', 'LiDAR', 'Civil 3D', 'Covadis', 'Leica', 'Trimble', 'QGIS', 'drones', 'nuages de points', 'logiciels'],

  description: `Les logiciels incontournables pour les géomètres, topographes et ingénieurs VRD en Algérie et à l'international.

Cette sélection couvre l'ensemble de la chaîne topographique : levés terrain, traitement GNSS, calcul de réseaux, modélisation numérique de terrain, cartographie SIG, LiDAR et photogrammétrie drone.

Chaque logiciel est présenté avec son domaine d'application, ses fonctionnalités clés et un lien direct vers le site officiel.`,

  metadata: {
    resource_type: 'software_guide',
    software_list: [
      {
        name: 'Autodesk Civil 3D',
        icon: '🛣️',
        category: 'Infrastructure / Topographie',
        badge: 'Référence mondiale',
        badge_color: '#1B3A6B',
        description: 'Référence mondiale pour la topographie, les VRD, la conception routière, le terrassement et les réseaux. Compatible GPS, drones, nuages de points et BIM. Standard dans les bureaux d\'études algériens et internationaux pour tous les projets d\'aménagement.',
        features: ['Topographie & MNT 3D', 'Conception VRD complète', 'Routes & terrassement', 'Réseaux AEP / assainissement', 'Import GPS / drones / nuages de points', 'Intégration BIM / Revit'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (essai 30 jours)',
        url: 'https://www.autodesk.fr/products/civil-3d/overview',
        url_label: 'Site officiel Civil 3D',
        trial_url: 'https://www.autodesk.fr/products/civil-3d/free-trial',
        trial_label: 'Essai gratuit 30 jours',
        level: 'intermediaire',
      },
      {
        name: 'Covadis',
        icon: '📐',
        category: 'Topographie / VRD',
        badge: 'Référence France & Maghreb',
        badge_color: '#e63946',
        description: 'Très utilisé en France et au Maghreb par les géomètres-experts et les entreprises de TP. Extension AutoCAD dédiée à la topographie et aux VRD. Permet de réaliser des levés topographiques, calculs de cubatures, profils en long et en travers, projets VRD et modèles numériques de terrain.',
        features: ['Levés topographiques', 'Calculs de cubatures', 'Profils en long & en travers', 'Projets VRD complets', 'Modèle Numérique de Terrain', 'Fonctionne avec AutoCAD'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.covadis.com',
        url_label: 'Site officiel Covadis',
        trial_url: 'https://www.covadis.com/telechargements',
        trial_label: 'Téléchargements & démos',
        level: 'intermediaire',
      },
      {
        name: 'Leica Infinity',
        icon: '🛰️',
        category: 'Traitement GNSS & Topo',
        badge: 'Données terrain',
        badge_color: '#2e7d32',
        description: 'Logiciel de traitement de données GNSS et stations totales Leica. Très apprécié pour les relevés terrain professionnels grâce à son interface intuitive et ses outils de calcul précis. Permet le traitement des bases GNSS, le calcul de réseaux et l\'export vers les logiciels CAO/SIG.',
        features: ['Traitement GNSS & bases statiques', 'Traitement stations totales', 'Calcul et compensation de réseaux', 'Import/Export formats universels', 'Compatible matériel Leica'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (démo disponible)',
        url: 'https://leica-geosystems.com/products/total-stations/software/leica-infinity',
        url_label: 'Site officiel Leica Infinity',
        trial_url: 'https://leica-geosystems.com/products/total-stations/software/leica-infinity',
        trial_label: 'En savoir plus',
        level: 'intermediaire',
      },
      {
        name: 'Trimble Business Center',
        icon: '📡',
        category: 'GPS / Drones / Scanner 3D',
        badge: 'Grands projets topo',
        badge_color: '#e67e22',
        description: 'Solution de traitement de données de terrain très puissante couvrant le GPS RTK, les drones photogrammétriques, les scanners 3D et la photogrammétrie. Idéale pour les grands projets topographiques nécessitant une haute précision et des workflows numériques intégrés.',
        features: ['Traitement GPS RTK & statique', 'Photogrammétrie drone', 'Scanner 3D & nuages de points', 'Modèles 3D & orthophotos', 'Rapports de précision', 'Export CAO / SIG / BIM'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://geospatial.trimble.com/en/products/software/trimble-business-center',
        url_label: 'Site officiel Trimble Business Center',
        trial_url: 'https://geospatial.trimble.com/en/products/software/trimble-business-center',
        trial_label: 'En savoir plus',
        level: 'avance',
      },
      {
        name: 'Topcon MAGNET Field',
        icon: '📟',
        category: 'Logiciel terrain',
        badge: 'Terrain & implantation',
        badge_color: '#0078d7',
        description: 'Logiciel terrain pour stations totales et GPS Topcon. Utilisé directement sur tablette ou contrôleur sur le chantier pour l\'implantation et les levés. Interface simple et ergonomique adaptée aux conditions de terrain, compatible avec l\'ensemble du matériel Topcon.',
        features: ['Implantation de points & axes', 'Levés topographiques terrain', 'Interface tablette optimisée', 'Compatible stations totales & GNSS Topcon', 'Synchronisation cloud MAGNET'],
        platforms: ['Windows', 'Android'],
        price_info: 'Inclus avec matériel Topcon / Licence séparée',
        url: 'https://www.topconpositioning.com/software/field-software/magnet-field',
        url_label: 'Site officiel MAGNET Field',
        trial_url: 'https://www.topconpositioning.com/software/field-software/magnet-field',
        trial_label: 'En savoir plus',
        level: 'intermediaire',
      },
      {
        name: 'Bentley OpenRoads Designer',
        icon: '🏗️',
        category: 'Infrastructure routière',
        badge: 'Autoroutes & ferroviaire',
        badge_color: '#7b2d8b',
        description: 'Solution de Bentley Systems pour la conception d\'infrastructure et les grands projets routiers. Très utilisé pour les autoroutes, le ferroviaire et les corridors 3D. Intègre la topographie, la modélisation et les plans d\'exécution dans un environnement BIM complet.',
        features: ['Conception autoroutière & ferroviaire', 'Corridors 3D paramétriques', 'Topographie & MNT intégrés', 'Plans d\'exécution automatiques', 'Format OpenBIM / IFC'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (démo disponible)',
        url: 'https://www.bentley.com/software/openroads-designer/',
        url_label: 'Site officiel OpenRoads',
        trial_url: 'https://www.bentley.com/try/',
        trial_label: 'Demander une démo',
        level: 'avance',
      },
      {
        name: 'MicroSurvey STAR*NET',
        icon: '🌐',
        category: 'Ajustement de réseaux',
        badge: 'Précision & compensation',
        badge_color: '#00838f',
        description: 'Logiciel de référence pour l\'ajustement et la compensation de réseaux topographiques par la méthode des moindres carrés. Utilisé par les géomètres experts pour les calculs de haute précision, les travaux de contrôle et les levés de référence. Rapports d\'erreur détaillés et ellipses d\'erreur.',
        features: ['Ajustement par moindres carrés', 'Réseaux polygonaux & géodésiques', 'Compensation 2D & 3D', 'Rapports d\'erreur & ellipses', 'Analyse de qualité du réseau'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (version d\'essai disponible)',
        url: 'https://www.microsurvey.com/products/starnet/',
        url_label: 'Site officiel STAR*NET',
        trial_url: 'https://www.microsurvey.com/products/starnet/',
        trial_label: 'Version d\'essai',
        level: 'avance',
      },
      {
        name: 'QGIS',
        icon: '🗺️',
        category: 'SIG / Cartographie',
        badge: '100% Gratuit & Open Source',
        badge_color: '#16a34a',
        description: 'Système d\'Information Géographique gratuit et open source, très utilisé en topographie, cartographie et traitement de données géographiques. Compatible avec les données drone, GPS et LiDAR. Dispose d\'une large communauté et de nombreuses extensions pour l\'analyse spatiale.',
        features: ['SIG complet & cartographie', 'Import drone / GPS / LiDAR', 'Traitement raster & vecteur', 'Nombreuses extensions (plugins)', 'Analyse spatiale avancée', 'Gratuit & open source'],
        platforms: ['Windows', 'Mac', 'Linux'],
        price_info: '100% Gratuit — Open Source',
        url: 'https://qgis.org',
        url_label: 'Site officiel QGIS',
        trial_url: 'https://qgis.org/download/',
        trial_label: 'Télécharger gratuitement',
        level: 'debutant',
      },
      {
        name: 'TopoDOT',
        icon: '☁️',
        category: 'LiDAR & Nuages de points',
        badge: 'Extraction automatique',
        badge_color: '#c62828',
        description: 'Logiciel spécialisé dans le traitement LiDAR et des nuages de points pour les applications d\'infrastructure et de topographie. Permet l\'extraction automatique de lignes, surfaces, bordures et éléments de route à partir de données scanner 3D ou LiDAR mobile.',
        features: ['Traitement nuages de points LiDAR', 'Extraction automatique d\'éléments', 'Modélisation terrain & infrastructure', 'Compatible AutoCAD & MicroStation', 'LiDAR mobile & terrestre'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.certainty3d.com/products/topodot/',
        url_label: 'Site officiel TopoDOT',
        trial_url: 'https://www.certainty3d.com/products/topodot/',
        trial_label: 'En savoir plus',
        level: 'avance',
      },
      {
        name: 'VisionLidar',
        icon: '🔵',
        category: 'LiDAR & 3D',
        badge: 'Relevés 3D terrain',
        badge_color: '#1565c0',
        description: 'Logiciel français spécialisé dans le traitement LiDAR et des nuages de points, développé par Geo-Plus. Très utile pour les relevés 3D, la modélisation du terrain et les projets d\'infrastructure. Interface intuitive et compatible avec les principaux formats de nuages de points du marché.',
        features: ['Traitement LiDAR & nuages de points', 'Modélisation 3D du terrain', 'Extraction automatique de profils', 'Visualisation & analyse 3D', 'Export formats CAO & SIG'],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (démo disponible)',
        url: 'https://www.geo-plus.com/logiciel-visionlidar/',
        url_label: 'Site officiel VisionLidar',
        trial_url: 'https://www.geo-plus.com/logiciel-visionlidar/',
        trial_label: 'Demander une démo',
        level: 'avance',
      },
    ],
  },
};

async function seedTopoSoftware() {
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
    console.log(`\n🗺️ Ressource "Topographie & SIG" : ${PRODUCT.metadata.software_list.length} logiciels intégrés`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTopoSoftware();
