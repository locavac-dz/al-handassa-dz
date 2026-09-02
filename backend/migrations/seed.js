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

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Instructors ────────────────────────────────────────────────
    console.log('Insertion des instructeurs...');
    const instructorDefs = [
      { first_name: 'Ahmed',   last_name: 'Benali',    email: 'ahmed.benali@handassi.dz',    display_name: 'Dr. Ahmed Benali',    title: 'Docteur en Genie Civil',           institution: 'USTHB Alger',                    bio: 'Specialiste en beton arme et structures, 15 ans experience dans l enseignement superieur algerien.' },
      { first_name: 'Leila',   last_name: 'Khelif',    email: 'leila.khelif@handassi.dz',    display_name: 'Ing. Leila Khelif',   title: 'Ingeniere en Architecture',        institution: 'Universite Polytechnique Alger', bio: 'Architecte DPLG avec 10 ans de pratique en conception bioclimatique et urbanisme durable.' },
      { first_name: 'Mourad',  last_name: 'Haddad',    email: 'mourad.haddad@handassi.dz',   display_name: 'Prof. Mourad Haddad', title: 'Professeur en Geotechnique',       institution: 'ENP Alger',                      bio: 'Professeur titulaire specialise en mecanique des sols et fondations profondes.' },
      { first_name: 'Yasmine', last_name: 'Aouf',      email: 'yasmine.aouf@handassi.dz',    display_name: 'Dr. Yasmine Aouf',    title: 'Docteure en Hydraulique',          institution: 'Universite de Tlemcen',          bio: 'Chercheuse en hydraulique fluviale et gestion des ressources en eau en milieu aride.' },
      { first_name: 'Kamel',   last_name: 'Zerrouki',  email: 'kamel.zerrouki@handassi.dz',  display_name: 'Ing. Kamel Zerrouki', title: 'Expert BIM et Topographie',        institution: 'Consultant Independant',         bio: 'Consultant BIM certifie Autodesk, formateur en logiciels de conception assistee par ordinateur.' },
      { first_name: 'Nadia',   last_name: 'Boukhelef', email: 'nadia.boukhelef@handassi.dz', display_name: 'Prof. Nadia Boukhelef', title: 'Professeure en Genie Sismique',  institution: 'CNERIB Alger',                   bio: 'Experte en parasismique appliquee aux constructions algeriennes, co-auteur du RPA 2003.' },
    ];

    const instructorIds = [];
    for (const def of instructorDefs) {
      const uRes = await client.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, study_level)
         VALUES ($1, $2, $3, $4, 'instructor', 'ingenieur')
         ON CONFLICT (email) DO UPDATE SET role = 'instructor'
         RETURNING id`,
        [def.first_name, def.last_name, def.email, '$2b$10$fakehashedpassword00000000000000000000000000000']
      );
      const userId = uRes.rows[0].id;

      const existRes = await client.query(
        'SELECT id FROM instructors WHERE user_id = $1', [userId]
      );
      let iRes;
      if (existRes.rows.length > 0) {
        iRes = existRes;
      } else {
        iRes = await client.query(
          `INSERT INTO instructors (user_id, display_name, title, institution, bio, is_verified)
           VALUES ($1, $2, $3, $4, $5, true)
           RETURNING id`,
          [userId, def.display_name, def.title, def.institution, def.bio]
        );
      }
      instructorIds.push(iRes.rows[0].id);
    }
    console.log('  ' + instructorIds.length + ' instructeurs inseres');

    // ── Categories map ─────────────────────────────────────────────
    const catRes = await client.query('SELECT id, slug FROM categories');
    const cat = {};
    for (const r of catRes.rows) cat[r.slug] = r.id;

    // ── Products ───────────────────────────────────────────────────
    console.log('Insertion des produits...');
    const products = [
      {
        title: 'Beton Arme Cours Complet RPA 2003',
        description: 'Cours complet sur le calcul des structures en beton arme selon les normes algeriennes RPA 2003 et BAEL 91. Comprend 320 pages de theorie, exemples et exercices corriges.',
        price: 1200,
        discount_price: 890,
        type: 'cours_pdf',
        study_level: 'intermediaire',
        category_id: cat['beton-arme'],
        instructor_id: instructorIds[0],
        is_free: false,
        is_featured: true,
        pages_count: 320,
        language: 'fr',
        tags: ['RPA2003', 'BAEL91', 'beton', 'structures'],
      },
      {
        title: 'Guide Pratique AutoCAD pour Ingenieurs',
        description: 'Maitrisez AutoCAD de zero a expert pour le dessin technique en genie civil et architecture. Inclut 50 exercices pratiques avec fichiers DWG telechargeable.',
        price: 0,
        discount_price: null,
        type: 'cours_pdf',
        study_level: 'debutant',
        category_id: cat['logiciels'],
        instructor_id: instructorIds[4],
        is_free: true,
        is_featured: true,
        pages_count: 180,
        language: 'fr',
        tags: ['AutoCAD', 'dessin technique', 'DAO', 'gratuit'],
      },
      {
        title: 'Mecanique des Sols Fondamentaux et Applications',
        description: 'Cours exhaustif de geotechnique couvrant la classification des sols, la consolidation, la resistance au cisaillement et le dimensionnement des fondations superficielles et profondes.',
        price: 1500,
        discount_price: 1200,
        type: 'ouvrage',
        study_level: 'avance',
        category_id: cat['geotechnique'],
        instructor_id: instructorIds[2],
        is_free: false,
        is_featured: true,
        pages_count: 410,
        language: 'fr',
        tags: ['geotechnique', 'mecanique sols', 'fondations', 'Terzaghi'],
      },
      {
        title: 'Hydraulique Generale Cours et Exercices',
        description: 'Principes fondamentaux de hydraulique en charge et a surface libre. Equations de Bernoulli, pertes de charge, ecoulement en canaux, calcul des reseaux AEP.',
        price: 950,
        discount_price: null,
        type: 'cours_pdf',
        study_level: 'intermediaire',
        category_id: cat['hydraulique'],
        instructor_id: instructorIds[3],
        is_free: false,
        is_featured: false,
        pages_count: 280,
        language: 'fr',
        tags: ['hydraulique', 'Bernoulli', 'AEP', 'canaux'],
      },
      {
        title: 'Architecture Bioclimatique en Algerie',
        description: 'Conception architecturale adaptee au climat algerien : protection solaire, ventilation naturelle, materiaux locaux, et integration des energies renouvelables dans le batiment.',
        price: 1100,
        discount_price: 850,
        type: 'ouvrage',
        study_level: 'avance',
        category_id: cat['architecture'],
        instructor_id: instructorIds[1],
        is_free: false,
        is_featured: true,
        pages_count: 240,
        language: 'fr',
        tags: ['architecture', 'bioclimatique', 'energie', 'durabilite'],
      },
      {
        title: 'Parasismique Application du RPA 2003 Revise',
        description: 'Manuel pratique du regllement parasismique algerien RPA 2003 version 2010. Calcul des efforts sismiques, dispositions constructives et cas etude detailles.',
        price: 1350,
        discount_price: 1100,
        type: 'normes',
        study_level: 'avance',
        category_id: cat['parasismique'],
        instructor_id: instructorIds[5],
        is_free: false,
        is_featured: true,
        pages_count: 350,
        language: 'fr',
        tags: ['RPA2003', 'parasismique', 'seisme', 'Algerie'],
      },
      {
        title: 'Technologie du Batiment BTS Genie Civil',
        description: 'Cours complet pour les etudiants BTS genie civil : materiaux de construction, procedes de mise en oeuvre, plans de coffrage et armatures, organisation de chantier.',
        price: 0,
        discount_price: null,
        type: 'cours_pdf',
        study_level: 'debutant',
        category_id: cat['beton-arme'],
        instructor_id: instructorIds[0],
        is_free: true,
        is_featured: false,
        pages_count: 195,
        language: 'fr',
        tags: ['BTS', 'technologie', 'batiment', 'chantier', 'gratuit'],
      },
      {
        title: 'Pack BIM Revit Architecture Niveau Avance',
        description: 'Formation complete Revit Architecture pour la modelisation BIM des batiments. De la conception jusqu au rendu photo-realiste, en passant par les plans de phase et la coordination.',
        price: 2500,
        discount_price: 1990,
        type: 'pack',
        study_level: 'avance',
        category_id: cat['logiciels'],
        instructor_id: instructorIds[4],
        is_free: false,
        is_featured: true,
        pages_count: null,
        language: 'fr',
        tags: ['BIM', 'Revit', 'modelisation', '3D', 'Autodesk'],
      },
      {
        title: 'Topographie et Methodes de Leve',
        description: 'Techniques modernes de leve topographique : station totale, GPS differentiel, nivellement, implantation. Exercices pratiques pour terrain et restitution cartographique.',
        price: 1050,
        discount_price: null,
        type: 'cours_pdf',
        study_level: 'intermediaire',
        category_id: cat['topographie'],
        instructor_id: instructorIds[4],
        is_free: false,
        is_featured: false,
        pages_count: 220,
        language: 'fr',
        tags: ['topographie', 'station totale', 'GPS', 'leve', 'cartographie'],
      },
    ];

    for (const p of products) {
      const slug = slugify(p.title) + '-' + Date.now() + Math.floor(Math.random() * 1000);
      await client.query(
        `INSERT INTO products
           (title, slug, description, price, discount_price, type, study_level,
            category_id, instructor_id, is_free, is_featured, pages_count, language, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          p.title, slug, p.description, p.price, p.discount_price, p.type, p.study_level,
          p.category_id, p.instructor_id, p.is_free, p.is_featured,
          p.pages_count, p.language, p.tags,
        ]
      );
    }
    console.log('  ' + products.length + ' produits inseres');

    // ── Videos ────────────────────────────────────────────────────
    console.log('Insertion des videos...');
    const videos = [
      {
        title: 'Introduction au Calcul des Poutres en Beton Arme',
        description: 'Lecon video sur le calcul a la flexion simple des poutres rectangulaires selon le BAEL 91. Exemples numeriques pas a pas avec correction detaillee.',
        duration_seconds: 45 * 60,
        study_level: 'intermediaire',
        category_id: cat['beton-arme'],
        instructor_id: instructorIds[0],
        is_free: true,
        views_count: 1240,
        video_url: 'https://example.com/videos/poutres-bael91',
        tags: ['beton arme', 'poutres', 'BAEL91', 'calcul'],
        is_featured: true,
      },
      {
        title: 'Essai Proctor Mecanique des Sols Pratique',
        description: 'Demonstration complete de essai Proctor normal et modifie en laboratoire. Interpretation des courbes et application au compactage en remblai routier.',
        duration_seconds: 32 * 60,
        study_level: 'intermediaire',
        category_id: cat['geotechnique'],
        instructor_id: instructorIds[2],
        is_free: true,
        views_count: 876,
        video_url: 'https://example.com/videos/essai-proctor',
        tags: ['geotechnique', 'Proctor', 'laboratoire', 'compactage'],
        is_featured: false,
      },
      {
        title: 'Modelisation BIM avec Revit Demarrage Rapide',
        description: 'Premiers pas avec Autodesk Revit : interface, navigation, creation des niveaux, grilles et murs structuraux. Ideal pour debuter la modelisation BIM.',
        duration_seconds: 60 * 60,
        study_level: 'debutant',
        category_id: cat['logiciels'],
        instructor_id: instructorIds[4],
        is_free: false,
        views_count: 2100,
        video_url: 'https://example.com/videos/revit-debut',
        tags: ['BIM', 'Revit', 'modelisation', 'debutant'],
        is_featured: true,
      },
      {
        title: 'Calcul Sismique RPA 2003 Methode Statique Equivalente',
        description: 'Application complete de la methode statique equivalente du RPA 2003 sur un batiment R+5 a Alger. Determination des forces sismiques et verifications reglementaires.',
        duration_seconds: 75 * 60,
        study_level: 'avance',
        category_id: cat['parasismique'],
        instructor_id: instructorIds[5],
        is_free: false,
        views_count: 653,
        video_url: 'https://example.com/videos/rpa2003-statique',
        tags: ['RPA2003', 'sismique', 'statique equivalente'],
        is_featured: false,
      },
      {
        title: 'Lecture de Plans Architecture Guide Complet',
        description: 'Apprendre a lire et interpreter les plans architecture : plan de masse, situation, niveaux, coupes, facades et nomenclature des elements.',
        duration_seconds: 50 * 60,
        study_level: 'debutant',
        category_id: cat['architecture'],
        instructor_id: instructorIds[1],
        is_free: true,
        views_count: 3450,
        video_url: 'https://example.com/videos/lecture-plans',
        tags: ['architecture', 'plans', 'lecture', 'dessin'],
        is_featured: true,
      },
      {
        title: 'Hydraulique Calcul des Pertes de Charge',
        description: 'Methodes de calcul des pertes de charge regulieres et singulieres dans les reseaux de distribution eau potable. Exercices corriges.',
        duration_seconds: 40 * 60,
        study_level: 'intermediaire',
        category_id: cat['hydraulique'],
        instructor_id: instructorIds[3],
        is_free: false,
        views_count: 489,
        video_url: 'https://example.com/videos/pertes-charge',
        tags: ['hydraulique', 'pertes de charge', 'Darcy', 'AEP'],
        is_featured: false,
      },
    ];

    for (const v of videos) {
      const slug = slugify(v.title) + '-' + Date.now() + Math.floor(Math.random() * 1000);
      await client.query(
        `INSERT INTO videos
           (title, slug, description, duration_seconds, study_level, category_id, instructor_id,
            is_free, views_count, video_url, tags, is_featured, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())`,
        [
          v.title, slug, v.description, v.duration_seconds, v.study_level,
          v.category_id, v.instructor_id, v.is_free, v.views_count,
          v.video_url, v.tags, v.is_featured,
        ]
      );
    }
    console.log('  ' + videos.length + ' videos inserees');

    // ── Articles ───────────────────────────────────────────────────
    console.log('Insertion des articles...');
    const articles = [
      {
        title: 'Impact du Seisme de 2003 sur les Normes Parasismiques Algeriennes',
        excerpt: 'Analyse des lecons tirees du seisme de Boumerdes 2003 et leur impact sur la revision du RPA 2003 version 2010.',
        content: 'Le seisme de Boumerdes du 21 mai 2003 a mis en evidence des lacunes importantes dans la conception parasismique des batiments algeriens. Cet article analyse les dommages observes et les modifications apportees au RPA 2003 pour renforcer la securite sismique.',
        study_level: 'avance',
        category_id: cat['parasismique'],
        author_id: instructorIds[5],
        is_published: true,
        views_count: 1567,
        read_time_min: 12,
        tags: ['seisme', 'Boumerdes', 'RPA2003', 'parasismique', 'Algerie'],
        bibliography: ['RPA 2003 version 2010', 'CTC Alger', 'CRAAG'],
      },
      {
        title: 'Materiaux Locaux et Construction Durable en Algerie',
        excerpt: 'Etude sur utilisation des materiaux de construction locaux pour reduire empreinte carbone du secteur batiment en Algerie.',
        content: 'Face aux enjeux climatiques et a la disponibilite des matieres premieres, le recours aux materiaux locaux represente une voie prometteuse pour une construction plus durable en Algerie.',
        study_level: 'intermediaire',
        category_id: cat['architecture'],
        author_id: instructorIds[1],
        is_published: true,
        views_count: 892,
        read_time_min: 8,
        tags: ['materiaux locaux', 'durabilite', 'pise', 'pierre', 'Algerie'],
        bibliography: ['DTR B2.2', 'CNERIB', 'Ministere de Habitat'],
      },
      {
        title: 'Gestion des Eaux Pluviales en Milieu Urbain Algerien',
        excerpt: 'Approches techniques et reglementaires pour la gestion durable des eaux pluviales dans les villes algeriennes face aux inondations recurrentes.',
        content: 'Les inondations urbaines constituent un risque majeur dans de nombreuses villes algeriennes. Cet article presente les techniques alternatives de gestion des eaux pluviales adaptees aux conditions climatiques locales.',
        study_level: 'avance',
        category_id: cat['hydraulique'],
        author_id: instructorIds[3],
        is_published: true,
        views_count: 734,
        read_time_min: 10,
        tags: ['eaux pluviales', 'inondations', 'urbanisme', 'drainage'],
        bibliography: ['ADE', 'Ministere des Ressources en Eau'],
      },
      {
        title: 'Beton a Hautes Performances pour les Ouvrages Art Algeriens',
        excerpt: 'Formulation et mise en oeuvre des betons a hautes performances dans le contexte algerien : adjuvants, granulats locaux, cure et controle qualite.',
        content: 'Les betons a hautes performances offrent des avantages significatifs en termes de durabilite et de resistance mecanique pour les ouvrages soumis a des environnements agressifs. Cette etude propose des formulations adaptees aux granulats algeriens.',
        study_level: 'avance',
        category_id: cat['beton-arme'],
        author_id: instructorIds[0],
        is_published: true,
        views_count: 1123,
        read_time_min: 15,
        tags: ['BHP', 'beton hautes performances', 'ouvrages art', 'formulation'],
        bibliography: ['EN 206', 'DTR B C 2.41', 'LCPC'],
      },
      {
        title: 'Compactage et Controle des Remblais Routiers en Algerie',
        excerpt: 'Guide pratique du compactage des remblais routiers : choix des engins, controle par essais Proctor, criteres acceptation selon normes algeriennes.',
        content: 'La qualite du compactage des remblais est determinante pour la durabilite des infrastructures routieres. Ce guide presente les methodes de controle en usage sur les chantiers algeriens et les criteres du LNTPB.',
        study_level: 'intermediaire',
        category_id: cat['geotechnique'],
        author_id: instructorIds[2],
        is_published: true,
        views_count: 2341,
        read_time_min: 9,
        tags: ['compactage', 'remblais', 'routes', 'Proctor', 'LNTPB'],
        bibliography: ['LNTPB', 'SETRA', 'GTR francais adapte'],
      },
      {
        title: 'Integration du BIM dans les Projets de Construction en Algerie',
        excerpt: 'Etat des lieux de adoption du BIM en Algerie : freins, opportunites, retours experience et feuille de route pour les entreprises.',
        content: 'Le Building Information Modeling transforme la maniere de concevoir, construire et gerer les ouvrages. En Algerie, son adoption reste encore timide mais les initiatives se multiplient.',
        study_level: 'avance',
        category_id: cat['logiciels'],
        author_id: instructorIds[4],
        is_published: true,
        views_count: 987,
        read_time_min: 11,
        tags: ['BIM', 'numerique', 'Algerie', 'transformation', 'BTP'],
        bibliography: ['buildingSMART', 'NF EN ISO 19650', 'LTPB'],
      },
    ];

    for (const a of articles) {
      const slug = slugify(a.title) + '-' + Date.now() + Math.floor(Math.random() * 1000);
      await client.query(
        `INSERT INTO articles
           (title, slug, excerpt, content, category_id, author_id,
            is_published, views_count, read_time_min, tags, bibliography, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())`,
        [
          a.title, slug, a.excerpt, a.content,
          a.category_id, a.author_id, a.is_published, a.views_count,
          a.read_time_min, a.tags, a.bibliography,
        ]
      );
    }
    console.log('  ' + articles.length + ' articles inseres');

    await client.query('COMMIT');
    console.log('\nBase de donnees peuplee avec succes !');
    console.log('  - 6 instructeurs');
    console.log('  - 9 produits (PDF, packs, normes)');
    console.log('  - 6 videos');
    console.log('  - 6 articles scientifiques');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
