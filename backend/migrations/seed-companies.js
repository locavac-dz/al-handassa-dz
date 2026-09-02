require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

const companies = [
  {
    name: 'COSIDER Groupe',
    slug: 'cosider-groupe',
    tagline: 'Premier groupe de BTP en Algérie — 50 ans d\'expertise',
    description: 'COSIDER est le leader national du BTP en Algérie, filiale du groupe Sonatrach. Spécialisé dans la construction de logements, d\'infrastructures routières, hydrauliques et industrielles. Présent dans les 58 wilayas avec plus de 20 000 employés, COSIDER a réalisé des milliers de projets structurants pour le développement national.',
    specialties: ['Gros Œuvre', 'Génie Civil', 'Routes & VRD', 'Hydraulique', 'Bâtiments Industriels'],
    wilayas: [16, 9, 31, 25, 19, 23, 6, 1],
    wilaya_siege: 16,
    size_range: '200+',
    founded_year: 1974,
    email: 'contact@cosider.dz',
    phone: '+213 21 28 11 00',
    website: 'https://www.cosider.dz',
    address: 'Route des Deux Bassins, Birkhadem, Alger',
    agrement: 'AGR-BTP-001-74',
    is_verified: true,
    is_premium: true,
  },
  {
    name: 'ETRHB Haddad',
    slug: 'etrhb-haddad',
    tagline: 'Autoroutes, barrages et grands travaux d\'infrastructure',
    description: 'ETRHB (Entreprise de Travaux Routiers, Hydrauliques et Bâtiments) est l\'un des plus grands groupes privés du BTP en Algérie. Fondé par Ali Haddad, le groupe s\'est illustré dans la réalisation de l\'Autoroute Est-Ouest, de nombreux barrages et projets d\'envergure nationale. Il emploie plus de 15 000 personnes.',
    specialties: ['Routes & Autoroutes', 'Ouvrages d\'art', 'Barrages & Hydraulique', 'Génie Civil', 'Terrassement'],
    wilayas: [16, 6, 19, 15, 28, 43],
    wilaya_siege: 16,
    size_range: '200+',
    founded_year: 1986,
    email: 'info@etrhb.dz',
    phone: '+213 21 50 33 00',
    website: 'https://www.etrhb.dz',
    address: 'Cheraga, Alger',
    agrement: 'AGR-BTP-002-86',
    is_verified: true,
    is_premium: true,
  },
  {
    name: 'ENGOA — Entreprise Nationale de Génie Civil et Ouvrages d\'Art',
    slug: 'engoa',
    tagline: 'Spécialiste des ouvrages d\'art et structures complexes',
    description: 'ENGOA est une entreprise publique spécialisée dans la réalisation d\'ouvrages d\'art (ponts, viaducs, tunnels) et de génie civil complexe. Elle dispose d\'un parc de matériels performants et de bureaux d\'études intégrés. ENGOA intervient sur les grands projets d\'infrastructure ferroviaire et routière à travers tout le territoire national.',
    specialties: ['Ouvrages d\'art', 'Tunnels', 'Ponts & Viaducs', 'Génie Civil', 'Ferroviaire'],
    wilayas: [16, 9, 25, 31, 19],
    wilaya_siege: 16,
    size_range: '200+',
    founded_year: 1983,
    email: 'contact@engoa.dz',
    phone: '+213 21 30 44 55',
    website: null,
    address: 'Hussein Dey, Alger',
    agrement: 'AGR-BTP-003-83',
    is_verified: true,
    is_premium: false,
  },
  {
    name: 'SAPTA — Société Algérienne de Promotion des Travaux',
    slug: 'sapta-btp',
    tagline: 'Bâtiments résidentiels et tertiaires de qualité en Algérie',
    description: 'SAPTA est une entreprise spécialisée dans la promotion immobilière et la construction de bâtiments résidentiels, commerciaux et administratifs. Active depuis plus de 30 ans, elle a livré des milliers de logements sociaux et promotionnels ainsi que des zones d\'activités. SAPTA est certifiée ISO 9001 et dispose d\'un bureau d\'études interne.',
    specialties: ['Gros Œuvre', 'Second Œuvre', 'Logements', 'Bâtiments Administratifs', 'Promotion Immobilière'],
    wilayas: [16, 9, 35, 31],
    wilaya_siege: 16,
    size_range: '51-200',
    founded_year: 1991,
    email: 'sapta@sapta-dz.com',
    phone: '+213 21 77 88 99',
    website: null,
    address: 'El Harrach, Alger',
    agrement: 'AGR-BTP-004-91',
    is_verified: true,
    is_premium: false,
  },
  {
    name: 'GCB — Groupe Construction & Bâtiment',
    slug: 'gcb-groupe',
    tagline: 'De la conception à la livraison — clé en main BTP',
    description: 'GCB est un groupe privé algérien offrant des prestations BTP complètes : études techniques, gros œuvre, second œuvre et gestion de projet. Fort d\'une équipe d\'ingénieurs et de techniciens qualifiés, GCB réalise des projets résidentiels, industriels et touristiques. Le groupe est reconnu pour le respect des délais et la qualité de finition.',
    specialties: ['Gros Œuvre', 'Second Œuvre', 'Étanchéité', 'Revêtements', 'Clé en Main'],
    wilayas: [31, 9, 16, 29],
    wilaya_siege: 31,
    size_range: '51-200',
    founded_year: 2003,
    email: 'contact@gcb-algerie.dz',
    phone: '+213 41 33 22 11',
    website: null,
    address: 'Oran Centre, Oran',
    agrement: 'AGR-BTP-005-03',
    is_verified: true,
    is_premium: false,
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seed entreprises BTP...');

    for (const co of companies) {
      await client.query(
        `INSERT INTO companies
          (slug, name, tagline, description, specialties, wilayas, wilaya_siege,
           size_range, founded_year, email, phone, website, address, agrement,
           is_verified, is_premium, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true)
         ON CONFLICT (slug) DO UPDATE SET
           name=EXCLUDED.name, tagline=EXCLUDED.tagline,
           description=EXCLUDED.description, specialties=EXCLUDED.specialties,
           wilayas=EXCLUDED.wilayas, wilaya_siege=EXCLUDED.wilaya_siege,
           size_range=EXCLUDED.size_range, founded_year=EXCLUDED.founded_year,
           email=EXCLUDED.email, phone=EXCLUDED.phone, website=EXCLUDED.website,
           address=EXCLUDED.address, agrement=EXCLUDED.agrement,
           is_verified=EXCLUDED.is_verified, is_premium=EXCLUDED.is_premium,
           updated_at=NOW()`,
        [
          co.slug, co.name, co.tagline, co.description,
          co.specialties, co.wilayas, co.wilaya_siege,
          co.size_range, co.founded_year, co.email, co.phone,
          co.website, co.address, co.agrement,
          co.is_verified, co.is_premium,
        ]
      );
      console.log(`  ✅ ${co.name}`);
    }

    const { rows } = await client.query('SELECT COUNT(*) FROM companies');
    console.log(`\n🏢 Total entreprises : ${rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
