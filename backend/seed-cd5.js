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

const VIDEOS = [
  { title: 'Chantier Maison Individuelle — Suivi Complet de la Construction', description: 'Video CERIB : suivi complet du chantier d\'une maison individuelle en beton — fondations, maconnerie, planchers, toiture et finitions. Vision globale de toutes les etapes de construction.', file: 'cd5-chantier_mi.mp4', duration_seconds: 18*60, level: 'debutant', cat: 'architecture', tags: ['chantier', 'maison individuelle', 'construction', 'beton', 'CERIB'] },
  { title: 'Fabrication des Blocs Beton — Procede Industriel', description: 'Video CERIB : fabrication industrielle des blocs de beton (parpaings) — preparation du melange, vibro-compression, demoulage, sechage et controle qualite.', file: 'cd5-fab_blocs.mp4', duration_seconds: 10*60, level: 'debutant', cat: 'materiaux', tags: ['blocs beton', 'parpaings', 'fabrication', 'vibro-compression', 'CERIB'] },
  { title: 'Fabrication des Dalles de Voirie — Procede Industriel', description: 'Video CERIB : fabrication industrielle des dalles de voirie en beton — coffrage, betonnage, vibration, decoffrage et controle des dimensions.', file: 'cd5-fab_dalle_voirie.mp4', duration_seconds: 8*60, level: 'debutant', cat: 'materiaux', tags: ['dalles voirie', 'fabrication', 'beton', 'CERIB', 'voirie'] },
  { title: 'Fabrication des Poutres Precontraintes — Procede Industriel', description: 'Video CERIB : fabrication des poutres en beton precontraint — mise en tension des cables, betonnage, cure et relachement de la precontrainte.', file: 'cd5-fab_pout_prec.mp4', duration_seconds: 8*60, level: 'intermediaire', cat: 'beton-arme', tags: ['poutres precontraintes', 'prefabrique', 'precontrainte', 'CERIB'] },
  { title: 'Fabrication des Tuiles en Beton — Procede Industriel', description: 'Video CERIB : fabrication industrielle des tuiles en beton — extrusion, pressage, coloration, sechage et controle qualite pour la couverture des maisons.', file: 'cd5-fab_tuiles.mp4', duration_seconds: 10*60, level: 'debutant', cat: 'materiaux', tags: ['tuiles beton', 'couverture', 'fabrication', 'toiture', 'CERIB'] },
  { title: 'Recyclage des Blocs Beton — Economie Circulaire dans la Construction', description: 'Video CERIB : procede de recyclage des blocs de beton de demolition — concassage, criblage, reutilisation en granulats recycles. Economie circulaire et developpement durable.', file: 'cd5-recyclage_blocs.mp4', duration_seconds: 12*60, level: 'intermediaire', cat: 'materiaux', tags: ['recyclage beton', 'economie circulaire', 'granulats recycles', 'CERIB'] },
];

