require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD
});

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,80);
}

const PPTS = [
  { file: 'cd5-ppt-02_introduction.pdf', title: 'Présentation Maison Individuelle en Béton — Introduction CERIB', cat: 'architecture', level: 'debutant', tags: ['maison individuelle', 'beton', 'CERIB', 'presentation', 'introduction'], desc: 'Présentation PowerPoint CERIB d\'introduction à la construction de maisons individuelles en béton : vue d\'ensemble des thèmes couverts, réglementation et généralités.' },
  { file: 'cd5-ppt-11_murs.pdf', title: 'Présentation Les Murs de Maison Individuelle — CERIB', cat: 'architecture', level: 'debutant', tags: ['murs', 'blocs beton', 'isolation', 'DTU', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les murs de maisons individuelles en béton : types, blocs, isolation thermique, liaisons et mise en oeuvre.' },
  { file: 'cd5-ppt-12_elements_archi.pdf', title: 'Présentation Éléments Architecturaux — Linteaux, Appuis, Chaînages CERIB', cat: 'architecture', level: 'debutant', tags: ['linteaux', 'appuis', 'chainages', 'prefabriques', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les éléments architecturaux : linteaux, appuis de fenêtres, chaînages horizontaux et verticaux.' },
  { file: 'cd5-ppt-13_escaliers.pdf', title: 'Présentation Les Escaliers en Béton — CERIB', cat: 'architecture', level: 'intermediaire', tags: ['escaliers beton', 'girons', 'ferraillage', 'prefabriques', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les escaliers en béton : calcul des girons, contremarches, coffrages, ferraillage et escaliers préfabriqués.' },
  { file: 'cd5-ppt-14_conduit_fume.pdf', title: 'Présentation Les Conduits de Fumée — CERIB', cat: 'architecture', level: 'debutant', tags: ['conduits fumee', 'cheminee', 'DTU 24', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les conduits de fumée : types, dimensions, raccordements et réglementation DTU 24.' },
  { file: 'cd5-ppt-20_plancher.pdf', title: 'Présentation Les Planchers de Maison Individuelle — CERIB', cat: 'beton-arme', level: 'intermediaire', tags: ['planchers', 'poutrelles hourdis', 'dalles alveolees', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les planchers : poutrelles et hourdis, dalles alvéolées, calcul, mise en oeuvre et étaiement.' },
  { file: 'cd5-ppt-30_couverture.pdf', title: 'Présentation La Couverture — Toiture Maison Individuelle CERIB', cat: 'architecture', level: 'debutant', tags: ['couverture', 'toiture', 'tuiles beton', 'DTU 40', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur la couverture des maisons : tuiles béton, pentes, débords, gouttières et mise en oeuvre DTU 40.' },
  { file: 'cd5-ppt-40_assainissement.pdf', title: 'Présentation Assainissement — Réseaux Eaux Usées CERIB', cat: 'architecture', level: 'debutant', tags: ['assainissement', 'eaux usees', 'fosses septiques', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur l\'assainissement : réseaux eaux usées, fosses septiques, épuration et raccordement.' },
  { file: 'cd5-ppt-51_allees_terra.pdf', title: 'Présentation Allées, Terrasses et Dallages — CERIB', cat: 'architecture', level: 'debutant', tags: ['allees', 'terrasses', 'dallage', 'amenagement exterieur', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les allées, terrasses et dallages extérieurs pour maisons individuelles.' },
  { file: 'cd5-ppt-52_clotures.pdf', title: 'Présentation Les Clôtures en Béton — CERIB', cat: 'architecture', level: 'debutant', tags: ['clotures', 'murs bahut', 'panneaux prefabriques', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les clôtures : murs bahut, panneaux préfabriqués, piliers et fondations.' },
  { file: 'cd5-ppt-53_soutenement.pdf', title: 'Présentation Murs de Soutènement — CERIB', cat: 'geotechnique', level: 'intermediaire', tags: ['mur de soutenement', 'poussees terres', 'stabilite', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les murs de soutènement : murs poids, cantilever, poussées des terres et stabilité.' },
  { file: 'cd5-ppt-54_piscines.pdf', title: 'Présentation Les Piscines en Béton — CERIB', cat: 'architecture', level: 'intermediaire', tags: ['piscines beton', 'etancheite', 'filtration', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les piscines en béton : structure, étanchéité, filtration et réglementation sécurité.' },
  { file: 'cd5-ppt-60_amenage_int.pdf', title: 'Présentation Aménagement Intérieur — Cloisons et Revêtements CERIB', cat: 'architecture', level: 'debutant', tags: ['amenagement interieur', 'cloisons', 'revetements', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur l\'aménagement intérieur : cloisons, doublages, plafonds suspendus et revêtements.' },
  { file: 'cd5-ppt-71_doc_urba.pdf', title: 'Présentation Documents d\'Urbanisme — PLU et Réglementation CERIB', cat: 'architecture', level: 'debutant', tags: ['PLU', 'urbanisme', 'zones constructibles', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les documents d\'urbanisme : PLU, zones constructibles, COS et règles d\'implantation.' },
  { file: 'cd5-ppt-72_thermique.pdf', title: 'Présentation Performance Thermique Maison Individuelle — CERIB', cat: 'architecture', level: 'intermediaire', tags: ['thermique', 'isolation', 'ponts thermiques', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur la performance thermique : réglementation, coefficients, ponts thermiques et isolation.' },
  { file: 'cd5-ppt-73_acoustique.pdf', title: 'Présentation Performances Acoustiques Maison Individuelle — CERIB', cat: 'architecture', level: 'intermediaire', tags: ['acoustique', 'isolation phonique', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur l\'acoustique des maisons individuelles : réglementation et solutions d\'isolation.' },
  { file: 'cd5-ppt-74_feu.pdf', title: 'Présentation Résistance au Feu des Constructions — CERIB', cat: 'architecture', level: 'intermediaire', tags: ['resistance feu', 'REI', 'incendie', 'beton', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur la résistance au feu des maisons en béton : classes REI et comportement au feu.' },
  { file: 'cd5-ppt-75_seisme.pdf', title: 'Présentation Conception Parasismique Maison Individuelle — CERIB', cat: 'parasismique', level: 'intermediaire', tags: ['parasismique', 'seisme', 'PS-MI', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur la conception parasismique : zonage sismique, règles PS-MI et chaînages.' },
  { file: 'cd5-ppt-76_epi.pdf', title: 'Présentation EPI — Enquête sur la Performance Immobilière CERIB', cat: 'architecture', level: 'debutant', tags: ['EPI', 'performance', 'immobilier', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur l\'enquête de performance immobilière (EPI) des maisons individuelles en béton.' },
  { file: 'cd5-ppt-77_dev_durable.pdf', title: 'Présentation Développement Durable et Construction Béton — CERIB', cat: 'architecture', level: 'debutant', tags: ['developpement durable', 'HQE', 'carbone', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur le développement durable : cycle de vie, empreinte carbone et label HQE.' },
  { file: 'cd5-ppt-78_sigles_qualite.pdf', title: 'Présentation Labels et Certifications Qualité Construction — CERIB', cat: 'architecture', level: 'debutant', tags: ['labels qualite', 'NF', 'ACERMI', 'BBC', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur les labels et certifications qualité de la construction : NF, ACERMI, Qualitel, BBC.' },
  { file: 'cd5-ppt-80_cctp.pdf', title: 'Présentation CCTP Maison Individuelle — Cahier des Clauses CERIB', cat: 'architecture', level: 'intermediaire', tags: ['CCTP', 'cahier clauses', 'marche', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur le Cahier des Clauses Techniques Particulières (CCTP) pour maisons individuelles.' },
  { file: 'cd5-ppt-81_estimation.pdf', title: 'Présentation Estimation du Coût de Construction — CERIB', cat: 'architecture', level: 'debutant', tags: ['estimation', 'cout construction', 'budget', 'CERIB', 'presentation'], desc: 'Présentation PowerPoint CERIB sur l\'estimation du coût de construction d\'une maison individuelle en béton.' },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const catRes = await client.query('SELECT id, slug FROM categories');
    const cat = {};
    for (const r of catRes.rows) cat[r.slug] = r.id;
    const instRes = await client.query('SELECT id FROM instructors LIMIT 1');
    const instructorId = instRes.rows[0]?.id || null;
    let inserted = 0, skipped = 0;

    for (const p of PPTS) {
      const pPath = `/uploads/pdfs/${p.file}`;
      const localPath = path.join(__dirname, 'uploads', 'pdfs', p.file);
      if (!fs.existsSync(localPath)) { console.log(`⚠️  Manquant: ${p.file}`); skipped++; continue; }
      const ex = await client.query('SELECT id FROM products WHERE file_url=$1', [pPath]);
      if (ex.rows.length) { console.log(`⏭️  Existe: ${p.title}`); skipped++; continue; }
      const slug = slugify(p.title) + '-' + Date.now() + Math.floor(Math.random()*1000);
      const catId = cat[p.cat];
      if (!catId) { console.log(`⚠️  Catégorie: ${p.cat}`); skipped++; continue; }
      const pages = Math.max(5, Math.round(fs.statSync(localPath).size / 20000));
      await client.query(
        `INSERT INTO products(title,slug,description,price,type,study_level,category_id,instructor_id,is_free,is_active,is_featured,file_url,thumbnail_url,pages_count,language,tags)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [p.title, slug, p.desc, 0, 'tuto_pdf', p.level, catId, instructorId, true, true, false, pPath, null, pages, 'fr', p.tags]
      );
      console.log(`✅ ${p.title}`);
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`\n📊 ${inserted} présentations insérées | ${skipped} ignorées`);
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('❌', e.message);
  } finally { client.release(); await pool.end(); }
}
seed();
