require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');

const COURS_ZIP = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Quantification\\Cours.zip";
const TD_ZIP    = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Quantification\\TD.zip";

const CATALOG = [
  // ── COURS PRINCIPAUX ──────────────────────────────────────────────────────
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Cours 1-Métré.pdf',
    dest_name: 'quant-cours1-metre-introduction.pdf',
    slug:      'quant-cours1-metre-introduction',
    title:     'Métré — Introduction et Principes Généraux',
    description: 'Cours d\'introduction au métré en bâtiment et génie civil. Présente les principes généraux du métré, les conventions de calcul des quantités, la rédaction du bordereau descriptif et estimatif (BDE) et les règles de mesurage selon les DTU. Indispensable pour la maîtrise des coûts et la préparation des marchés de travaux.',
    level: 'debutant', thumb_color: '#E65100', thumb_icon: '📐',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Cours 09-Mode de métré béton armé en élévation.pdf',
    dest_name: 'quant-cours09-metre-beton-arme-elevation.pdf',
    slug:      'quant-cours09-metre-beton-arme-elevation',
    title:     'Métré — Béton Armé en Élévation',
    description: 'Cours sur les modes de métré des ouvrages en béton armé en élévation : poteaux, poutres, voiles, refends et dalles. Règles de mesurage des coffrages, des armatures (kg/m³ ou liste de façonnage) et du béton. Déductions et vides pour pleins, conventions de chevauchement des armatures. Niveau BTS et Licence Génie Civil.',
    level: 'intermediaire', thumb_color: '#E65100', thumb_icon: '🏗️',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Cours 11-Mode de métré constructions métalliques (1).pdf',
    dest_name: 'quant-cours11-metre-constructions-metalliques.pdf',
    slug:      'quant-cours11-metre-constructions-metalliques',
    title:     'Métré — Constructions Métalliques',
    description: 'Cours sur le métré des constructions métalliques : charpentes, portiques, poteaux HEA/HEB, poutres IPE, assemblages et contreventements. Calcul du poids des profilés par mètre linéaire, relevé des boulons et soudures, quantification des platines et goussets. Méthodes de cubature adaptées aux marchés de structures métalliques.',
    level: 'intermediaire', thumb_color: '#E65100', thumb_icon: '🔩',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Cours 12-Mode de métré charpente bois.pdf',
    dest_name: 'quant-cours12-metre-charpente-bois.pdf',
    slug:      'quant-cours12-metre-charpente-bois',
    title:     'Métré — Charpente Bois',
    description: 'Cours sur le métré des charpentes en bois : fermettes, arbalétriers, pannes, chevrons, liens et contrefiches. Calcul des sections et longueurs développées, relevé des assemblages (tenons-mortaises, boulons, sabots), quantification des pièces de couverture. Conventions de mesurage des ouvrages de charpente traditionnelle et industrielle.',
    level: 'intermediaire', thumb_color: '#E65100', thumb_icon: '🪵',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Cours 13-Mode de métré couverture.pdf',
    dest_name: 'quant-cours13-metre-couverture.pdf',
    slug:      'quant-cours13-metre-couverture',
    title:     'Métré — Couverture',
    description: 'Cours sur le métré des ouvrages de couverture : tuiles, ardoises, bac acier, étanchéité et accessoires. Calcul des surfaces développées, déduction des lanterneaux et chéneaux, relevé des faîtages, noues et arêtes. Application des coefficients de pente et des règles de déduction pour les ouvrages de toiture en bâtiment.',
    level: 'intermediaire', thumb_color: '#E65100', thumb_icon: '🏠',
  },

  // ── FICHES MODES DE MÉTRÉ ─────────────────────────────────────────────────
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche01_modes metre_terrassements.pdf',
    dest_name: 'quant-fiche01-metre-terrassements.pdf',
    slug:      'quant-fiche01-metre-terrassements',
    title:     'Fiche Métré — Terrassements',
    description: 'Fiche de référence sur les modes de métré des terrassements : décapage de terre végétale, déblais, remblais, fouilles en rigole et en puits. Règles de calcul des volumes, coefficient de foisonnement, déduction des blindages. Tableau synoptique des conventions de mesurage selon les DTU et les CCTP de terrassement.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '🚜',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche02_modes metre_fondations.pdf',
    dest_name: 'quant-fiche02-metre-fondations.pdf',
    slug:      'quant-fiche02-metre-fondations',
    title:     'Fiche Métré — Fondations',
    description: 'Fiche de référence sur les modes de métré des fondations superficielles et profondes : semelles filantes, semelles isolées, longrines, radiers et pieux. Calcul des volumes de béton, des coffrages perdus et des armatures. Règles de déduction des vides et des recouvrements selon les conventions de métré en vigueur.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '🏗️',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche03_modes metre_voiles BA.pdf',
    dest_name: 'quant-fiche03-metre-voiles-ba.pdf',
    slug:      'quant-fiche03-metre-voiles-ba',
    title:     'Fiche Métré — Voiles Béton Armé',
    description: 'Fiche de référence sur les modes de métré des voiles en béton armé : voiles de refend, voiles de façade, murs de soutènement et voiles de noyaux. Mesurage des coffrages (m²) et du béton (m³), règles de déduction des baies, tableaux et linteaux. Quantification des armatures par ratio ou par liste de façonnage.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '🧱',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche04_modes metre_maçonnerie BBM.pdf',
    dest_name: 'quant-fiche04-metre-maconnerie-bbm.pdf',
    slug:      'quant-fiche04-metre-maconnerie-bbm',
    title:     'Fiche Métré — Maçonnerie et Blocs',
    description: 'Fiche de référence sur les modes de métré de la maçonnerie en blocs béton (BBM) et briques : murs porteurs, cloisons, remplissages et doublages. Calcul en m² et m³ selon l\'épaisseur, déductions des baies, fenêtres et portes. Règles de comptage des blocs et du mortier de pose par unité de surface.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '🧱',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche05_modes metre_Dallage BA.pdf',
    dest_name: 'quant-fiche05-metre-dallage-ba.pdf',
    slug:      'quant-fiche05-metre-dallage-ba',
    title:     'Fiche Métré — Dallage Béton Armé',
    description: 'Fiche de référence sur les modes de métré des dallages en béton armé : dallages sur terre-plein, dalles sur vide sanitaire et planchers bas. Calcul du volume de béton, des armatures et du coffrage de rive. Règles de déduction des réservations et des plots de fondation. Métrés des formes, des isolants et des relevés d\'étanchéité.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '📐',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche06_modes metre_Plancher BA.pdf',
    dest_name: 'quant-fiche06-metre-plancher-ba.pdf',
    slug:      'quant-fiche06-metre-plancher-ba',
    title:     'Fiche Métré — Plancher Béton Armé',
    description: 'Fiche de référence sur les modes de métré des planchers en béton armé : dalles pleines, planchers nervurés (tables de compression, entrevous), planchers champignons. Calcul des surfaces de coffrage, volumes de béton et quantités d\'armatures. Règles de déduction des trémies et des pénétrations selon les conventions DTU.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '📐',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche07_modes metre_Enduit.pdf',
    dest_name: 'quant-fiche07-metre-enduit.pdf',
    slug:      'quant-fiche07-metre-enduit',
    title:     'Fiche Métré — Enduits',
    description: 'Fiche de référence sur les modes de métré des enduits de façade et intérieurs : enduits monocouches, crépis, enduits à la chaux et enduits de finition. Calcul en m² de surface développée, déductions des baies, règle du vide pour plein pour les petites surfaces. Conventions de métrés des fonds, des arêtes et des gorges.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '🏠',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche08_modes metre_vide pour plein.pdf',
    dest_name: 'quant-fiche08-metre-vide-pour-plein.pdf',
    slug:      'quant-fiche08-metre-vide-pour-plein',
    title:     'Fiche Métré — Règle Vide pour Plein',
    description: 'Fiche explicative sur la règle du vide pour plein en métré : application aux façades, aux cloisons et aux revêtements. Définition des seuils de déduction selon la surface des baies (portes, fenêtres, ouvertures), cas d\'application et exceptions. Exemples pratiques de calcul pour différents types d\'ouvrages du bâtiment.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '📋',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche09_modes metre_couverture.pdf',
    dest_name: 'quant-fiche09-metre-couverture.pdf',
    slug:      'quant-fiche09-metre-couverture',
    title:     'Fiche Métré — Couverture',
    description: 'Fiche de référence sur les modes de métré des ouvrages de couverture : tuiles canal, tuiles mécaniques, ardoises, bac acier et étanchéité bicouche. Calcul des surfaces en projection horizontale et développée, coefficients de pente, déductions des chéneaux et des lucarnes. Règles de comptage des accessoires de faîtage et d\'arêtier.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '🏠',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche10_modes metre_peinture.pdf',
    dest_name: 'quant-fiche10-metre-peinture.pdf',
    slug:      'quant-fiche10-metre-peinture',
    title:     'Fiche Métré — Peinture et Revêtements',
    description: 'Fiche de référence sur les modes de métré des peintures et revêtements : peinture sur murs, plafonds, boiseries, métalleries et façades. Calcul en m² développé, règle du vide pour plein pour les menuiseries, comptage des arêtes et des gorges. Conventions de mesurage selon les normes DTU 59.1 et les CCTP de peinture.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '🎨',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche11_modes metre_ferraillage.pdf',
    dest_name: 'quant-fiche11-metre-ferraillage.pdf',
    slug:      'quant-fiche11-metre-ferraillage',
    title:     'Fiche Métré — Ferraillage',
    description: 'Fiche de référence sur les modes de métré des armatures en béton armé : barres HA, cadres, étriers, épingles et treillis soudés. Calcul du poids au kilogramme par décomposition par diamètre et longueur façonnée, prise en compte des recouvrements et des crochets. Ratios indicatifs par type d\'ouvrage (semelle, poteau, poutre, voile).',
    level: 'intermediaire', thumb_color: '#BF360C', thumb_icon: '🔩',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Fiche 01- métré 1-12/fiche12_modes metre_beton mortier.pdf',
    dest_name: 'quant-fiche12-metre-beton-mortier.pdf',
    slug:      'quant-fiche12-metre-beton-mortier',
    title:     'Fiche Métré — Béton et Mortier',
    description: 'Fiche de référence sur les modes de métré des bétons et mortiers : bétons de propreté, bétons de structure, mortiers de pose et de jointoiement. Calcul des volumes par élément, règles de déduction des armatures et des inserts, quantification des granulats, ciment et eau. Tableau des dosages indicatifs par classe de résistance.',
    level: 'debutant', thumb_color: '#BF360C', thumb_icon: '🧱',
  },

  // ── FORMULAIRES ────────────────────────────────────────────────────────────
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Formulaire 01-métré/ficheA_rappels de geometrie 2.pdf',
    dest_name: 'quant-ficheA2-rappels-geometrie.pdf',
    slug:      'quant-ficheA2-rappels-geometrie',
    title:     'Métré — Rappels de Géométrie (2)',
    description: 'Fiche de rappels de géométrie appliquée au métré : calcul des aires de surfaces planes complexes, volumes de solides courants (prismes, cylindres, cônes, pyramides), développements de surfaces gauches. Formulaire de référence pour la quantification des ouvrages de formes non standard en bâtiment et génie civil.',
    level: 'debutant', thumb_color: '#E64A19', thumb_icon: '📐',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Formulaire 01-métré/ficheA_rappels de geometrie.pdf',
    dest_name: 'quant-ficheA-rappels-geometrie.pdf',
    slug:      'quant-ficheA-rappels-geometrie',
    title:     'Métré — Rappels de Géométrie',
    description: 'Fiche de rappels de géométrie pour le métré des ouvrages de bâtiment : périmètres, aires et volumes des formes géométriques usuelles. Triangles, rectangles, trapèzes, cercles, sphères, cônes et prismes. Formulaire compact à conserver comme référence rapide lors des relevés de métrés sur plans.',
    level: 'debutant', thumb_color: '#E64A19', thumb_icon: '📐',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Formulaire 01-métré/ficheB_minute avant metre_explication.pdf',
    dest_name: 'quant-ficheB-minute-avant-metre-explication.pdf',
    slug:      'quant-ficheB-minute-avant-metre-explication',
    title:     'Métré — La Minute Avant Métré (Explications)',
    description: 'Document expliquant la rédaction de la minute avant métré, outil fondamental du métreur. Présente la structure de la minute (colonnes désignation, longueur, largeur, hauteur, quantité), les règles d\'écriture, les abréviations et les conventions typographiques. Exemples commentés pour les ouvrages courants du gros œuvre.',
    level: 'debutant', thumb_color: '#E64A19', thumb_icon: '📋',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Formulaire 01-métré/ficheB_règles de base minutes avant metre.pdf',
    dest_name: 'quant-ficheB-regles-minutes-avant-metre.pdf',
    slug:      'quant-ficheB-regles-minutes-avant-metre',
    title:     'Métré — Règles de Base de la Minute Avant Métré',
    description: 'Fiche synthétique des règles de base pour la rédaction des minutes avant métré. Présentation tabulaire des conventions : ordre de lecture des dimensions, règles d\'arrondissement, conventions de signes pour les déductions, présentation normalisée des calculs. Référence rapide pour les étudiants et praticiens du métré.',
    level: 'debutant', thumb_color: '#E64A19', thumb_icon: '📋',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Formulaire 01-métré/ficheC_methodes generales de metre.pdf',
    dest_name: 'quant-ficheC-methodes-generales-metre.pdf',
    slug:      'quant-ficheC-methodes-generales-metre',
    title:     'Métré — Méthodes Générales de Métré',
    description: 'Fiche présentant les méthodes générales de métré : métré par corps d\'état, métré par localisation et métré mixte. Avantages et inconvénients de chaque méthode, organisation du bordereau, numérotation des ouvrages et classement des articles. Comparaison avec les pratiques européennes et les standards AFNOR.',
    level: 'intermediaire', thumb_color: '#E64A19', thumb_icon: '📊',
  },
  {
    zip: COURS_ZIP, type: 'cours_pdf',
    entryName: 'Cours/Formulaire 01-métré/ficheD_formulaires niveau 2b.pdf',
    dest_name: 'quant-ficheD-formulaires-niveau2b.pdf',
    slug:      'quant-ficheD-formulaires-niveau2b',
    title:     'Métré — Formulaires Niveau 2B',
    description: 'Formulaires de métré niveau avancé (2B) : feuilles de calcul structurées pour la quantification complète d\'un ouvrage de gros œuvre. Inclut les tableaux de métré des fondations, structure BA, maçonnerie, couverture et second œuvre. Support pédagogique pour les travaux dirigés et les travaux pratiques de métré en BTS et Licence.',
    level: 'intermediaire', thumb_color: '#E64A19', thumb_icon: '📊',
  },

  // ── TD ─────────────────────────────────────────────────────────────────────
  {
    zip: TD_ZIP, type: 'td_pdf',
    entryName: "TD/TD 01-Préau-BA.pdf",
    dest_name: 'quant-td01-preau-ba.pdf',
    slug:      'quant-td01-preau-ba',
    title:     'TD Métré — Préau en Béton Armé',
    description: 'TD de métré portant sur un préau en béton armé. Quantification complète à partir des plans de coffrage et des plans de ferraillage : fouilles, fondations, poteaux, poutres, dalle de couverture et acrotères. Rédaction de la minute avant métré et établissement du bordereau des quantités par corps d\'état.',
    level: 'intermediaire', thumb_color: '#1565C0', thumb_icon: '📝',
  },
  {
    zip: TD_ZIP, type: 'td_pdf',
    entryName: 'TD/TD 04-Caniveaux.pdf',
    dest_name: 'quant-td04-caniveaux.pdf',
    slug:      'quant-td04-caniveaux',
    title:     'TD Métré — Caniveaux',
    description: 'TD de métré portant sur des caniveaux en béton : calcul des volumes de terrassement, de béton de propreté, de béton armé de structure et de coffrages. Application des modes de métré des ouvrages linéaires, prise en compte des joints de dilatation et des grilles de caniveau. Rédaction du détail estimatif.',
    level: 'debutant', thumb_color: '#1565C0', thumb_icon: '📝',
  },
  {
    zip: TD_ZIP, type: 'td_pdf',
    entryName: 'TD/TD 06-Mur-Sout.pdf',
    dest_name: 'quant-td06-mur-soutenement.pdf',
    slug:      'quant-td06-mur-soutenement',
    title:     'TD Métré — Mur de Soutènement',
    description: 'TD de métré portant sur un mur de soutènement en béton armé. Quantification des terrassements, du béton de propreté, de la semelle filante, du voile de soutènement, du drainage et des remblais. Application des règles de métré des ouvrages de génie civil et rédaction du bordereau des quantités.',
    level: 'intermediaire', thumb_color: '#1565C0', thumb_icon: '📝',
  },
  {
    zip: TD_ZIP, type: 'td_pdf',
    entryName: "TD/TD 1-Ouvrage d'art/Ouvrage d'art.pdf",
    dest_name: "quant-td1-ouvrage-art-enonce.pdf",
    slug:      'quant-td1-ouvrage-art-enonce',
    title:     "TD Métré — Ouvrage d'Art (Énoncé)",
    description: "TD de métré sur un ouvrage d'art : quantification d'un pont ou d'un cadre hydraulique à partir des plans d'exécution. Calcul des volumes de terrassement, des bétons de structure (piles, culées, tablier), des armatures et des coffrages. Énoncé complet avec plans et données de projet.",
    level: 'avance', thumb_color: '#1565C0', thumb_icon: '📝',
  },
  {
    zip: TD_ZIP, type: 'td_pdf',
    entryName: "TD/TD 1-Ouvrage d'art/Doc Rép.pdf",
    dest_name: "quant-td1-ouvrage-art-doc-rep.pdf",
    slug:      'quant-td1-ouvrage-art-doc-rep',
    title:     "TD Métré — Ouvrage d'Art (Document Réponse)",
    description: "Document réponse pour le TD de métré sur l'ouvrage d'art. Tableaux de calcul vierges à compléter : minutes avant métré, récapitulatif des quantités par ouvrage élémentaire. Support pédagogique structuré pour la restitution des résultats lors des séances de travaux dirigés.",
    level: 'avance', thumb_color: '#0D47A1', thumb_icon: '📋',
  },
  {
    zip: TD_ZIP, type: 'td_pdf',
    entryName: "TD/TD 2- Tribune de stade/Tribune de stade TD2.pdf",
    dest_name: 'quant-td2-tribune-stade-enonce.pdf',
    slug:      'quant-td2-tribune-stade-enonce',
    title:     'TD Métré — Tribune de Stade (Énoncé)',
    description: 'TD de métré portant sur une tribune de stade en béton armé. Quantification à partir des plans architecturaux et structuraux : gradins, poteaux, poutres, dalles et fondations. Application des méthodes de métré des ouvrages de grande portée et des structures préfabriquées. Énoncé complet avec plans cotés.',
    level: 'avance', thumb_color: '#1565C0', thumb_icon: '📝',
  },
  {
    zip: TD_ZIP, type: 'td_pdf',
    entryName: "TD/TD 2- Tribune de stade/Doc Prof.pdf",
    dest_name: 'quant-td2-tribune-stade-doc-prof.pdf',
    slug:      'quant-td2-tribune-stade-doc-prof',
    title:     'TD Métré — Tribune de Stade (Corrigé Professeur)',
    description: 'Corrigé professeur du TD de métré sur la tribune de stade. Correction détaillée de la quantification : minutes avant métré complètes, vérification des calculs par ouvrage élémentaire, récapitulatif des quantités et commentaires pédagogiques sur les erreurs fréquentes. Réservé à l\'usage pédagogique de l\'encadrement.',
    level: 'avance', thumb_color: '#0D47A1', thumb_icon: '📋',
  },
];