const PDFS = [
  { file: 'cd5-02_introduction.pdf', title: 'Maison Individuelle en Beton — Introduction Generale CERIB', desc: 'Introduction complete au guide CERIB sur la maison individuelle en beton : presentation, reglementation applicable et generalites sur la construction.', cat: 'architecture', level: 'debutant', tags: ['maison individuelle', 'beton', 'introduction', 'CERIB'] },
  { file: 'cd5-11_murs.pdf', title: 'Les Murs de Maison Individuelle — Guide Technique CERIB', desc: 'Guide technique CERIB sur les murs de maisons individuelles en beton : types de murs, blocs beton, isolation thermique integree, liaisons et mise en oeuvre DTU.', cat: 'architecture', level: 'debutant', tags: ['murs', 'blocs beton', 'isolation', 'DTU', 'maison individuelle', 'CERIB'] },
  { file: 'cd5-12_elements_archi.pdf', title: 'Elements Architecturaux — Linteaux, Appuis, Chainages CERIB', desc: 'Guide CERIB sur les elements architecturaux prefabriques en beton : linteaux, appuis de fenetres, chainages horizontaux et verticaux, colonnes.', cat: 'architecture', level: 'debutant', tags: ['linteaux', 'appuis', 'chainages', 'prefabriques', 'CERIB'] },
  { file: 'cd5-13_escaliers.pdf', title: 'Les Escaliers en Beton — Guide de Construction CERIB', desc: 'Guide CERIB sur les escaliers en beton : calcul des girons et contremarches, coffrages, ferraillage, escaliers prefabriques et rampes.', cat: 'architecture', level: 'intermediaire', tags: ['escaliers beton', 'girons', 'ferraillage', 'prefabriques', 'CERIB'] },
  { file: 'cd5-14_conduit_fume.pdf', title: 'Les Conduits de Fumee — Guide Technique CERIB', desc: 'Guide CERIB sur les conduits de fumee : types de conduits, dimensions, raccordements, tirage, reglementation DTU 24 et securite incendie.', cat: 'architecture', level: 'debutant', tags: ['conduits fumee', 'cheminee', 'DTU 24', 'securite incendie', 'CERIB'] },
  { file: 'cd5-20_plancher.pdf', title: 'Les Planchers de Maison Individuelle — Guide CERIB', desc: 'Guide complet CERIB sur les planchers : poutrelles et hourdis, dalles pleines, dalles alveolees — calcul, mise en oeuvre et etaiement.', cat: 'beton-arme', level: 'intermediaire', tags: ['planchers', 'poutrelles hourdis', 'dalles alveolees', 'etaiement', 'CERIB'] },
  { file: 'cd5-30_couverture.pdf', title: 'La Couverture — Toiture de Maison Individuelle CERIB', desc: 'Guide CERIB sur la couverture des maisons : tuiles beton, pentes, debords de toit, gouttieres, egouts et faitages. Mise en oeuvre DTU 40.', cat: 'architecture', level: 'debutant', tags: ['couverture', 'toiture', 'tuiles beton', 'DTU 40', 'CERIB'] },
  { file: 'cd5-40_assainissement.pdf', title: "L'Assainissement — Reseaux Eaux Usees et Pluviales CERIB", desc: 'Guide CERIB sur assainissement maisons individuelles : eaux usees, fosses septiques, epuration, caniveaux, regards et raccordement reseau. DTU 60.', cat: 'architecture', level: 'debutant', tags: ['assainissement', 'eaux usees', 'fosses septiques', 'CERIB', 'DTU 60'] },
  { file: 'cd5-51_allees_terra.pdf', title: 'Allees, Terrasses et Dallages Exterieurs — Guide CERIB', desc: 'Guide CERIB sur les allees, terrasses et dallages exterieurs : dalles beton, pentes evacuation, materiaux et mise en oeuvre pour amenagements exterieurs.', cat: 'architecture', level: 'debutant', tags: ['allees', 'terrasses', 'dallage', 'amenagement exterieur', 'CERIB'] },
  { file: 'cd5-52_clotures.pdf', title: 'Les Clotures en Beton — Guide Technique CERIB', desc: 'Guide CERIB sur les clotures en beton : murs bahut, panneaux prefabriques, piliers, grillages, portails — fondations, mise en oeuvre et reglementation.', cat: 'architecture', level: 'debutant', tags: ['clotures', 'murs bahut', 'panneaux prefabriques', 'CERIB'] },
  { file: 'cd5-53_soutenement.pdf', title: 'Les Murs de Soutenement — Guide CERIB', desc: 'Guide CERIB sur les murs de soutenement : murs poids, murs cantilever, poussees des terres, verification de stabilite et drainage.', cat: 'geotechnique', level: 'intermediaire', tags: ['mur de soutenement', 'poussees terres', 'stabilite', 'CERIB', 'geotechnique'] },
  { file: 'cd5-54_piscines.pdf', title: 'Les Piscines en Beton — Guide de Construction CERIB', desc: 'Guide CERIB sur la construction de piscines en beton : structure, etancheite, filtration, plages, reglementation securite.', cat: 'architecture', level: 'intermediaire', tags: ['piscines beton', 'etancheite', 'filtration', 'securite', 'CERIB'] },
  { file: 'cd5-60_amenage_int.pdf', title: "L'Amenagement Interieur — Cloisons, Plafonds, Revetements CERIB", desc: 'Guide CERIB sur amenagement interieur : cloisons legeres, doublages, plafonds suspendus, revetements sols et murs, menuiseries.', cat: 'architecture', level: 'debutant', tags: ['amenagement interieur', 'cloisons', 'doublages', 'revetements', 'CERIB'] },
  { file: 'cd5-72_thermique.pdf', title: 'Performance Thermique des Maisons Individuelles — Guide CERIB', desc: 'Guide CERIB sur la performance thermique : reglementation thermique, coefficients Ug/Up, ponts thermiques, isolation murs/planchers/toitures.', cat: 'architecture', level: 'intermediaire', tags: ['thermique', 'isolation', 'ponts thermiques', 'CERIB', 'performance energetique'] },
  { file: 'cd5-73_acoustique.pdf', title: 'Performances Acoustiques des Maisons Individuelles — CERIB', desc: 'Guide CERIB sur isolation acoustique : reglementation acoustique, isolation bruits aeriens et impact, facades et planchers.', cat: 'architecture', level: 'intermediaire', tags: ['acoustique', 'isolation phonique', 'bruits impact', 'CERIB'] },
  { file: 'cd5-74_feu.pdf', title: 'Resistance au Feu des Constructions en Beton — Guide CERIB', desc: 'Guide CERIB sur la resistance au feu : classes de resistance REI, comportement du beton en cas incendie, distances securite.', cat: 'architecture', level: 'intermediaire', tags: ['resistance feu', 'REI', 'incendie', 'beton', 'CERIB'] },
  { file: 'cd5-75_seisme.pdf', title: 'Conception Parasismique des Maisons Individuelles — CERIB', desc: 'Guide CERIB sur la conception parasismique : zonage sismique, regles de conception, chainages, ancrage toitures et reglementation PS-MI.', cat: 'parasismique', level: 'intermediaire', tags: ['parasismique', 'seisme', 'chainages', 'zonage', 'PS-MI', 'CERIB'] },
  { file: 'cd5-77_dev_durable.pdf', title: 'Developpement Durable et Construction en Beton — Guide CERIB', desc: 'Guide CERIB sur le developpement durable : cycle de vie, materiaux recycles, empreinte carbone, labels HQE et demarche environnementale.', cat: 'architecture', level: 'debutant', tags: ['developpement durable', 'HQE', 'cycle de vie', 'carbone', 'CERIB'] },
  { file: 'cd5-78_sigles_qualite.pdf', title: 'Labels et Certifications Qualite dans la Construction — CERIB', desc: 'Guide CERIB sur les labels et certifications qualite : NF, ACERMI, Qualitel, HQE, BBC — marques applicables aux materiaux et maisons individuelles.', cat: 'architecture', level: 'debutant', tags: ['labels qualite', 'NF', 'ACERMI', 'Qualitel', 'BBC', 'HQE', 'CERIB'] },
  { file: 'cd5-exemple_de_plu.pdf', title: "Exemple de PLU — Plan Local d'Urbanisme CERIB", desc: "Document CERIB presentant un exemple de PLU : lecture du reglement, zones constructibles, COS, regles de hauteur et d'implantation.", cat: 'architecture', level: 'debutant', tags: ['PLU', 'urbanisme', 'zones constructibles', 'reglementation', 'CERIB'] },
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
    let iv=0, ip=0, sk=0;

    for (const v of VIDEOS) {
      const vPath = `/uploads/videos/${v.file}`;
      if (!fs.existsSync(path.join(__dirname,'uploads','videos',v.file))) { console.log(`⚠️  Manquant: ${v.file}`); sk++; continue; }
      const ex = await client.query('SELECT id FROM videos WHERE video_url=$1',[vPath]);
      if (ex.rows.length) { console.log(`⏭️  Existe: ${v.title}`); sk++; continue; }
      const slug = slugify(v.title)+'-'+Date.now()+Math.floor(Math.random()*1000);
      const catId = cat[v.cat];
      if (!catId) { sk++; continue; }
      await client.query(
        `INSERT INTO videos(title,slug,description,duration_seconds,study_level,category_id,instructor_id,is_free,views_count,video_url,thumbnail_url,tags,source,is_featured,published_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,FALSE,NOW())`,
        [v.title,slug,v.description,v.duration_seconds,v.level,catId,instructorId,true,0,vPath,null,v.tags,'CERIB Maison Individuelle']
      );
      console.log(`✅ Video: ${v.title}`); iv++;
    }

    for (const p of PDFS) {
      const pPath = `/uploads/pdfs/${p.file}`;
      const localPath = path.join(__dirname,'uploads','pdfs',p.file);
      if (!fs.existsSync(localPath)) { console.log(`⚠️  Manquant: ${p.file}`); sk++; continue; }
      const ex = await client.query('SELECT id FROM products WHERE file_url=$1',[pPath]);
      if (ex.rows.length) { console.log(`⏭️  Existe: ${p.title}`); sk++; continue; }
      const slug = slugify(p.title)+'-'+Date.now()+Math.floor(Math.random()*1000);
      const catId = cat[p.cat];
      if (!catId) { sk++; continue; }
      const pages = Math.max(5, Math.round(fs.statSync(localPath).size/15000));
      await client.query(
        `INSERT INTO products(title,slug,description,price,type,study_level,category_id,instructor_id,is_free,is_active,is_featured,file_url,thumbnail_url,pages_count,language,tags)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [p.title,slug,p.desc,0,'cours_pdf',p.level,catId,instructorId,true,true,false,pPath,null,pages,'fr',p.tags]
      );
      console.log(`✅ PDF: ${p.title}`); ip++;
    }

    await client.query('COMMIT');
    console.log(`\n📊 Videos: ${iv} | PDFs: ${ip} | Ignores: ${sk}`);
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('❌', e.message);
  } finally { client.release(); await pool.end(); }
}
seed();
