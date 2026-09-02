require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD
});

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

const DOCUMENTS = [
  // ─── 1. Autorisation & Documents administratifs ───────────────────────────
  {
    file: 'Permis_Construire_Algerie.pdf',
    docx: 'Permis_Construire_Algerie.docx',
    title: 'Permis de Construire — Modèle Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 350,
    tags: ['permis construire', 'autorisation', 'urbanisme', 'Algérie', 'administratif'],
    desc: 'Modèle complet de demande de permis de construire conforme à la réglementation algérienne. Comprend toutes les rubriques obligatoires, les pièces à joindre et les formulaires administratifs.',
    section: '1. Autorisation & Documents administratifs'
  },
  {
    file: 'Certificat_Urbanisme_Algerie.pdf',
    docx: 'Certificat_Urbanisme_Algerie.docx',
    title: 'Certificat d\'Urbanisme — Modèle Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 250,
    tags: ['certificat urbanisme', 'CU', 'autorisation', 'Algérie'],
    desc: 'Modèle de demande de certificat d\'urbanisme pour tout projet de construction en Algérie. Document préalable indispensable pour connaître les règles applicables à un terrain.',
    section: '1. Autorisation & Documents administratifs'
  },
  {
    file: 'Declaration_Travaux_Algerie.pdf',
    docx: 'Declaration_Travaux_Algerie.docx',
    title: 'Déclaration de Travaux — Modèle Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 200,
    tags: ['déclaration travaux', 'autorisation', 'Algérie', 'administratif'],
    desc: 'Modèle de déclaration préalable de travaux pour les constructions ou modifications ne nécessitant pas de permis de construire. Conforme aux exigences administratives algériennes.',
    section: '1. Autorisation & Documents administratifs'
  },
  {
    file: 'Declaration_Ouverture_Chantier_Algerie.pdf',
    docx: 'Declaration_Ouverture_Chantier_Algerie.docx',
    title: 'Déclaration d\'Ouverture de Chantier — Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 200,
    tags: ['ouverture chantier', 'DOC', 'déclaration', 'Algérie'],
    desc: 'Document officiel de déclaration d\'ouverture de chantier à déposer auprès des autorités compétentes avant le début des travaux en Algérie.',
    section: '1. Autorisation & Documents administratifs'
  },
  {
    file: 'Assurance_Decennale_Entreprise_Algerie.pdf',
    docx: 'Assurance_Decennale_Entreprise_Algerie.docx',
    title: 'Assurance Décennale Entreprise — Modèle Algérie',
    cat: 'gestion-projet', level: 'intermediaire', price: 400,
    tags: ['assurance décennale', 'garantie', 'entreprise BTP', 'Algérie'],
    desc: 'Modèle de contrat et attestation d\'assurance décennale pour les entreprises du BTP en Algérie. Couvre la responsabilité décennale des constructeurs conformément au code civil algérien.',
    section: '1. Autorisation & Documents administratifs'
  },
  {
    file: 'Assurance_Dommages_Ouvrage_Algerie.pdf',
    docx: 'Assurance_Dommages_Ouvrage_Algerie.docx',
    title: 'Assurance Dommages-Ouvrage — Modèle Algérie',
    cat: 'gestion-projet', level: 'intermediaire', price: 400,
    tags: ['assurance dommages ouvrage', 'DO', 'maître ouvrage', 'Algérie'],
    desc: 'Modèle d\'assurance dommages-ouvrage pour le maître d\'ouvrage en Algérie. Garantit la réparation rapide des dommages relevant de la garantie décennale sans attendre une décision de justice.',
    section: '1. Autorisation & Documents administratifs'
  },

  // ─── 2. Organisation et sécurité de chantier ─────────────────────────────
  {
    file: 'PGC_Plan_General_Coordination_Algerie.pdf',
    docx: 'PGC_Plan_General_Coordination_Algerie.docx',
    title: 'PGC — Plan Général de Coordination Sécurité Algérie',
    cat: 'securite', level: 'avance', price: 600,
    tags: ['PGC', 'sécurité chantier', 'coordination', 'prévention', 'Algérie'],
    desc: 'Plan Général de Coordination (PGC) complet pour chantiers algériens. Document obligatoire rédigé par le CSPS, couvre l\'organisation générale du chantier, les risques spécifiques, les mesures de prévention et les consignes de sécurité.',
    section: '2. Organisation et sécurité de chantier'
  },
  {
    file: 'PPSPS_PHS_Algerie.pdf',
    docx: 'PPSPS_PHS_Algerie.docx',
    title: 'PPSPS / PHS — Plan Particulier de Sécurité Algérie',
    cat: 'securite', level: 'avance', price: 550,
    tags: ['PPSPS', 'PHS', 'sécurité', 'entreprise', 'Algérie'],
    desc: 'Plan Particulier de Sécurité et de Protection de la Santé (PPSPS) / Plan Hygiène Sécurité (PHS) pour entreprises intervenant sur chantier en Algérie. Document obligatoire listant les risques propres à chaque entreprise.',
    section: '2. Organisation et sécurité de chantier'
  },
  {
    file: 'DUERP_Algerie.pdf',
    docx: 'DUERP_Algerie.docx',
    title: 'DUERP — Document Unique d\'Évaluation des Risques Algérie',
    cat: 'securite', level: 'intermediaire', price: 500,
    tags: ['DUERP', 'évaluation risques', 'hygiène sécurité', 'Algérie'],
    desc: 'Document Unique d\'Évaluation des Risques Professionnels (DUERP) adapté aux entreprises BTP algériennes. Comprend la grille d\'évaluation des risques, la cotation et le plan d\'actions de prévention.',
    section: '2. Organisation et sécurité de chantier'
  },
  {
    file: 'Registre_Personnel_Chantier_Algerie.pdf',
    docx: 'Registre_Personnel_Chantier_Algerie.docx',
    title: 'Registre du Personnel de Chantier — Algérie',
    cat: 'securite', level: 'debutant', price: 300,
    tags: ['registre personnel', 'chantier', 'RH', 'CNAS', 'Algérie'],
    desc: 'Registre complet du personnel présent sur chantier conforme aux exigences de la réglementation algérienne du travail. Suivi des entrées/sorties, qualifications, formations sécurité et affiliations CNAS/CACOBATPH.',
    section: '2. Organisation et sécurité de chantier'
  },
  {
    file: 'Attestation_Vigilance_CNAS_CACOBATPH_Algerie.pdf',
    docx: 'Attestation_Vigilance_CNAS_CACOBATPH_Algerie.docx',
    title: 'Attestation de Vigilance CNAS/CACOBATPH — Algérie',
    cat: 'securite', level: 'debutant', price: 250,
    tags: ['CNAS', 'CACOBATPH', 'attestation vigilance', 'cotisations', 'Algérie'],
    desc: 'Modèle d\'attestation de vigilance CNAS et CACOBATPH pour entreprises du BTP algériennes. Document justifiant la régularité des cotisations sociales exigé dans le cadre des marchés publics et privés.',
    section: '2. Organisation et sécurité de chantier'
  },
  {
    file: 'Declaration_Accident_Travail_Algerie.pdf',
    docx: 'Declaration_Accident_Travail_Algerie.docx',
    title: 'Déclaration d\'Accident du Travail — Algérie',
    cat: 'securite', level: 'debutant', price: 200,
    tags: ['accident travail', 'déclaration', 'CNAS', 'Algérie'],
    desc: 'Formulaire de déclaration d\'accident du travail conforme aux exigences de la CNAS algérienne. Document à remplir dans les 24h suivant l\'accident et à transmettre à l\'organisme de sécurité sociale.',
    section: '2. Organisation et sécurité de chantier'
  },

  // ─── 3. Suivi et contrôle en cours des travaux ────────────────────────────
  {
    file: 'Journal_Chantier_Algerie.pdf',
    docx: 'Journal_Chantier_Algerie.docx',
    title: 'Journal de Chantier — Modèle Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 300,
    tags: ['journal chantier', 'suivi travaux', 'cahier chantier', 'Algérie'],
    desc: 'Modèle complet de journal de chantier pour documenter quotidiennement l\'avancement des travaux, les effectifs présents, les conditions météo, les incidents et décisions prises sur le chantier.',
    section: '3. Suivi et contrôle en cours des travaux'
  },
  {
    file: 'CRC_Compte_Rendu_Chantier_Algerie.pdf',
    docx: 'CRC_Compte_Rendu_Chantier_Algerie.docx',
    title: 'CRC — Compte Rendu de Chantier — Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 300,
    tags: ['compte rendu chantier', 'CRC', 'réunion chantier', 'Algérie'],
    desc: 'Modèle de compte rendu de réunion de chantier professionnel. Structure les points abordés, les décisions prises, les réserves formulées et les actions à mener avec responsables et délais.',
    section: '3. Suivi et contrôle en cours des travaux'
  },
  {
    file: 'Planning_Avancement_Travaux_Algerie.pdf',
    docx: 'Planning_Avancement_Travaux_Algerie.docx',
    title: 'Planning d\'Avancement des Travaux — Algérie',
    cat: 'gestion-projet', level: 'intermediaire', price: 400,
    tags: ['planning travaux', 'avancement', 'diagramme Gantt', 'Algérie'],
    desc: 'Modèle de planning d\'avancement des travaux avec diagramme de Gantt intégré. Permet le suivi des corps d\'état, des jalons contractuels et l\'identification des retards et des marges.',
    section: '3. Suivi et contrôle en cours des travaux'
  },

  // ─── 4. Gestion des sous-traitants & matériaux ────────────────────────────
  {
    file: 'Contrat_Sous_Traitance_BTP_Algerie.pdf',
    docx: 'Contrat_Sous_Traitance_BTP_Algerie.docx',
    title: 'Contrat de Sous-Traitance BTP — Algérie',
    cat: 'gestion-projet', level: 'avance', price: 700,
    tags: ['sous-traitance', 'contrat', 'BTP', 'marché', 'Algérie'],
    desc: 'Contrat de sous-traitance complet pour le secteur BTP algérien. Inclus les clauses essentielles : objet, délais, prix, pénalités de retard, réception, garanties et règlement des litiges selon le droit algérien.',
    section: '4. Gestion des sous-traitants & matériaux'
  },
  {
    file: 'Bon_Livraison_Materiaux_Chantier_Algerie.pdf',
    docx: 'Bon_Livraison_Materiaux_Chantier_Algerie.docx',
    title: 'Bon de Livraison Matériaux de Chantier — Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 200,
    tags: ['bon livraison', 'matériaux', 'réception', 'chantier', 'Algérie'],
    desc: 'Modèle de bon de livraison pour réceptionner les matériaux sur chantier. Comprend la désignation des matériaux, quantités, références, état à la réception et signatures des parties.',
    section: '4. Gestion des sous-traitants & matériaux'
  },
  {
    file: 'Situation_Travaux_Algerie.pdf',
    docx: 'Situation_Travaux_Algerie.docx',
    title: 'Situation de Travaux — Modèle Algérie',
    cat: 'gestion-projet', level: 'intermediaire', price: 400,
    tags: ['situation travaux', 'décompte', 'facturation', 'BTP', 'Algérie'],
    desc: 'Modèle de situation de travaux (décompte mensuel) pour facturation progressive des travaux en Algérie. Suivi des quantités réalisées, des prix unitaires, des acomptes versés et du solde restant dû.',
    section: '4. Gestion des sous-traitants & matériaux'
  },

  // ─── 5. Réception & remise des documents ─────────────────────────────────
  {
    file: 'PV_Reception_Travaux_Algerie.pdf',
    docx: 'PV_Reception_Travaux_Algerie.docx',
    title: 'PV de Réception des Travaux — Algérie',
    cat: 'gestion-projet', level: 'intermediaire', price: 450,
    tags: ['PV réception', 'réception travaux', 'garanties', 'Algérie'],
    desc: 'Procès-verbal de réception des travaux conforme au droit de la construction algérien. Formalise la prise de possession par le maître d\'ouvrage, les réserves éventuelles et le point de départ des garanties légales.',
    section: '5. Réception & remise des documents'
  },
  {
    file: 'PV_Levee_Reserves_Algerie.pdf',
    docx: 'PV_Levee_Reserves_Algerie.docx',
    title: 'PV de Levée des Réserves — Algérie',
    cat: 'gestion-projet', level: 'intermediaire', price: 350,
    tags: ['levée réserves', 'PV', 'réception', 'Algérie'],
    desc: 'Procès-verbal de levée des réserves pour constater la correction des défauts signalés lors de la réception des travaux. Document indispensable pour déclencher le paiement du solde.',
    section: '5. Réception & remise des documents'
  },
  {
    file: 'PV_Mise_En_Service_Essais_Techniques_Algerie.pdf',
    docx: 'PV_Mise_En_Service_Essais_Techniques_Algerie.docx',
    title: 'PV de Mise en Service & Essais Techniques — Algérie',
    cat: 'gestion-projet', level: 'avance', price: 450,
    tags: ['mise en service', 'essais techniques', 'PV', 'Algérie'],
    desc: 'Procès-verbal de mise en service et d\'essais techniques pour les installations de bâtiment (électricité, plomberie, chauffage, climatisation). Confirme la conformité des équipements aux normes algériennes.',
    section: '5. Réception & remise des documents'
  },
  {
    file: 'Attestations_Conformite_Algerie.pdf',
    docx: 'Attestations_Conformite_Algerie.docx',
    title: 'Attestation de Conformité des Travaux — Algérie',
    cat: 'gestion-projet', level: 'intermediaire', price: 350,
    tags: ['conformité', 'attestation', 'travaux', 'Algérie'],
    desc: 'Modèle d\'attestation de conformité des travaux aux plans et cahiers des charges approuvés. Document indispensable pour l\'obtention du permis d\'habiter et la régularisation administrative.',
    section: '5. Réception & remise des documents'
  },
  {
    file: 'Declaration_Achevement_Travaux_Algerie.pdf',
    docx: 'Declaration_Achevement_Travaux_Algerie.docx',
    title: 'Déclaration d\'Achèvement des Travaux — Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 200,
    tags: ['achèvement travaux', 'déclaration', 'DAT', 'Algérie'],
    desc: 'Formulaire de déclaration d\'achèvement des travaux (DAT) à déposer auprès des autorités compétentes en Algérie. Étape obligatoire pour l\'obtention du certificat de conformité et du permis d\'habiter.',
    section: '5. Réception & remise des documents'
  },
  {
    file: 'DOE_Dossier_Ouvrages_Executes_Algerie.pdf',
    docx: 'DOE_Dossier_Ouvrages_Executes_Algerie.docx',
    title: 'DOE — Dossier des Ouvrages Exécutés — Algérie',
    cat: 'gestion-projet', level: 'avance', price: 500,
    tags: ['DOE', 'dossier ouvrages', 'plans conformes', 'Algérie'],
    desc: 'Trame complète du Dossier des Ouvrages Exécutés (DOE) pour chantiers algériens. Répertorie les plans conformes à l\'exécution, fiches techniques des équipements, notices d\'entretien et garanties fabricants.',
    section: '5. Réception & remise des documents'
  },

  // ─── 6. Documents RH & Formation ─────────────────────────────────────────
  {
    file: 'CACES_Habilitation_Engins_BTP_Algerie.pdf',
    docx: 'CACES_Habilitation_Engins_BTP_Algerie.docx',
    title: 'CACES & Habilitation Engins BTP — Modèle Algérie',
    cat: 'securite', level: 'intermediaire', price: 450,
    tags: ['CACES', 'habilitation', 'engins BTP', 'conducteur engin', 'Algérie'],
    desc: 'Modèle de suivi des certifications CACES et habilitations pour la conduite d\'engins de chantier en Algérie. Gestion des échéances de renouvellement et des formations réglementaires.',
    section: '6. Documents RH & Formation'
  },
  {
    file: 'CACES_Habilitation_Engins_BTP_Algerie_1.pdf',
    docx: 'CACES_Habilitation_Engins_BTP_Algerie_1.docx',
    title: 'CACES & Habilitation Engins BTP — Attestation individuelle Algérie',
    cat: 'securite', level: 'intermediaire', price: 350,
    tags: ['CACES', 'attestation individuelle', 'engins BTP', 'Algérie'],
    desc: 'Modèle d\'attestation individuelle de certification CACES et d\'habilitation pour opérateurs d\'engins BTP en Algérie. Document nominatif à remettre à chaque opérateur certifié.',
    section: '6. Documents RH & Formation'
  },
  {
    file: 'SST_Sauveteur_Secouriste_Travail_Algerie.pdf',
    docx: 'SST_Sauveteur_Secouriste_Travail_Algerie.docx',
    title: 'SST — Sauveteur Secouriste du Travail — Algérie',
    cat: 'securite', level: 'debutant', price: 300,
    tags: ['SST', 'secouriste travail', 'premiers secours', 'formation', 'Algérie'],
    desc: 'Dossier complet Sauveteur Secouriste du Travail (SST) pour les chantiers BTP algériens : attestation de formation, procédures d\'urgence, protocoles de premiers secours et registre des SST habilités.',
    section: '6. Documents RH & Formation'
  },
  {
    file: 'Plannings_Releves_Heures_Chantier_Algerie.pdf',
    docx: 'Plannings_Releves_Heures_Chantier_Algerie.docx',
    title: 'Plannings & Relevés d\'Heures de Chantier — Algérie',
    cat: 'gestion-projet', level: 'debutant', price: 350,
    tags: ['planning RH', 'relevé heures', 'pointage', 'paie', 'Algérie'],
    desc: 'Modèles de plannings et relevés d\'heures pour le personnel de chantier en Algérie. Inclus les tableaux de pointage hebdomadaire, les heures supplémentaires et les états récapitulatifs pour la paie.',
    section: '6. Documents RH & Formation'
  },
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

    for (const doc of DOCUMENTS) {
      const docxPath  = `/uploads/docs/chantier/${doc.docx}`;       // original DOCX (paid download)
      const pdfPath   = `/uploads/pdfs/chantier-wm/${doc.file}`;   // watermarked PDF (preview)
      const localWm   = require('path').join(__dirname, 'uploads', 'pdfs', 'chantier-wm', doc.file);
      const localDocx = require('path').join(__dirname, 'uploads', 'docs', 'chantier', doc.docx);

      if (!require('fs').existsSync(localWm)) {
        console.log(`⚠️  PDF filigrane manquant: ${doc.file}`);
        skipped++; continue;
      }
      if (!require('fs').existsSync(localDocx)) {
        console.log(`⚠️  DOCX manquant: ${doc.docx}`);
        skipped++; continue;
      }

      const ex = await client.query('SELECT id FROM products WHERE file_url=$1', [pdfPath]);
      if (ex.rows.length) {
        console.log(`⏭️  Existe: ${doc.title}`);
        skipped++; continue;
      }

      const slug = slugify(doc.title) + '-' + Date.now() + Math.floor(Math.random() * 1000);
      const catId = cat[doc.cat];
      if (!catId) { console.log(`⚠️  Catégorie inconnue: ${doc.cat}`); skipped++; continue; }

      await client.query(
        `INSERT INTO products(title,slug,description,price,type,study_level,category_id,instructor_id,is_free,is_active,is_featured,file_url,preview_url,thumbnail_url,pages_count,language,tags)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT DO NOTHING`,
        [
          doc.title, slug, doc.desc, doc.price, 'document_word',
          doc.level, catId, instructorId,
          false,     // is_free = false → payant
          true,      // is_active
          false,     // is_featured
          docxPath,  // file_url = DOCX original (téléchargement payant)
          pdfPath,   // preview_url = PDF avec filigrane (prévisualisation)
          null,      // thumbnail_url
          5,         // pages_count estimate
          'fr',
          [...doc.tags, 'chantier', 'document', doc.section]
        ]
      );
      console.log(`✅ [${doc.section}] ${doc.title} — ${doc.price} DA`);
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`\n📊 ${inserted} documents insérés | ${skipped} ignorés`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
