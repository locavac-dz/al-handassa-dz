require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const CATEGORY_SLUG = 'securite';
const SECTION_TAG   = 'Affichage de securite';

const affiches = [
  {
    title: 'Affiche Consignes de Sécurité Générales',
    slug: 'affiche-consignes-securite-generales',
    docx: 'Affiche_A3_Consignes_Securite_Chantier_Algerie.docx',
    pdf:  'Affiche_A3_Consignes_Securite_Chantier_Algerie.pdf',
    desc: 'Affiche A3 des consignes de sécurité générales à afficher sur le chantier.',
    price: 350, tags: ['affiche', 'securite', 'chantier', SECTION_TAG],
  },
  {
    title: 'Affiche EPI Obligatoires',
    slug: 'affiche-epi-obligatoires',
    docx: 'Affiche_A3_EPI_Obligatoires_Chantier_Algerie.docx',
    pdf:  'Affiche_A3_EPI_Obligatoires_Chantier_Algerie.pdf',
    desc: 'Affiche A3 listant les équipements de protection individuelle obligatoires.',
    price: 300, tags: ['affiche', 'epi', 'securite', SECTION_TAG],
  },
  {
    title: 'Affiche Interdictions de Chantier',
    slug: 'affiche-interdictions-chantier',
    docx: 'Affiche_A3_Interdictions_Chantier_Algerie.docx',
    pdf:  'Affiche_A3_Interdictions_Chantier_Algerie.pdf',
    desc: 'Affiche A3 des interdictions formelles sur le chantier.',
    price: 300, tags: ['affiche', 'interdiction', 'securite', SECTION_TAG],
  },
  {
    title: 'Affiche Numéros d\'Urgence',
    slug: 'affiche-numeros-urgence',
    docx: 'Affiche_A3_Numeros_Urgence_Chantier_Algerie.docx',
    pdf:  'Affiche_A3_Numeros_Urgence_Chantier_Algerie.pdf',
    desc: 'Affiche A3 des numéros d\'urgence à contacter en cas d\'accident.',
    price: 300, tags: ['affiche', 'urgence', 'securite', SECTION_TAG],
  },
  {
    title: 'Affiche Plan d\'Évacuation',
    slug: 'affiche-plan-evacuation',
    docx: 'Affiche_A3_Plan_Evacuation_Chantier_Algerie.docx',
    pdf:  'Affiche_A3_Plan_Evacuation_Chantier_Algerie.pdf',
    desc: 'Affiche A3 du plan d\'évacuation du chantier en cas d\'urgence.',
    price: 400, tags: ['affiche', 'evacuation', 'securite', SECTION_TAG],
  },
  {
    title: 'Affiche Plan Sécurité Incendie',
    slug: 'affiche-plan-securite-incendie',
    docx: 'Affiche_A3_Plan_Securite_Incendie_Algerie.docx',
    pdf:  'Affiche_A3_Plan_Securite_Incendie_Algerie.pdf',
    desc: 'Affiche A3 du plan de sécurité incendie pour le chantier.',
    price: 400, tags: ['affiche', 'incendie', 'securite', SECTION_TAG],
  },
  {
    title: 'Affiche Procédure Accident de Travail',
    slug: 'affiche-procedure-accident-travail',
    docx: 'Affiche_A3_Procedure_Accident_Travail_Algerie.docx',
    pdf:  'Affiche_A3_Procedure_Accident_Travail_Algerie.pdf',
    desc: 'Affiche A3 de la procédure à suivre en cas d\'accident de travail.',
    price: 350, tags: ['affiche', 'accident', 'securite', SECTION_TAG],
  },
  {
    title: 'Affiche Procédure Séisme (RPA)',
    slug: 'affiche-procedure-seisme-rpa',
    docx: 'Affiche_A3_Procedure_Seisme_RPA_Algerie.docx',
    pdf:  'Affiche_A3_Procedure_Seisme_RPA_Algerie.pdf',
    desc: 'Affiche A3 de la procédure à suivre en cas de séisme selon le RPA algérien.',
    price: 350, tags: ['affiche', 'seisme', 'rpa', 'securite', SECTION_TAG],
  },
  {
    title: 'Affiche Tri Sélectif des Déchets',
    slug: 'affiche-tri-selectif-dechets',
    docx: 'Affiche_A3_Tri_Selectif_Chantier_Algerie.docx',
    pdf:  'Affiche_A3_Tri_Selectif_Chantier_Algerie.pdf',
    desc: 'Affiche A3 du tri sélectif des déchets de chantier.',
    price: 300, tags: ['affiche', 'dechets', 'environnement', SECTION_TAG],
  },
];

async function seed() {
  const catRes = await pool.query("SELECT id FROM categories WHERE slug=$1", [CATEGORY_SLUG]);
  if (!catRes.rows.length) {
    console.log('Categorie securite non trouvee — lancez migrate-chantier-types.js d\'abord');
    await pool.end(); return;
  }
  const catId = catRes.rows[0].id;
  console.log(`Categorie securite id=${catId}`);

  let ins = 0, skip = 0;
  for (const a of affiches) {
    const docxPath = `/uploads/docs/affiches/${a.docx}`;
    const pdfPath  = `/uploads/pdfs/affiches-wm/${a.pdf}`;
    const docxFull = path.join(__dirname, 'uploads', 'docs', 'affiches', a.docx);
    const pdfFull  = path.join(__dirname, 'uploads', 'pdfs', 'affiches-wm', a.pdf);

    if (!fs.existsSync(docxFull)) { console.log(`SKIP (no docx) ${a.docx}`); skip++; continue; }
    if (!fs.existsSync(pdfFull))  { console.log(`SKIP (no wm-pdf) ${a.pdf}`); skip++; continue; }

    const exists = await pool.query("SELECT id FROM products WHERE slug=$1", [a.slug]);
    if (exists.rows.length) { console.log(`EXISTS ${a.slug}`); skip++; continue; }

    await pool.query(`
      INSERT INTO products
        (title, slug, description, type, category_id, price, discount_price, is_free, is_active,
         file_url, preview_url, tags, created_at, updated_at)
      VALUES ($1,$2,$3,'document_word',$4,$5,NULL,false,true,$6,$7,$8,NOW(),NOW())
    `, [a.title, a.slug, a.desc, catId, a.price, docxPath, pdfPath, a.tags]);
    console.log(`INSERT ${a.slug}`); ins++;
  }
  console.log(`\nDone: ${ins} inseres, ${skip} ignores`);
  await pool.end();
}

seed().catch(e => { console.error(e.message); process.exit(1); });
