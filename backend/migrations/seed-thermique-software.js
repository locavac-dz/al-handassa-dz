/**
 * seed-thermique-software.js
 * Crée la ressource "Logiciels Thermiques" dans la catégorie logiciels
 * Usage : node migrations/seed-thermique-software.js
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
  title: 'Thermique & Énergie — Logiciels de Simulation et Calcul',
  slug:  'thermique-energie-logiciels',
  type:  'logiciels',
  category_slug: 'logiciels',
  study_level: 'tous',
  language: 'fr',
  price: 0,
  is_free: true,
  is_featured: true,
  tags: ['thermique', 'RE2020', 'RT2012', 'DPE', 'STD', 'énergie', 'HVAC', 'CVC', 'audit énergétique', 'BIM thermique', 'logiciels'],

  description: `Les logiciels thermiques les plus utilisés par les bureaux d'études et ingénieurs en France et au Maghreb.

Cette sélection couvre l'ensemble des besoins en ingénierie thermique et énergétique du bâtiment : études RE2020, RT2012, DPE, audits énergétiques, simulation thermique dynamique (STD), calcul de déperditions, dimensionnement CVC et bâtiments passifs.

Chaque logiciel est présenté avec son domaine d'application, ses fonctionnalités clés et un lien direct vers le site officiel.`,

  metadata: {
    resource_type: 'software_guide',
    software_list: [
      {
        name: 'ClimaWin',
        icon: '🌡️',
        category: 'Thermique du bâtiment',
        badge: 'Très utilisé en France',
        badge_color: '#1B3A6B',
        description: 'Logiciel de référence pour les études thermiques en France. Très utilisé dans les bureaux d\'études pour les études RE2020, RT2012, DPE et audits énergétiques. Couvre l\'ensemble des calculs thermiques : déperditions, apports solaires, climatisation et simulation thermique dynamique (STD).',
        features: [
          'Études RE2020 & RT2012',
          'Calcul des déperditions thermiques',
          'Apports solaires & surchauffe',
          'Dimensionnement climatisation',
          'Simulation thermique dynamique (STD)',
          'DPE & audits énergétiques',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.climawin.fr',
        url_label: 'Site officiel ClimaWin',
        trial_url: 'https://www.climawin.fr',
        trial_label: 'En savoir plus',
        level: 'intermediaire',
      },
      {
        name: 'Pleiades + COMFIE',
        icon: '⭐',
        category: 'Simulation thermique dynamique',
        badge: 'Référence STD',
        badge_color: '#6d28d9',
        description: 'Référence française en simulation thermique dynamique (STD). Très apprécié des bureaux d\'études et laboratoires pour l\'analyse du confort d\'été, de la ventilation naturelle, de la consommation énergétique et des bâtiments passifs. Moteur COMFIE reconnu pour sa précision et sa fiabilité.',
        features: [
          'Simulation thermique dynamique complète',
          'Confort d\'été & surchauffe',
          'Ventilation naturelle & hybride',
          'Consommation énergétique',
          'Bâtiments passifs & BEPOS',
          'Analyses paramétriques',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (démo disponible)',
        url: 'https://www.izuba.fr/logiciels/pleiade-comfie/',
        url_label: 'Site officiel Pleiades',
        trial_url: 'https://www.izuba.fr/logiciels/pleiade-comfie/',
        trial_label: 'Demander une démo',
        level: 'avance',
      },
      {
        name: 'ArchiWIZARD',
        icon: '🏠',
        category: 'Thermique BIM pour architectes',
        badge: 'RE2020 & BIM',
        badge_color: '#0f766e',
        description: 'Logiciel RE2020 conçu pour les architectes et bureaux d\'études, compatible BIM et CAO. Permet une analyse complète de la performance énergétique dès la phase de conception : ensoleillement, apports solaires, ACV (Analyse du Cycle de Vie), et confort thermique. Interface intuitive et import maquette native.',
        features: [
          'Conformité RE2020 intégrée',
          'Compatible BIM / IFC / CAO',
          'Analyse ensoleillement & masques',
          'ACV (Analyse du Cycle de Vie)',
          'Confort thermique d\'été',
          'Rapports réglementaires automatiques',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale (essai disponible)',
        url: 'https://www.archiwizard.fr',
        url_label: 'Site officiel ArchiWIZARD',
        trial_url: 'https://www.archiwizard.fr/essai-gratuit/',
        trial_label: 'Essai gratuit',
        level: 'intermediaire',
      },
      {
        name: 'CYPECAD MEP',
        icon: '🔧',
        category: 'BIM thermique & fluides',
        badge: 'Plateforme BIM complète',
        badge_color: '#b91c1c',
        description: 'Plateforme BIM de CYPE pour le calcul des lots techniques du bâtiment. Couvre l\'ensemble des installations du bâtiment en environnement BIM : chauffage, climatisation, ventilation, acoustique et sécurité incendie. Très utilisé dans les bureaux d\'études techniques (BET) espagnols, français et maghrébins.',
        features: [
          'Chauffage & climatisation CVC',
          'Ventilation & qualité d\'air',
          'Acoustique du bâtiment',
          'Sécurité incendie',
          'Environnement BIM natif',
          'Plans d\'exécution automatiques',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.cype.fr/cypecad-mep/',
        url_label: 'Site officiel CYPECAD MEP',
        trial_url: 'https://www.cype.fr/cypecad-mep/',
        trial_label: 'En savoir plus',
        level: 'avance',
      },
      {
        name: 'CYPETHERM EPlus',
        icon: '⚡',
        category: 'Simulation énergétique avancée',
        badge: 'Moteur EnergyPlus',
        badge_color: '#d97706',
        description: 'Logiciel de simulation énergétique avancée de CYPE, basé sur le moteur EnergyPlus de référence internationale. Très puissant pour les études complexes HVAC/CVC, les bâtiments à haute performance énergétique et les projets nécessitant une simulation horaire détaillée sur l\'ensemble de l\'année.',
        features: [
          'Moteur EnergyPlus (DOE)',
          'Simulation horaire annuelle',
          'Études complexes HVAC / CVC',
          'Bâtiments haute performance',
          'Analyse de sensibilité',
          'Compatible IFC / BIM',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.cype.fr/cypetherm-eplus/',
        url_label: 'Site officiel CYPETHERM EPlus',
        trial_url: 'https://www.cype.fr/cypetherm-eplus/',
        trial_label: 'En savoir plus',
        level: 'avance',
      },
      {
        name: 'Logiciels Perrenoud',
        icon: '📋',
        category: 'Bureau d\'études thermiques',
        badge: 'Référence BET thermique',
        badge_color: '#1d4ed8',
        description: 'Suite logicielle très connue dans les bureaux d\'études thermiques français. Couvre l\'ensemble des missions réglementaires : RE2020, climatisation, réseaux de fluides, DPE, audits énergétiques et ACV. Modules spécialisés reconnus par les organismes de certification et les collectivités.',
        features: [
          'RE2020 & RT existant',
          'DPE (Diagnostic de Performance Énergétique)',
          'Audits énergétiques',
          'Dimensionnement climatisation',
          'Réseaux de fluides',
          'ACV & bilan carbone',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.perrenoud.fr',
        url_label: 'Site officiel Perrenoud',
        trial_url: 'https://www.perrenoud.fr',
        trial_label: 'En savoir plus',
        level: 'intermediaire',
      },
      {
        name: 'BBS Slama',
        icon: '🌿',
        category: 'Thermique & BIM énergétique',
        badge: 'STD & RE2020',
        badge_color: '#15803d',
        description: 'Solutions professionnelles pour l\'ingénierie thermique et énergétique du bâtiment. La suite BBS Slama couvre les études RE2020, la simulation thermique dynamique (STD), le DPE, la simulation énergétique et le BIM thermique. Reconnue pour sa conformité réglementaire et ses exports documentaires complets.',
        features: [
          'RE2020 & réglementation thermique',
          'Simulation thermique dynamique (STD)',
          'DPE & audits énergétiques',
          'Simulation énergétique complète',
          'BIM thermique natif',
          'Rapports réglementaires complets',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.bbs-slama.com',
        url_label: 'Site officiel BBS Slama',
        trial_url: 'https://www.bbs-slama.com',
        trial_label: 'En savoir plus',
        level: 'intermediaire',
      },
      {
        name: 'Calixta',
        icon: '☀️',
        category: 'Rénovation énergétique en ligne',
        badge: 'Conforme RGE',
        badge_color: '#f59e0b',
        description: 'Logiciel en ligne dédié à la rénovation énergétique, conçu pour les professionnels RGE (Reconnu Garant de l\'Environnement). Permet le dimensionnement des systèmes de chauffage, pompes à chaleur (PAC) et installations solaires thermiques. Génère des rapports conformes aux exigences des aides à la rénovation.',
        features: [
          'Dimensionnement chauffage & PAC',
          'Solaire thermique',
          'Rapports conformes RGE',
          'Calcul des aides MaPrimeRénov\'',
          'Interface en ligne (SaaS)',
          'Scénarios de rénovation',
        ],
        platforms: ['Web (navigateur)'],
        price_info: 'Abonnement SaaS',
        url: 'https://www.calixta.fr',
        url_label: 'Site officiel Calixta',
        trial_url: 'https://www.calixta.fr',
        trial_label: 'Essai gratuit',
        level: 'debutant',
      },
      {
        name: 'ClimandSoft',
        icon: '❄️',
        category: 'Génie climatique & thermique',
        badge: 'CVC complet',
        badge_color: '#0284c7',
        description: 'Logiciel de génie climatique et de calcul thermique dédié aux installateurs et bureaux d\'études CVC. Couvre l\'ensemble des calculs des installations climatiques : déperditions, réseaux de distribution, eau chaude sanitaire, climatisation et solaire thermique. Interface claire adaptée aux techniciens et ingénieurs de terrain.',
        features: [
          'Calcul des déperditions thermiques',
          'Réseaux de chauffage & distribution',
          'Eau chaude sanitaire (ECS)',
          'Climatisation & froid',
          'Solaire thermique',
          'Dimensionnement équipements CVC',
        ],
        platforms: ['Windows'],
        price_info: 'Licence commerciale',
        url: 'https://www.climandsoft.com',
        url_label: 'Site officiel ClimandSoft',
        trial_url: 'https://www.climandsoft.com',
        trial_label: 'En savoir plus',
        level: 'intermediaire',
      },
    ],
  },
};

async function seedThermiqueSoftware() {
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
    console.log(`\n🌡️ Ressource "Thermique & Énergie" : ${PRODUCT.metadata.software_list.length} logiciels intégrés`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedThermiqueSoftware();