function makeSVG(doc) {
  function wrapText(text, maxChars) {
    const words = text.split(' '); const lines = []; let cur = '';
    for (const w of words) {
      if ((cur+' '+w).trim().length > maxChars) { if (cur) lines.push(cur.trim()); cur = w; }
      else { cur = (cur+' '+w).trim(); }
      if (lines.length >= 3) { lines[2] = lines[2].slice(0,maxChars-2)+'…'; break; }
    }
    if (cur && lines.length < 3) lines.push(cur.trim());
    return lines.slice(0,3);
  }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  const c1 = doc.thumb_color, h = c1.replace(/^#/,'');
  const bg2 = '#'+[0,2,4].map(i=>Math.max(0,parseInt(h.slice(i,i+2),16)-50).toString(16).padStart(2,'0')).join('');
  const lines = wrapText(doc.title, 22);
  const titleY = lines.length===1?176:lines.length===2?168:158;
  const badge = doc.type === 'td_pdf' ? 'TD PDF' : 'COURS PDF';
  const tl = lines.map((l,i)=>`<text x="200" y="${titleY+i*26}" text-anchor="middle" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="-0.3">${esc(l)}</text>`).join('\n    ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <clipPath id="clip"><rect width="400" height="280" rx="12"/></clipPath>
  </defs>
  <rect width="400" height="280" rx="12" fill="url(#bg)"/>
  <rect width="400" height="280" rx="12" fill="white" opacity="0.06"/>
  <circle cx="340" cy="-20" r="130" fill="white" opacity="0.05" clip-path="url(#clip)"/>
  <rect x="14" y="14" width="${badge==='TD PDF'?54:74}" height="24" rx="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="0.4">${badge}</text>
  <text x="200" y="130" text-anchor="middle" font-size="52">${doc.thumb_icon}</text>
  <line x1="80" y1="148" x2="320" y2="148" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  ${tl}
  <rect x="0" y="252" width="400" height="28" fill="rgba(0,0,0,0.28)"/>
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Quantification — Métré</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  const catRes = await query("SELECT id FROM categories WHERE slug='gestion-projet' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'gestion-projet' introuvable");
  const catId = catRes.rows[0].id;

  const zips = { [COURS_ZIP]: new AdmZip(COURS_ZIP), [TD_ZIP]: new AdmZip(TD_ZIP) };

  console.log(`\n📐  Import Quantification / Métré (${CATALOG.length} fichiers)\n`);
  let inserted=0, skipped=0, errors=0;

  for (const doc of CATALOG) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) { console.log(`  ⏭️  SKIP — ${doc.slug}`); skipped++; continue; }

      const zip = zips[doc.zip];
      // Recherche souple (apostrophes typographiques)
      let entry = zip.getEntry(doc.entryName);
      if (!entry) {
        entry = zip.getEntries().find(e =>
          e.entryName.replace(/[‘’]/g,"'") === doc.entryName.replace(/[‘’]/g,"'")
        );
      }
      if (!entry) { console.log(`  ❌ MANQUANT — ${doc.entryName}`); errors++; continue; }

      const buf     = entry.getData();
      const sizeMb  = parseFloat((buf.length / 1024 / 1024).toFixed(2));
      const thumbId = `thumb-quant-${doc.slug}`;

      fs.writeFileSync(path.join(UPLOAD_DIR, doc.dest_name), buf);
      fs.writeFileSync(path.join(THUMB_DIR, `${thumbId}.svg`), makeSVG(doc), 'utf8');

      const badge = doc.type === 'td_pdf' ? 'TD' : 'Cours';
      await query(`INSERT INTO products (title,slug,description,type,category_id,file_url,file_size_mb,thumbnail_url,is_free,price,is_active,language,study_level,tags,created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,0,TRUE,'fr',$9,$10,NOW())`,
        [doc.title, doc.slug, doc.description, doc.type, catId,
         `/uploads/products/${doc.dest_name}`, sizeMb,
         `/uploads/images/thumbs/${thumbId}.svg`,
         doc.level, ['Quantification', 'Métré']]);

      console.log(`  ✅ [${badge}] ${sizeMb} Mo — ${doc.title}`);
      inserted++;
    } catch(err) { console.error(`  ❌ ${doc.slug}: ${err.message}`); errors++; }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ✅ Insérés: ${inserted}  ⏭️  Ignorés: ${skipped}  ❌ Erreurs: ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
