/**
 * seed-articles.js — Al Handassa.dz
 * Insère les articles et publications scientifiques en génie civil / architecture.
 *
 * Usage :
 *   node backend/seed-articles.js            → dry-run (vérifie sans insérer)
 *   node backend/seed-articles.js --insert   → insère en base
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 90);
}

/** Catégories prédéfinies → IDs */
const CAT = {
  beton:       1,
  structures:  2,
  geo:         3,
  hydraulique: 4,
  materiaux:   5,
  archi:       7,
  parasismique:8,
  routes:      9,
  durable:    12,
};

// ──────────────────────────────────────────────────────────────────────────────
// ARTICLES
// ──────────────────────────────────────────────────────────────────────────────
const ARTICLES = [

  // ══════════════════════════════════════════════════════════════════════════
  // 1. BÉTON ARMÉ — Béton à Hautes Performances (BHP)
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Le Béton à Hautes Performances (BHP) : principes, formulation et applications en Algérie',
    excerpt: 'Présentation des bétons à hautes performances (BHP) et ultra-hautes performances (BUHP) : composition, adjuvants, propriétés mécaniques et exemples d\'application dans les projets algériens de grande envergure.',
    content: `
<h2>Introduction</h2>
<p>Le béton à hautes performances (BHP) désigne un béton dont la résistance à la compression à 28 jours dépasse 50 MPa, contre 25–35 MPa pour un béton ordinaire. En Algérie, le développement des grandes infrastructures (viaduc de Oued Essed, ponts autoroutiers Est-Ouest, barrages en béton compacté au rouleau) a conduit les laboratoires et bureaux d'études à maîtriser ces formulations.</p>

<h2>Composition d'un BHP</h2>
<p>Un BHP se distingue d'un béton ordinaire par :</p>
<ul>
  <li><strong>Faible rapport Eau/Ciment (E/C)</strong> : typiquement 0,25 à 0,40, obtenu grâce à des superplastifiants à base de polycarboxylates.</li>
  <li><strong>Additions minérales</strong> : fumée de silice (5–10 %), cendres volantes, laitier de haut fourneau ou métakaolin pour affiner la microstructure.</li>
  <li><strong>Granulométrie optimisée</strong> : sable de dune algérien (Sahara) ou quartz broyé ; graviers concassés de qualité.</li>
  <li><strong>Fibres d'acier</strong> (optionnel) : 1 à 2 % en volume pour les bétons fibrés à ultra-hautes performances (BFUP).</li>
</ul>

<h2>Propriétés mécaniques</h2>
<table>
  <thead><tr><th>Propriété</th><th>Béton ordinaire</th><th>BHP</th><th>BUHP</th></tr></thead>
  <tbody>
    <tr><td>Résistance compression (MPa)</td><td>25–35</td><td>50–100</td><td>150–200+</td></tr>
    <tr><td>Résistance traction (MPa)</td><td>2–3</td><td>4–6</td><td>8–15</td></tr>
    <tr><td>Module d'Young (GPa)</td><td>30–35</td><td>40–45</td><td>50–65</td></tr>
    <tr><td>Perméabilité</td><td>Élevée</td><td>Faible</td><td>Très faible</td></tr>
  </tbody>
</table>

<h2>Formulation selon la méthode de Dreux-Gorisse</h2>
<p>La méthode Dreux-Gorisse, couramment utilisée en Algérie, permet de formuler un BHP en 5 étapes :</p>
<ol>
  <li>Choix du dosage en ciment selon la résistance visée et le rapport E/C (abaque de Bolomey).</li>
  <li>Détermination de la teneur en eau par essai d'affaissement (cône d'Abrams) en visant S3 (10–15 cm).</li>
  <li>Correction de E/C par ajout de superplastifiant (réduction de 20–30 % de l'eau de gâchage).</li>
  <li>Optimisation granulométrique par la courbe de référence de Dreux.</li>
  <li>Ajout de fumée de silice et ajustement de la rhéologie.</li>
</ol>

<h2>Applications en Algérie</h2>
<p>Parmi les ouvrages algériens utilisant des BHP/BUHP :</p>
<ul>
  <li><strong>Autoroute Est-Ouest</strong> : tabliers de ponts en BHP fc28 = 60–80 MPa pour réduire les sections et le poids propre.</li>
  <li><strong>Barrage de Kherrata</strong> : béton compacté au rouleau (BCR), résistance moyenne 30–40 MPa avec rapport E/C ≤ 0,40.</li>
  <li><strong>Grande Mosquée d'Alger</strong> : dôme principal en béton fc28 ≥ 60 MPa, post-tendu — troisième plus grande mosquée du monde.</li>
  <li><strong>Port Centre d'Alger</strong> : pieux forés en BHP résistant à l'eau de mer (sulfates, chlorures).</li>
</ul>

<h2>Durabilité et résistance aux agents agressifs</h2>
<p>La faible porosité des BHP leur confère une excellente résistance aux attaques chimiques (sulfates des eaux souterraines algériennes, chlorures côtiers, carbonatation) et aux cycles gel-dégel en zones montagneuses (Kabyle, Aurès). L'indice de pénétration des chlorures (DRCM) chute de 15–30 × 10⁻¹² m²/s (béton ordinaire) à 1–5 × 10⁻¹² m²/s (BHP).</p>

<h2>Conclusion</h2>
<p>Le BHP représente une solution technique et économique performante pour les infrastructures algériennes. Son coût initial plus élevé est compensé par la réduction des sections (moins d'acier, moins de coffrage) et l'allongement de la durée de service (50–100 ans au lieu de 30 ans). La maîtrise des matériaux locaux (sable de dune, pouzzolanes naturelles des Hauts Plateaux) ouvre des perspectives intéressantes pour réduire l'importation de fumée de silice.</p>
    `.trim(),
    category_id: CAT.beton,
    tags: ['béton hautes performances', 'BHP', 'BUHP', 'formulation', 'superplastifiant', 'fumée de silice', 'Algérie'],
    bibliography: [
      'Dreux G., Festa J. (1998). Nouveau guide du béton et de ses constituants. 8e éd., Eyrolles, Paris.',
      'Tahenni T. (2016). Capacité au cisaillement des poutres en béton armé aux fibres d\'acier. Thèse USTHB Alger.',
      'DTR-BC 2.2 (1994). Règles de calcul des structures en béton armé — CBA 93. CGS Alger.',
      'Neville A.M. (2011). Properties of Concrete. 5e éd., Pearson Education, UK.',
      'ACI 363R-10 (2010). State-of-the-Art Report on High-Strength Concrete. ACI Committee 363.',
    ],
    doi: null,
    read_time_min: 10,
    source_url: 'https://theses.hal.science/tel-04373512v1',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. PARASISMIQUE — RPA 99/2003
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Règlement Parasismique Algérien RPA 99/2003 : guide pratique pour les ingénieurs',
    excerpt: 'Synthèse des exigences du RPA 99 version 2003 : classification sismique du territoire, méthodes de calcul (statique équivalente, spectrale), règles de conception et détails d\'armature pour bâtiments en béton armé.',
    content: `
<h2>Contexte historique</h2>
<p>L'Algérie est l'un des pays les plus sismiquement actifs de la Méditerranée occidentale. Le séisme de <strong>Boumerdès du 21 mai 2003</strong> (magnitude Mw 6.8, 2 287 morts, 11 000 blessés, 200 000 sinistrés) a mis en évidence les lacunes du premier règlement parasismique RPA 88 et accéléré la révision du RPA 99.</p>
<p>Le <strong>RPA 99/Version 2003</strong> (Règles Parasismiques Algériennes) constitue le document de référence obligatoire pour toute construction en Algérie depuis le décret exécutif n°03-311 du 26 septembre 2003.</p>

<h2>Zonage sismique du territoire algérien</h2>
<p>Le territoire est divisé en <strong>5 zones sismiques</strong> (0, I, IIa, IIb, III) selon l'accélération de référence :</p>
<ul>
  <li><strong>Zone 0</strong> — Négligeable (A = 0,00 g) : Sahara central, Hoggar</li>
  <li><strong>Zone I</strong> — Faible (A = 0,05 g) : Sahara nord, Mzab</li>
  <li><strong>Zone IIa</strong> — Modérée (A = 0,10 g) : Hauts Plateaux est (Batna, Sétif)</li>
  <li><strong>Zone IIb</strong> — Élevée (A = 0,15 g) : Hauts Plateaux ouest, Est algérien</li>
  <li><strong>Zone III</strong> — Très élevée (A = 0,25 g) : Tell algérien, Alger, Oran, Béjaïa, Annaba</li>
</ul>

<h2>Classification des ouvrages</h2>
<p>Les bâtiments sont classés en <strong>4 groupes d'importance</strong> (1A, 1B, 2, 3) qui influencent le coefficient d'importance γ :</p>
<ul>
  <li><strong>Groupe 1A</strong> (γ = 1,4) : Hôpitaux, casernes pompiers, installations vitales</li>
  <li><strong>Groupe 1B</strong> (γ = 1,2) : Écoles, grandes mosquées, CHU</li>
  <li><strong>Groupe 2</strong> (γ = 1,0) : Bâtiments d'habitation, bureaux ordinaires</li>
  <li><strong>Groupe 3</strong> (γ = 0,8) : Constructions secondaires (moins de 5 personnes)</li>
</ul>

<h2>Méthodes de calcul</h2>
<h3>1. Méthode Statique Équivalente (MSE)</h3>
<p>Applicable aux bâtiments réguliers, de moins de 4 étages (ou h ≤ 17 m). La force sismique à la base :</p>
<pre>V = (A × D × Q / R) × W</pre>
<p>Où : A = accélération de zone, D = facteur d'amplification dynamique, Q = qualité de construction (1,0–1,15), R = coefficient de comportement (3,5 pour voiles BA, 5,0 pour portiques), W = poids total.</p>

<h3>2. Méthode Spectrale (analyse modale)</h3>
<p>Obligatoire pour les bâtiments irréguliers ou de grande hauteur. Utilise le spectre de réponse élastique du RPA avec amortissement 5 %. Nombre de modes à retenir : SRSS ou CQC jusqu'à 90 % de la masse participante.</p>

<h2>Règles de conception parasismique pour les poteaux</h2>
<ul>
  <li>Section minimale : 25 × 25 cm (zone IIa), 30 × 30 cm (zones IIb, III)</li>
  <li>Élancement mécanique : λ = l₀/i ≤ 70</li>
  <li>Taux d'armatures longitudinales : 0,8 % ≤ ρ ≤ 4 % de la section brute</li>
  <li>Armatures transversales : φ ≥ max(6 mm ; φl/4), espacées t ≤ min(h/3 ; 15φl ; 100 mm) en zone de recouvrement</li>
</ul>

<h2>Règles de conception pour les voiles de contreventement</h2>
<ul>
  <li>Épaisseur minimale : e ≥ max(15 cm ; h/20)</li>
  <li>Taux d'acier vertical : 0,20 % ≤ ρv ≤ 4 %</li>
  <li>Taux d'acier horizontal : ρh ≥ 0,15 %</li>
  <li>Deux nappes d'armatures obligatoires pour e ≥ 20 cm ou voiles ≥ 4,0 m</li>
</ul>

<h2>Erreurs fréquentes à éviter</h2>
<ol>
  <li><strong>Irrégularité en plan</strong> : éviter les formes en L, T ou U sans joint de dilatation sismique.</li>
  <li><strong>Colonne courte</strong> (short column effect) : phénomène responsable de nombreuses ruptures à Boumerdès — prévoir une ouverture libre > h/6 entre voiles et poteaux.</li>
  <li><strong>Sous-estimation de P</strong> : intégrer le poids des cloisons (0,15–0,20 kN/m² de surface de plancher) dans le poids W.</li>
  <li><strong>Non-respect du déplacement relatif inter-étage</strong> : Δk ≤ 1,0 % × hk (structure ductile) selon article 5.10 du RPA.</li>
</ol>

<h2>Conclusion</h2>
<p>La bonne application du RPA 99/2003 reste un défi majeur en Algérie, notamment dans l'auto-construction (30–40 % du parc bâti). Les retours d'expérience post-sismiques montrent que les dommages les plus graves concernent systématiquement des bâtiments non conformes ou construits avant 1988. Une meilleure formation des maîtres d'œuvre et un contrôle renforcé de la conformité constituent les leviers prioritaires pour réduire la vulnérabilité du parc bâti algérien.</p>
    `.trim(),
    category_id: CAT.parasismique,
    tags: ['RPA 99', 'parasismique', 'séisme Algérie', 'béton armé', 'Boumerdès', 'zonage sismique', 'DTR'],
    bibliography: [
      'CGS (2003). Règles Parasismiques Algériennes RPA 99/Version 2003. Centre National de Recherche Appliquée en Génie Parasismique, Alger.',
      'Farsi M.N., Bard P.Y. (2004). Estimation des périodes propres de bâtiments et vulnérabilité du bâti existant à Alger. Revue Française de Génie Civil, 8(2-3), 287-305.',
      'Benouar D. (1994). Materials for the investigation of the seismicity of Algeria and adjacent regions during the twentieth century. Annali di Geofisica, 37(4).',
      'Bouhadad Y. et al. (2003). The Boumerdes earthquake of May 21, 2003: Ground deformation and intensity. Journal of Seismology, 8(3), 355-360.',
      'Meslem A., Yamazaki F., Maruyama Y. (2013). Seismic vulnerability: theory and application to Algerian buildings. Journal of Seismology, 17(3), 975-999. DOI:10.1007/s10950-013-9377-0',
    ],
    doi: null,
    read_time_min: 12,
    source_url: 'https://www.researchgate.net/publication/319244149',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. HYDRAULIQUE — Barrages en Algérie
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Les barrages en Algérie : types, enjeux et problème d\'envasement',
    excerpt: 'Panorama des grands barrages algériens (153 ouvrages, capacité 8,5 milliards m³), typologies structurelles, problème majeur de l\'envasement et solutions techniques : chasses hydrauliques, soutirage des courants de densité, dragage.',
    content: `
<h2>Le parc de barrages algérien</h2>
<p>L'Algérie dispose de <strong>153 grands barrages</strong> en exploitation (2024), avec une capacité totale de stockage d'environ <strong>8,5 milliards de m³</strong>. Ces ouvrages constituent l'épine dorsale de l'approvisionnement en eau potable des grandes agglomérations et de l'irrigation des périmètres agricoles du Tell.</p>

<h3>Répartition géographique</h3>
<ul>
  <li><strong>Nord-Est</strong> (Atlas tellien) : Barrages de Beni Haroun (960 Mm³), Zardezas (200 Mm³), Erraguene (174 Mm³)</li>
  <li><strong>Nord-Ouest</strong> : Barrages de Gargar (830 Mm³), Sidi M'Hamed Ben Aouda (235 Mm³), Bouhanifia (73 Mm³)</li>
  <li><strong>Centre</strong> : Barrages de Keddara (155 Mm³), Hamiz (8 Mm³), Ghrib (280 Mm³)</li>
</ul>

<h2>Types de barrages construits en Algérie</h2>

<h3>1. Barrages en remblai (terrassement)</h3>
<p>Représentent environ <strong>65 %</strong> du parc algérien. Construction par zones compactées (noyau argileux, risbermes de transition, recharges drainantes).</p>
<ul>
  <li><em>Beni Haroun</em> — digue à noyau argileux central, H = 121 m, plus grand barrage d'Algérie</li>
  <li><em>Kherrata</em> — barrage en enrochement à masque amont béton</li>
</ul>

<h3>2. Barrages en béton</h3>
<ul>
  <li><strong>Barrages-poids</strong> (70 % des barrages béton) : stabilité assurée par le poids propre — Béni Bahdel (H = 64 m), Foum El Gherza (H = 67 m)</li>
  <li><strong>Barrages voûtes</strong> : transmission des efforts vers les rives — Bou Namoussa (H = 78 m)</li>
  <li><strong>Barrages à contreforts</strong> : Dahmouni, Zardezas</li>
  <li><strong>BCR (Béton Compacté au Rouleau)</strong> : technique récente — barrage de Telesdit, Tichy Haf</li>
</ul>

<h2>Le problème de l'envasement : menace sur les ressources hydriques</h2>
<p>L'Algérie perd annuellement <strong>20 à 30 millions m³</strong> de capacité utile par envasement, soit une perte cumulée estimée à plus de <strong>1,5 milliard m³</strong> depuis les années 1970. Les taux d'envasement annuel observés varient de 0,3 % (barrages peu menacés) à 3–5 % (barrages très exposés en zones semi-arides).</p>

<h3>Causes de l'envasement accéléré</h3>
<ul>
  <li>Forte érodibilité des terrains telliens (marnes, flyschs, argiles gonflantes)</li>
  <li>Déforestation et surpâturage des bassins versants</li>
  <li>Régime hydrique irrégulier : crues violentes transportant de fortes charges solides</li>
  <li>Transport solide en suspension : 300 à 3 000 t/km²/an selon les bassins</li>
</ul>

<h3>Cas du barrage de Sidi M'Hamed Ben Aouda</h3>
<p>Ce barrage (Oued Mina, wilaya de Relizane), capacité initiale 235 Mm³ à la mise en service en 1978, avait perdu <strong>52 % de sa capacité</strong> en 2018 selon les relevés bathymétriques. Le taux d'envasement annuel a accéléré de 1,5 % (1980-2000) à 2,8 % (2000-2018), corrélé à la dégradation du couvert végétal dans le bassin versant de l'Oued Mina.</p>

<h2>Solutions techniques contre l'envasement</h2>

<h3>1. Chasses hydrauliques</h3>
<p>Ouverture des vidanges de fond pour mobiliser et évacuer les dépôts en période de crue. Efficace pour les sédiments fins, mais mobilise 3 à 10 fois plus de volume d'eau que de sédiment évacué. Pratiqué au barrage de Bouhanifia.</p>

<h3>2. Soutirage des courants de densité</h3>
<p>Technique exploitée depuis 1963 au barrage d'Erraguene (Oued Agrioun, Béjaïa). Les courants hyperpycnaux transportant les fines en suspension plongent au fond et peuvent être interceptés avant dépôt par ouverture des pertuis de fond. L'étude de l'ANBT montre un taux de récupération de 15–35 % des apports solides annuels.</p>

<h3>3. Dragage mécanique</h3>
<p>Dragage par aspiration ou benne preneuse, avec refoulement en aval ou valorisation (granulats de construction). Coût élevé (3–8 €/m³ selon la distance et la consistance). Opérations réalisées au barrage d'Hamiz et de Bouhanifia.</p>

<h3>4. Reboisement des bassins versants</h3>
<p>Solution préventive à long terme. Le Plan National de Reboisement algérien vise 1 245 000 ha sur 20 ans pour réduire les apports solides.</p>

<h2>Perspectives</h2>
<p>Face à la pression démographique (population algérienne : 46 millions en 2024) et au stress hydrique croissant (disponibilité &lt; 300 m³/hab/an dans certaines wilayas), la gestion durable des barrages existants est plus urgente que la construction de nouveaux ouvrages. L'enjeu est double : limiter l'envasement et améliorer les rendements des réseaux AEP (pertes de 30–40 % en Algérie).</p>
    `.trim(),
    category_id: CAT.hydraulique,
    tags: ['barrages Algérie', 'hydraulique', 'envasement', 'ressources hydriques', 'BCR', 'Beni Haroun', 'Erraguene'],
    bibliography: [
      'ANBT (2020). Rapport sur l\'état des barrages en Algérie. Agence Nationale des Barrages et Transferts, Alger.',
      'Remini B., Bechir L., Leduc C. (2009). Evolution de l\'envasement du barrage Sidi M\'Hamed Ben Aouda. Revue des Sciences de l\'Eau, 22(3), 395-405.',
      'Remini B. (2019). Le barrage réservoir d\'Erraguene : une expérience de plus d\'un demi-siècle dans le soutirage des courants de densité. Larhyss Journal, 38, 163-181.',
      'Bourouba M. (1998). Transport solide et envasement des barrages en Algérie. Revue de Géomorphologie Dynamique, 47(1), 29-43.',
      'Achour B. (2014). Ressaut hydraulique contrôlé par seuil dans un canal triangulaire. Larhyss Journal, 18, 233-247.',
    ],
    doi: null,
    read_time_min: 11,
    source_url: 'https://www.researchgate.net/publication/337049777',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. GÉOTECHNIQUE — Fondations superficielles en sols algériens
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Fondations superficielles en Algérie : tassement, capacité portante et essais in situ',
    excerpt: 'Méthodes de calcul du tassement et de la capacité portante des fondations superficielles dans les sols fins algériens (Tell nord, plaines côtières), avec application des essais pressiométriques (PMT) et de pénétration statique (CPT).',
    content: `
<h2>Introduction</h2>
<p>Les fondations superficielles (semelles isolées, filantes, radiers) constituent la solution la plus économique lorsque le sol en place offre une résistance suffisante à faible profondeur. En Algérie du Nord, les sols rencontrés sont principalement des argiles et limons (Tell) et des sables côtiers (plaines d'Annaba, Oran), imposant des études géotechniques rigoureuses avant tout dimensionnement.</p>

<h2>Reconnaissance géotechnique — Norme DTR-BC 2.331</h2>
<p>Le <strong>DTR-BC 2.331</strong> (Document Technique Réglementaire, béton et construction) impose les investigations minimales :</p>
<ul>
  <li>1 sondage au minimum par 250 m² d'emprise (bâtiments courants)</li>
  <li>Profondeur minimale : 1,5 fois la largeur de la fondation sous le niveau de fondation prévu</li>
  <li>Essais en laboratoire : limites d'Atterberg, granulométrie, essais œdométriques, cisaillement triaxial (UU/CU/CD selon les cas)</li>
</ul>

<h2>Capacité portante — Méthodes de calcul</h2>

<h3>Méthode de Terzaghi (semi-empirique)</h3>
<p>Pour une semelle filante de largeur B à profondeur Df :</p>
<pre>qu = c·Nc + q·Nq + 0,5·γ·B·Nγ</pre>
<p>Où Nc, Nq, Nγ sont les facteurs de capacité portante (fonctions de l'angle de frottement φ'), c = cohésion du sol, q = γ·Df = surcharge du niveau de fondation.</p>
<p>Pour les argiles saturées non drainées (φ = 0) : qu = 5,14·Cu + γ·Df (Cu = cohésion non drainée).</p>

<h3>Méthode pressiométrique (Ménard) — Norme DTU 13.12</h3>
<p>La méthode pressiométrique (essai PMT ou MPM) est la plus utilisée en Algérie pour les calculs réglementaires :</p>
<pre>qnet = Kp·pl* + q</pre>
<p>Où Kp = facteur rhéologique (1,0–3,0 selon le type de sol et l'élancement B/L), pl* = pression limite nette (en MPa), q = contrainte totale en place.</p>

<h3>Méthode CPT (pénétration statique)</h3>
<p>Corrélation avec la résistance de pointe qc :</p>
<pre>qult = (α/k) · qc + 0,5·γ·B·Nγ</pre>
<p>Avec k = 0,3–0,7 selon le type de sol (Meyerhof, 1963). En sols fins algériens, la corrélation Cu = qc / Nk (Nk = 15–20) est généralement satisfaisante.</p>

<h2>Calcul du tassement</h2>
<h3>Tassement œdométrique (sols argileux)</h3>
<pre>S = Σ [Cc/(1+e₀) · log((σ'v0 + Δσ'v)/σ'v0)] · hi</pre>
<p>Où Cc = indice de compression, e₀ = indice des vides initial, Δσ'v = accroissement de contrainte verticale (méthode des 2:1 ou équation de Boussinesq).</p>
<p>Sur les sols fins du nord algérien (argiles de la plaine de la Mitidja, argiles lacustres du Sersou), Cc varie de 0,15 à 0,45, avec des tassements observés de 5 à 80 mm pour des bâtiments courants.</p>

<h3>Tassement immédiat (sols sableux)</h3>
<pre>Si = p·B·(1-ν²)/E · If</pre>
<p>Où p = contrainte appliquée, E = module de Young du sol (corrélé à SPT ou CPT), ν = coefficient de Poisson, If = facteur de forme de la semelle.</p>

<h2>Cas particuliers fréquents en Algérie</h2>
<ul>
  <li><strong>Sols gonflants</strong> (argiles smectites des Hauts Plateaux et du Sahara nord) : nécessitent une étude spécifique (essai au bleu de méthylène, potentiel de gonflement, humidification contrôlée). Solutions : radiers, pieux en sous-pression, préhumidification.</li>
  <li><strong>Effondrement des sols ésiens</strong> (loess des Hauts Plateaux) : effondrement brutal lors de la première saturation (+10 à 30 % du volume). Solutions : compactage dynamique, injection de ciment, renforcement par colonnes ballastées.</li>
  <li><strong>Sables liquéfiables</strong> (plaines côtières : Annaba, Oran, Alger) : vérification de la résistance à la liquéfaction par la méthode Seed-Idriss (rapport Csr/Crr) en zones sismiques IIb et III.</li>
</ul>

<h2>Conclusion</h2>
<p>Le dimensionnement des fondations superficielles en Algérie nécessite une reconnaissance géotechnique adaptée aux spécificités des sols locaux, souvent agressifs (gonflants, effondrables, sensibles aux séismes). L'usage des méthodes pressiométriques et CPT, normalisées par les DTR algériens, offre la meilleure adéquation entre sécurité et économie de projet.</p>
    `.trim(),
    category_id: CAT.geo,
    tags: ['géotechnique', 'fondations', 'tassement', 'capacité portante', 'CPT', 'pressiomètre', 'sols gonflants', 'Algérie'],
    bibliography: [
      'DTR-BC 2.331 (2004). Fondations superficielles. Centre National de l\'Habitat, Alger.',
      'Bekkouche A., Djidel M. (2016). Tassement des fondations superficielles dans les sols fins — Contribution par une nouvelle approche basée sur les ondes Vs. Afrique Science, 12(4), 298-310.',
      'Bouafia A. (2024). Apport aux calculs du tassement et de la capacité portante des fondations superficielles dans les sols fins à partir des essais de pénétration. LMSS, Université de Blida.',
      'Boussinesq J. (1885). Application des potentiels à l\'étude de l\'équilibre et du mouvement des solides élastiques. Gauthier-Villars, Paris.',
      'Terzaghi K., Peck R.B., Mesri G. (1996). Soil Mechanics in Engineering Practice. 3e éd., Wiley, New York.',
    ],
    doi: null,
    read_time_min: 13,
    source_url: 'https://www.researchgate.net/publication/305661458',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. MATÉRIAUX — Construction en terre (architecture vernaculaire)
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'La construction en terre en Algérie : techniques traditionnelles et réhabilitation durable',
    excerpt: 'Exploration des techniques de construction en terre utilisées dans l\'architecture algérienne (pisé, adobe, bauge) : propriétés mécaniques, confort thermique, patrimoine des ksour sahariens et du M\'Zab, et perspectives de réhabilitation.',
    content: `
<h2>Un patrimoine architectural millénaire</h2>
<p>La construction en terre représente l'une des plus anciennes traditions architecturales algériennes, présente dans toutes les régions du pays — des ksour (villages fortifiés) sahariens aux villages kabyles en pierre et torchis, en passant par les casbahs côtières. Aujourd'hui, environ <strong>30 % du parc bâti algérien rural</strong> est encore constitué de constructions en terre.</p>

<h2>Les trois grandes techniques</h2>

<h3>1. Le Pisé (terre battue)</h3>
<p>Technique la plus répandue dans les Hauts Plateaux et l'Atlas saharien. La terre humide (teneur en eau optimale 8–15 %) est compactée par couches de 15–20 cm entre deux coffrages en bois (banches). Résistance à la compression des murs réalisés en Algérie : 0,5 à 2,0 MPa selon la qualité de la terre et le compactage.</p>
<p>Caractéristiques thermiques du pisé : conductivité λ = 0,5–1,2 W/m·K (selon densité et humidité), capacité thermique massique Cp = 800–1 000 J/(kg·K). L'inertie thermique élevée des murs épais (40–60 cm) amortit les écarts de température jour/nuit au Sahara (ΔT = 20–40°C).</p>

<h3>2. Adobe (briques de terre crue)</h3>
<p>Briques moulées et séchées au soleil, agglomérées au mortier de terre. Technique dominante dans les zones à faible pluviométrie (Sahara, Sahel). Dimensions algériennes traditionnelles : 35 × 17 × 10 cm. Résistance à la compression : 0,3 à 1,5 MPa. Densité : 1 600–1 900 kg/m³.</p>
<p>Le <strong>M'Zab</strong> (patrimoine mondial UNESCO depuis 1982) en offre les exemples les plus remarquables : les 5 ksour (Ghardaïa, Beni Isguen, El Atteuf, Bounoura, Melika) représentent un chef-d'œuvre d'architecture en adobe adaptée au climat saharien.</p>

<h3>3. Bauge et Torchis</h3>
<p>La bauge (masse de terre non moulée, posée en cordons successifs) est utilisée en zones montagneuses humides (Kabylie, Aurès). Le torchis (ossature bois + remplissage de terre avec paille) se retrouve dans les constructions rurales du Tell. Ces techniques tolèrent des terres moins sélectionnées mais nécessitent un entretien régulier (rejointoiement, badigeonnage à la chaux).</p>

<h2>Avantages environnementaux</h2>
<ul>
  <li><strong>Énergie grise minimale</strong> : fabrication sans cuisson (contrairement à la brique cuite : 3–5 MJ/kg). L'adobe ne consomme que l'énergie de malaxage et de transport.</li>
  <li><strong>Matériau entièrement recyclable</strong> : une construction en terre démontée peut être réutilisée ou retourne au sol.</li>
  <li><strong>Confort hygro-thermique</strong> : régulation naturelle de l'humidité intérieure (absorption/désorption de vapeur), réduction de la climatisation.</li>
  <li><strong>Ressource locale</strong> : utilise les terres d'excavation disponibles sur place — réduction du transport et du coût.</li>
</ul>

<h2>Limites et fragilités</h2>
<ul>
  <li><strong>Résistance à l'eau</strong> : l'érosion par les pluies (croûte de surface, ruissellement) est la principale cause de dégradation. Solution : surplombs de toiture généreux, soubassement en pierre ou brique cuite, revêtements protecteurs à la chaux.</li>
  <li><strong>Résistance sismique limitée</strong> : les constructions en terre non armée sont particulièrement vulnérables. Solutions : chaînages bois ou bambou (technique Quincha andine), renforcement en adobe stabilisé au ciment (5–8 %), maille géosynthétique.</li>
  <li><strong>Résistance mécanique modeste</strong> : inadaptée aux charges lourdes — limitée aux R+1 ou R+2 traditionnels.</li>
</ul>

<h2>Réhabilitation et valorisation</h2>
<p>Plusieurs projets de réhabilitation des ksour sahariens sont en cours en Algérie, financés conjointement par le Ministère de la Culture et des coopérations internationales (Agence Française de Développement, UNESCO) :</p>
<ul>
  <li>Réhabilitation de la Casbah d'Alger (classée patrimoine mondial UNESCO 1992) : consolidation des murs en pierre et enduits à la chaux.</li>
  <li>Conservation des ksour du M'Zab : entretien des adobe à l'argile locale, reconstitution des décors géométriques mozabites.</li>
  <li>Timimoun (Gourara) : réhabilitation des foggaras (canaux souterrains) et des greniers collectifs en pisé.</li>
</ul>

<h2>Conclusion</h2>
<p>La construction en terre n'est pas une technique du passé mais une ressource d'avenir pour une architecture algérienne durable. Alliant patrimoine immatériel, performances thermiques et bilan carbone quasi-nul, elle mérite une réintégration dans les référentiels de construction — notamment pour le logement rural et les petits équipements publics en zones isolées.</p>
    `.trim(),
    category_id: CAT.materiaux,
    tags: ['construction en terre', 'adobe', 'pisé', 'architecture vernaculaire', 'M\'Zab', 'ksour', 'développement durable', 'Algérie'],
    bibliography: [
      'Radouane M. (2021). Le patrimoine bâti en terre en Algérie, inspiration d\'un savoir-faire. Actes du Colloque Archi Bas Carbone, SciencesConf.',
      'Guillaud H., Joffroy T., Odul P. (1985). Blocs de terre comprimée — Manuel de conception et de construction. CRATerre-EAG / GRET, Grenoble.',
      'Oliver P. (2006). Built to Meet Needs: Cultural Issues in Vernacular Architecture. Architectural Press, Oxford.',
      'UNESCO (1982). Nomination du M\'Zab au patrimoine mondial. Centre du Patrimoine Mondial, Paris.',
      'Benbouza K., Haddad A. (2020). Les matériaux de construction locaux, un appui pour une architecture durable. Architecture, Maison & Jardins d\'Afrique & de l\'Univers (AMJAU), 12(1).',
    ],
    doi: null,
    read_time_min: 12,
    source_url: 'https://archibascarbone.sciencesconf.org/data/pages/RADOUANE_Texte_Meriem_Radouane_Actes_colloque_Archi_bas_carbone_table_ronde_Patrimoine.pdf',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. STRUCTURES — Calcul des poutres en béton armé (Eurocode 2 / BAEL)
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Calcul des poutres en béton armé selon le BAEL 91 et le DTR algérien',
    excerpt: 'Guide de calcul complet des poutres rectangulaires en béton armé : détermination des moments fléchissants, vérification à l\'ELU (flexion, cisaillement), à l\'ELS (flèche, fissuration) selon le BAEL 91 modifié et le DTR-BC 2.2 algérien.',
    content: `
<h2>Introduction</h2>
<p>Le calcul des poutres en béton armé est la compétence fondamentale de tout ingénieur en génie civil. En Algérie, les règles de calcul sont définies par le <strong>DTR-BC 2.2 — CBA 93</strong> (Calcul du Béton Armé), inspiré du BAEL 91 français mais adapté au contexte algérien (matériaux locaux, conditions climatiques, sismicité).</p>

<h2>Données de base</h2>
<h3>Résistances caractéristiques</h3>
<ul>
  <li><strong>Béton</strong> : fc28 = 25 MPa (minimum recommandé pour bâtiments courants), fbu = 0,85·fc28/(γb·θ) à l'ELU</li>
  <li><strong>Acier</strong> : HA (haute adhérence) Fe E400 (fe = 400 MPa) ou Fe E500 (fe = 500 MPa)</li>
  <li><strong>Coefficient γb</strong> = 1,50 (situations durables) ; <strong>γs</strong> = 1,15 pour l'acier</li>
</ul>

<h3>Combinaisons d'actions (ELU Fondamental)</h3>
<pre>Mu = 1,35·Mg + 1,5·Mq</pre>
<p>Où Mg = moment dû aux charges permanentes G, Mq = moment dû aux charges d'exploitation Q.</p>

<h2>Flexion simple — Calcul des armatures longitudinales</h2>

<h3>Étape 1 : Moment réduit μ</h3>
<pre>μ = Mu / (b·d²·fbu)</pre>
<p>Où b = largeur de la section, d = hauteur utile (d ≈ 0,9·h), fbu = 0,85·fc28 / (1,5·θ) avec θ = 1,0 (chargement normal).</p>

<h3>Étape 2 : Vérification de la section (pivot A ou B)</h3>
<ul>
  <li>Si μ ≤ μlim = 0,392 (aciers Fe E400) → section simplement armée (pivot A)</li>
  <li>Si μ &gt; μlim → section doublement armée (armatures de compression nécessaires)</li>
</ul>

<h3>Étape 3 : Armatures (section simplement armée)</h3>
<pre>α = 1,25·(1 - √(1-2μ))
z = d·(1 - 0,4α)
As = Mu / (z·fyd)      avec fyd = fe/γs</pre>

<h3>Exemple numérique</h3>
<p>Poutre 25×50 cm, fc28=25 MPa, Fe E400, Mu=80 kN·m :</p>
<ul>
  <li>d = 0,9×50 = 45 cm ; fbu = 14,17 MPa ; fyd = 347,8 MPa</li>
  <li>μ = 80 000/(0,25×0,45²×14 170 000) = 0,1113 &lt; 0,392 → pivot A</li>
  <li>α = 1,25×(1-√(1-2×0,1113)) = 0,147 ; z = 0,45×(1-0,4×0,147) = 0,424 m</li>
  <li>As = 80 000/(0,424×347 800) = <strong>5,42 cm²</strong> → 3HA16 (6,03 cm²) ✓</li>
</ul>

<h2>Vérification au cisaillement (effort tranchant)</h2>
<pre>τu = Vu / (b·d)    (contrainte de cisaillement moyenne)
τadm = min(0,2·fc28/γb ; 4 MPa)</pre>
<p>Si τu &gt; τadm → renforcement par cadres et étriers nécessaire.</p>

<h3>Armatures transversales minimales (Art. 7.4.2.2 CBA 93)</h3>
<pre>Ast/st ≥ 0,003·b    (aciers transversaux)</pre>
<p>Espacement maximal des cadres :</p>
<ul>
  <li>En zone courante : st ≤ min(0,9·d ; 40 cm)</li>
  <li>En zone de about (sur appui, longueur = d) : st ≤ min(d/4 ; 12φl)</li>
</ul>

<h2>Vérification à l'ELS — Limitation de la flèche</h2>
<p>La flèche totale f doit rester ≤ L/500 (règle générale) et ≤ 1 cm (éléments non porteurs de cloisons). Calcul selon la formule globale (art. 5.5.2 BAEL) :</p>
<pre>fréelle = fij + fgj + fpi - fgi</pre>
<p>Où fij = flèche différée sous charges permanentes, fgj = flèche supplémentaire fluage, fpi = flèche instantanée totale, fgi = flèche instantanée charges permanentes seules.</p>

<h2>Fissuration et durabilité</h2>
<p>En Algérie, expositions fréquentes à l'humidité (côte méditerranéenne) ou aux sels de déverglaçage (zones froides) imposent une vérification de la fissuration :</p>
<ul>
  <li>Classe d'exposition XC4 (alternance humide-sec) : wmax = 0,2 mm (CBA 93)</li>
  <li>Classe XS1 (marine, aérosol salé, côtes algériennes) : wmax = 0,2 mm + enrobage c ≥ 40 mm</li>
</ul>

<h2>Conclusion</h2>
<p>La maîtrise du calcul des poutres en béton armé selon le CBA 93 est indispensable pour tout ingénieur génie civil algérien. Les étapes décrites ici — moments réduits, armatures longitudinales, vérification au cisaillement et à l'ELS — constituent le cœur du dimensionnement des éléments fléchis dans les bâtiments courants algériens.</p>
    `.trim(),
    category_id: CAT.beton,
    tags: ['béton armé', 'calcul de poutres', 'BAEL 91', 'DTR CBA 93', 'flexion', 'cisaillement', 'ELU', 'ELS', 'armatures'],
    bibliography: [
      'DTR-BC 2.2 (1994). Calcul du Béton Armé — CBA 93. Centre National du Bâtiment et des Travaux Publics, Alger.',
      'BAEL 91 révisé 99 (1999). Règles techniques de conception et de calcul des ouvrages et constructions en béton armé. AFNOR, Paris.',
      'Thonier H. (2000). Le béton armé — Conception et calcul selon les eurocodes. Presses de l\'École Nationale des Ponts et Chaussées, Paris.',
      'Perchat J., Roux J. (2003). Pratique du BAEL 91 révisé 99. 2e éd., Eyrolles, Paris.',
      'Raoul J. (2007). Guide de calcul des structures en béton armé. SETRA / LCPC, Bagneux.',
    ],
    doi: null,
    read_time_min: 14,
    source_url: null,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 7. ROUTES — Dimensionnement des chaussées souples
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Dimensionnement des chaussées souples en Algérie : méthode du CTTP et catalogue de structures',
    excerpt: 'Méthode de dimensionnement des chaussées souples selon le guide algérien du CTTP : trafic de référence, portance du sol de plate-forme (CBR), structures types et calcul des épaisseurs de couches (GNT, grave-bitume, béton bitumineux).',
    content: `
<h2>Introduction</h2>
<p>Le réseau routier algérien compte environ <strong>125 000 km</strong> toutes catégories confondues (2023), dont l'autoroute Est-Ouest (1 216 km), le plus long chantier routier africain. Le dimensionnement des chaussées en Algérie est régi par le <strong>Guide Technique de Dimensionnement des Chaussées Neuves</strong> du Centre de Travaux des Travaux Publics (CTTP, 2001), complété par des recommandations issues du Guide LCPC-SETRA français.</p>

<h2>Paramètres de dimensionnement</h2>

<h3>1. Trafic de dimensionnement</h3>
<p>Le trafic est exprimé en <strong>nombre d'essieux équivalents de référence</strong> (poids de référence : essieu simple de 13 tonnes, pression de gonflage 0,662 MPa) sur la voie la plus chargée pendant la durée de service (20 ans).</p>
<pre>Ne = T₀ × CAM × Cd × (1 - (1+t)^n) / (-t)</pre>
<p>Où : T₀ = trafic initial (PL/j), CAM = coefficient d'agressivité moyen (0,5–2,0), Cd = coefficient de distribution sur voies, t = taux de croissance annuel, n = durée de service (ans).</p>

<h3>2. Portance du sol de support — Indice CBR</h3>
<table>
  <thead><tr><th>Classe de sol</th><th>CBR après 4 jours d'imbibition</th><th>EV2 (MPa)</th></tr></thead>
  <tbody>
    <tr><td>S1 — Très mauvais</td><td>CBR &lt; 5</td><td>&lt; 20</td></tr>
    <tr><td>S2 — Mauvais</td><td>5 ≤ CBR &lt; 10</td><td>20–30</td></tr>
    <tr><td>S3 — Moyen</td><td>10 ≤ CBR &lt; 25</td><td>30–50</td></tr>
    <tr><td>S4 — Bon</td><td>25 ≤ CBR &lt; 40</td><td>50–80</td></tr>
    <tr><td>S5 — Très bon</td><td>CBR ≥ 40</td><td>&gt; 80</td></tr>
  </tbody>
</table>

<h2>Structure type des chaussées souples algériennes</h2>
<p>Les structures types du catalogue CTTP se déclinent selon le trafic cumulé Ne et la classe de sol S :</p>

<h3>Exemple — Voie nationale, trafic moyen (Ne = 5×10⁶ ESSAM), sol S3</h3>
<ul>
  <li><strong>Couche de roulement</strong> : 6 cm de béton bitumineux semi-grenu (BBSG 0/14)</li>
  <li><strong>Couche de liaison</strong> : 8 cm de grave-bitume (GB 0/20, teneur bitume 4,0–4,5 %)</li>
  <li><strong>Couche de base</strong> : 20 cm de grave-bitume (GB 0/31,5)</li>
  <li><strong>Couche de fondation</strong> : 25 cm de grave non traitée (GNT A, ou grave-ciment pour trafics élevés)</li>
</ul>

<h2>Formulation des bétons bitumineux</h2>
<p>Les enrobés bitumineux doivent satisfaire les critères de la norme algérienne NAG 18-001 :</p>
<ul>
  <li>Module de rigidité à 15°C / 10 Hz : E ≥ 5 500 MPa (BBSG)</li>
  <li>Résistance à l'orniérage (essai de presse à cisaillement giratoire, PCG) : profondeur d'ornière ≤ 7,5 % à 10 000 girations pour BBSG</li>
  <li>Module de fatigue : ε₆ (déformation admissible à 10⁶ cycles) ≥ 100 μdéform.</li>
</ul>

<h2>Contraintes climatiques algériennes</h2>
<p>Le dimensionnement doit intégrer les conditions climatiques extrêmes :</p>
<ul>
  <li><strong>Zone Tell méditerranéen</strong> : pas de gel significatif, températures élevées en été (45°C en surface de chaussée) → risque d'orniérage à chaud (flache). Utiliser bitumes 35/50 ou modifiés.</li>
  <li><strong>Zone montagneuse</strong> (Aurès, Kabyle, Atlas saharien) : gel hivernal, cycles gel-dégel → risque de fissuration à froid. Utiliser bitumes 50/70 ou PG (Performance Grade) bas.</li>
  <li><strong>Zone saharienne</strong> : amplitudes thermiques extrêmes (ΔT journalier = 25–40°C), vents de sable abrasifs → couches d'usure résistantes à l'abrasion éolienne.</li>
</ul>

<h2>Entretien et rechargement</h2>
<p>La durée de service de 20 ans impose une stratégie d'entretien :</p>
<ul>
  <li>Entretien courant (années 5–10) : colmatage des fissures, enduit superficiel monocouche</li>
  <li>Renforcement structural (années 12–15) : fraisage + reprofilage en GB + couche d'usure neuve</li>
  <li>Rechargement global (années 20) : reprofilage complet de la chaussée</li>
</ul>

<h2>Conclusion</h2>
<p>Le dimensionnement des chaussées en Algérie reste un enjeu majeur au regard des investissements (programme d'1 million km de routes rurales, doublement de l'autoroute est-ouest vers le Sahara). La maîtrise du catalogue CTTP et des méthodes de vérification mécanistique-empirique (logiciel ALIZE de l'IFSTTAR) est indispensable aux ingénieurs des Directions des Travaux Publics (DTP) de wilayas.</p>
    `.trim(),
    category_id: CAT.routes,
    tags: ['chaussées souples', 'dimensionnement', 'CTTP', 'CBR', 'grave-bitume', 'béton bitumineux', 'routes Algérie', 'VRD'],
    bibliography: [
      'CTTP (2001). Guide Technique de Dimensionnement des Chaussées Neuves. Centre de Travaux des Travaux Publics, Alger.',
      'LCPC-SETRA (1994). Catalogue des Structures Types de Chaussées Neuves. LCPC, Paris.',
      'Jeuffroy G., Sauterey R. (1991). Cours de routes. 2e éd., Presses de l\'ENPC, Paris.',
      'AFNOR NF EN 13108-1 (2016). Mélanges bitumineux — Spécifications des matériaux — Béton bitumineux.',
      'DTR C4-16 (2000). Règles de calcul des structures en béton armé de ponts routiers. Min. TPHU, Alger.',
    ],
    doi: null,
    read_time_min: 12,
    source_url: null,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 8. HYDRAULIQUE — Réseaux d'assainissement urbain
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Hydraulique des réseaux d\'assainissement : conception et dimensionnement pour les villes algériennes',
    excerpt: 'Conception et dimensionnement des réseaux d\'assainissement urbain en Algérie : systèmes unitaires vs séparatifs, formule de Manning-Strickler, débit de pointe, critères de vitesse et dimensionnement des bassins de rétention.',
    content: `
<h2>Introduction</h2>
<p>L'assainissement urbain constitue un défi majeur en Algérie, où le taux de raccordement au réseau d'assainissement est d'environ <strong>87 %</strong> dans les zones urbaines (2023), mais les réseaux existants souffrent de vétusté, de surcharges lors des pluies orageuses et d'une gestion insuffisante. Les inondations récurrentes (Annaba 2018, Alger 2021, Béchar 2022) illustrent les limites des réseaux en place.</p>

<h2>Systèmes de collecte</h2>

<h3>Système unitaire</h3>
<p>Un seul réseau collecte eaux usées domestiques, eaux industrielles ET eaux pluviales. Avantages : moins de travaux, moins coûteux à poser. Inconvénients : rejets d'eaux brutes en temps de pluie (déversoirs d'orage), charge de traitement variable à la STEP.</p>
<p>→ Système dominant dans le Tell algérien (héritage colonial) et dans la plupart des villes algériennes existantes.</p>

<h3>Système séparatif</h3>
<p>Deux réseaux distincts : un pour les eaux usées, un pour les eaux pluviales. Nécessite davantage de travaux mais protège mieux la STEP et les milieux récepteurs.</p>
<p>→ Imposé pour toutes les nouvelles zones urbanisées depuis la circulaire DTUHC N° 001/2010.</p>

<h2>Dimensionnement hydraulique — Formule de Manning-Strickler</h2>
<pre>Q = K · S · R^(2/3) · I^(1/2)</pre>
<p>Où : Q = débit (m³/s), K = coefficient de Strickler (60–80 pour béton lisse, 35–50 pour béton ordinaire), S = section mouillée (m²), R = rayon hydraulique (m), I = pente hydraulique (m/m).</p>

<h3>Critères de vitesse</h3>
<ul>
  <li><strong>Vitesse minimale d'auto-curage</strong> : Vmin = 0,60 m/s (pour Qp) — pour éviter le dépôt des matières en suspension</li>
  <li><strong>Vitesse maximale</strong> : Vmax = 3,0 m/s (béton armé ordinaire) ; 5,0 m/s (béton fibré, dalot béton pré-contraint)</li>
  <li><strong>Remplissage maximal</strong> : y/D ≤ 0,80 à Qp (maintien d'une ventilation naturelle)</li>
</ul>

<h2>Débit de pointe des eaux usées</h2>
<pre>Qp = Qmoy · Cp</pre>
<p>Coefficient de pointe Cp (formule de Babbitt en Algérie) :</p>
<pre>Cp = 1 + 14 / (4 + √Qmoy)    (Qmoy en L/s)</pre>
<p>Débit moyen en L/s = population × dotation journalière (L/hab/j) × coefficient de rejet (0,80) / 86 400.</p>
<p>En Algérie, dotation résidentielle courante : 150–250 L/hab/j selon la zone et le niveau d'équipement.</p>

<h2>Dimensionnement aux eaux pluviales</h2>
<p>En Algérie, la méthode rationnelle est standard pour les bassins versants urbains :</p>
<pre>Qp = C · i(tc) · A / 3,6</pre>
<p>Où : C = coefficient de ruissellement (0,70–0,95 en zone dense), i(tc) = intensité pluviométrique pour la durée critique tc (en mm/h, d'après les courbes IDF des stations météo ALG, ORN, ANN, const., etc.), A = superficie du bassin versant en hectares.</p>

<h3>Fréquence de dimensionnement recommandée</h3>
<ul>
  <li>Réseaux courants (rues, quartiers) : période de retour T = 10 ans</li>
  <li>Axes structurants, sous-passages : T = 25 ans</li>
  <li>Ouvrages à risques (tunnels routiers, nœuds autoroutiers) : T = 50 à 100 ans</li>
</ul>

<h2>Bassins de rétention et déversoirs d'orage</h2>
<p>Pour limiter les rejets lors des pluies intenses, les bassins de rétention sont désormais exigés dans les lotissements &gt; 5 ha. Volume de stockage :</p>
<pre>V = (Qp - Qs) · tc</pre>
<p>Où Qs = débit de fuite admissible vers le réseau aval (limité à Qp10ans du réseau aval), tc = durée de la pluie critique.</p>

<h2>Matériaux de canalisation courants en Algérie</h2>
<table>
  <thead><tr><th>Matériau</th><th>DN disponibles</th><th>Domaine d'emploi</th></tr></thead>
  <tbody>
    <tr><td>Béton armé (BPAN)</td><td>300–2000 mm</td><td>Collecteurs principaux, pluviaux</td></tr>
    <tr><td>PVC assainissement</td><td>110–630 mm</td><td>Branchements, réseau tertiaire</td></tr>
    <tr><td>Grès vernissé</td><td>150–600 mm</td><td>Réseaux anciens, résistance acides</td></tr>
    <tr><td>Fonte ductile</td><td>80–2000 mm</td><td>Refoulement (pose sous pression)</td></tr>
    <tr><td>PEHD</td><td>110–1200 mm</td><td>Eaux pluviales, flexibilité</td></tr>
  </tbody>
</table>

<h2>Conclusion</h2>
<p>Face aux enjeux climatiques (intensification des épisodes orageux au Maghreb) et à la croissance urbaine (Alger : 4,5 millions d'habitants, Oran : 1,5 million), la modernisation et le renforcement des réseaux d'assainissement sont des priorités nationales. L'intégration de la GUMP (Gestion Urbaine des Eaux de Pluie) — toitures végétalisées, noues paysagères, chaussées drainantes — offre des solutions complémentaires aux réseaux classiques.</p>
    `.trim(),
    category_id: CAT.hydraulique,
    tags: ['assainissement', 'réseaux', 'Manning-Strickler', 'eaux pluviales', 'eaux usées', 'STEP', 'urbanisme hydraulique', 'Algérie'],
    bibliography: [
      'Azzedine B. et al. (2008). Hydraulique urbaine. Office des Publications Universitaires (OPU), Alger.',
      'Dupont A. (1979). Hydraulique urbaine. Tome I : Hydrologie, captage, transport et traitement des eaux. Eyrolles, Paris.',
      'Ministère des Ressources en Eau (2010). Circulaire DTUHC N° 001/2010 relative aux réseaux d\'assainissement séparatif. Alger.',
      'LCPC (2006). Hydraulique routière — Principes de conception et de calcul. LCPC, Paris.',
      'Chow V.T., Maidment D.R., Mays L.W. (1988). Applied Hydrology. McGraw-Hill, New York.',
    ],
    doi: null,
    read_time_min: 11,
    source_url: null,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 9. DÉVELOPPEMENT DURABLE — Construction durable en Algérie
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Construction durable en Algérie : efficacité énergétique, matériaux biosourcés et réglementation thermique',
    excerpt: 'État des lieux et perspectives de la construction durable en Algérie : réglementation thermique DTR C3-2, matériaux d\'isolation disponibles localement, énergies renouvelables dans le bâtiment et certifications environnementales adaptées.',
    content: `
<h2>Contexte énergétique algérien</h2>
<p>L'Algérie consomme environ <strong>45 millions de TEP</strong> (tonnes équivalent pétrole) par an, dont 42 % pour le secteur résidentiel et tertiaire. La consommation d'énergie par logement algérien est estimée à 150–250 kWh/m²/an (climatisation + chauffage + eau chaude sanitaire), soit 2 à 3 fois supérieure à la moyenne européenne. Pourtant, l'Algérie dispose d'un gisement solaire exceptionnel : <strong>3 000 à 3 500 heures d'ensoleillement/an</strong> sur l'essentiel du territoire.</p>

<h2>Réglementation thermique — DTR C3-2 (2016)</h2>
<p>Le <strong>DTR C3-2</strong> (Document Technique Réglementaire sur l'isolation thermique des bâtiments) définit les performances thermiques minimales imposées aux constructions neuves :</p>

<h3>Zones climatiques algériennes (DTR C3-2)</h3>
<table>
  <thead><tr><th>Zone</th><th>Caractéristique</th><th>Wilayas concernées</th></tr></thead>
  <tbody>
    <tr><td>A — Saharienne</td><td>Très chaud, sec ; hiver doux</td><td>Adrar, Tamanrasset, In Salah, Djanet</td></tr>
    <tr><td>B — Semi-aride</td><td>Chaud en été, froid en hiver</td><td>Béchar, Laghouat, Biskra, Ouargla</td></tr>
    <tr><td>C — Méditerranéenne</td><td>Doux, humide ; été chaud</td><td>Alger, Oran, Annaba, Béjaïa</td></tr>
    <tr><td>D — Montagneuse</td><td>Hiver froid, été frais</td><td>Tizi-Ouzou, Sétif, Batna, Jijel montagnes</td></tr>
  </tbody>
</table>

<h3>Valeurs de résistance thermique minimales imposées (DTR C3-2)</h3>
<ul>
  <li>Toiture-terrasse : R ≥ 1,8 m².K/W (zone C), 2,5 m².K/W (zone D)</li>
  <li>Murs extérieurs : R ≥ 1,0 m².K/W (zones C, D)</li>
  <li>Planchers bas sur vide sanitaire : R ≥ 0,8 m².K/W</li>
  <li>Fenêtres : Uw ≤ 3,5 W/(m².K) — double vitrage recommandé</li>
</ul>

<h2>Matériaux d'isolation disponibles localement</h2>
<table>
  <thead><tr><th>Matériau</th><th>λ (W/m·K)</th><th>Épaisseur pour R=1,0</th><th>Disponibilité en Algérie</th></tr></thead>
  <tbody>
    <tr><td>Laine de verre</td><td>0,032–0,040</td><td>4 cm</td><td>Usines Algérienne du Verre Creux (APC)</td></tr>
    <tr><td>Polystyrène expansé (PSE)</td><td>0,036–0,040</td><td>4 cm</td><td>Production nationale (Saidal, SNMC)</td></tr>
    <tr><td>Liège expansé</td><td>0,036–0,040</td><td>4 cm</td><td>Gisements naturels en Algérie (Kabylie)</td></tr>
    <tr><td>Alfa (paille d'esparto)</td><td>0,045–0,055</td><td>5 cm</td><td>Abondant dans les Hauts Plateaux</td></tr>
    <tr><td>Argile expansée (billes)</td><td>0,10–0,15</td><td>12–15 cm</td><td>Importée (Lytag, Liapor)</td></tr>
  </tbody>
</table>

<h2>Stratégies bioclimatiques adaptées au contexte algérien</h2>

<h3>Tell méditerranéen (Alger, Oran, Annaba)</h3>
<ul>
  <li>Orientation bâtiment : façade principale N-S (gain solaire hiver sans surchauffe été)</li>
  <li>Débords de toiture : 80–100 cm pour masquer la fenêtre de juin à septembre</li>
  <li>Toiture végétalisée : réduction de 8–12°C de la température de surface en été</li>
  <li>Ventilation naturelle traversante (double façade N-S)</li>
</ul>

<h3>Hauts Plateaux et zones froides</h3>
<ul>
  <li>Mur Trombe : mur de stockage thermique en béton (20–30 cm) + vitrage → chauffage passif en hiver</li>
  <li>Serre bioclimatique adossée : gain thermique de 30–50 % sur l'hiver</li>
  <li>Compacité maximale du bâtiment : rapport S/V (surface enveloppe/volume habitable) ≤ 0,60</li>
</ul>

<h3>Sahara</h3>
<ul>
  <li>Masse thermique élevée (pisé, adobe) : déphasage de 8–12 h entre pic extérieur et pic intérieur</li>
  <li>Patio central : ventilation par effet cheminée, ombrage mutuel des façades</li>
  <li>Enduits blancs ou à base de chaux : réflectivité 60–80 % (albédo élevé)</li>
</ul>

<h2>Énergies renouvelables dans le bâtiment</h2>
<p>Le programme national de 22 000 MW d'ENR à l'horizon 2030 inclut le solaire photovoltaïque en autoconsommation pour le résidentiel. Quelques chiffres :</p>
<ul>
  <li>Irradiation globale horizontale : 1 700–2 650 kWh/m²/an selon les zones</li>
  <li>Rendement panneaux PV monocristallins : 18–22 %</li>
  <li>Chauffe-eau solaires : programme national de 100 000 unités/an, couvrant 50–80 % des besoins ECS</li>
</ul>

<h2>Conclusion</h2>
<p>La construction durable en Algérie est à la fois une nécessité économique (réduction des factures énergétiques) et une urgence environnementale (réduction des émissions de CO₂ du bâtiment). La combinaison du DTR C3-2, des techniques bioclimatiques et des matériaux locaux (liège, alfa, pisé, adobe) offre un arsenal technique complet pour concevoir des bâtiments à faible consommation énergétique adaptés à chaque région du pays.</p>
    `.trim(),
    category_id: CAT.durable,
    tags: ['construction durable', 'efficacité énergétique', 'DTR C3-2', 'isolation thermique', 'bioclimatique', 'ENR', 'Algérie'],
    bibliography: [
      'DTR C3-2 (2016). Réglementation thermique des bâtiments à usage d\'habitation en Algérie. Ministère de l\'Habitat, Alger.',
      'Moujalled B. et al. (2020). Analyse du potentiel de confort thermique passif des logements algériens. Revue de l\'Énergie, 643.',
      'CDER (2017). Atlas de l\'énergie solaire en Algérie. Centre de Développement des Énergies Renouvelables, Bou Ismaïl.',
      'Benbouza K., Haddad A. (2020). Les matériaux de construction locaux, un appui pour une architecture durable. AMJAU, 12(1).',
      'Mazria E. (1979). The Passive Solar Energy Book. Rodale Press, Emmaus PA.',
    ],
    doi: null,
    read_time_min: 13,
    source_url: null,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 10. ARCHITECTURE — Casbah d'Alger et architecture ottomane
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'La Casbah d\'Alger : architecture ottomane, enjeux de conservation et de réhabilitation',
    excerpt: 'Analyse architecturale de la Casbah d\'Alger (Patrimoine mondial UNESCO 1992) : morphologie urbaine, typologies de maisons (dar, maison à patio), éléments décoratifs andalous, état de conservation et stratégies de réhabilitation.',
    content: `
<h2>Présentation générale</h2>
<p>La Casbah d'Alger, classée au <strong>Patrimoine mondial de l'UNESCO en 1992</strong>, est l'un des sites historiques les plus remarquables du bassin méditerranéen. Édifiée sur un promontoire triangulaire dominant la baie d'Alger, cette médina ottomane conserve les traces de quatre siècles d'histoire (XVIe–XIXe siècle), imbriquées dans un tissu urbain dense et labyrinthique.</p>

<h3>Données géographiques et démographiques</h3>
<ul>
  <li>Superficie : environ <strong>105 hectares</strong></li>
  <li>Population : ~60 000 habitants (2020), contre 100 000 dans les années 1960</li>
  <li>Nombre de constructions : ~1 800 bâtiments (palais, maisons, mosquées, hammams, fondouks)</li>
  <li>Altitude : 0 m (basse Casbah, front de mer) à 118 m (haute Casbah, Fort de la Casbah)</li>
</ul>

<h2>Morphologie urbaine</h2>
<p>Le tissu urbain de la Casbah se caractérise par :</p>
<ul>
  <li><strong>Rues</strong> étroites (1,5 à 3,5 m de large), souvent en escalier, organisées en impasses (derbs) qui se terminent en cul-de-sac</li>
  <li><strong>Absence de trame orthogonale</strong> : la ville suit les courbes de niveau et optimise la ventilation naturelle et l'ombrage</li>
  <li><strong>Mitoyenneté totale</strong> des constructions : la chaleur est partagée/amortie entre bâtiments adjacents</li>
  <li><strong>Surplombs et encorbellements</strong> (1,0–2,0 m) au niveau des étages supérieurs — protection solaire et agrandissement des surfaces habitables</li>
</ul>

<h2>Types architecturaux</h2>

<h3>La Maison à Patio (Dar)</h3>
<p>Type dominant dans la Casbah. Organisation centripète : toutes les pièces sont ouvertes sur le patio central couvert (wast eddar) par des galeries à colonnades (ajour). Le patio assure la ventilation naturelle, l'éclairage et la régulation thermique.</p>
<p>Éléments caractéristiques :</p>
<ul>
  <li>Portail monumental en bois sculpté (clous dorés, arc en fer à cheval)</li>
  <li>Vestibule coudé (skifa) assurant l'intimité visuelle</li>
  <li>Galeries à colonnes de marbre de Carrare ou de Chemtou (Algérie antique)</li>
  <li>Fontaine centrale en marbre (jet d'eau et bassin)</li>
  <li>Décors en stuc ajouré, zelliges (carreaux de faïence), boiseries peintes</li>
</ul>

<h3>Le Palais Ottoman</h3>
<p>Réservé aux deys, beys, et grandes familles. Exemples : Palais des Raïs (Bastion 23, XVIIe s.), Dar Khedaoudj el Amia, Palais Hassan Pacha. Ces palais développent le programme de la maison à patio sur plusieurs cours et niveaux, avec des éléments décoratifs andalous (apportés par les Morisques expulsés d'Espagne après 1492).</p>

<h3>La Mosquée</h3>
<p>16 mosquées dans la Casbah dont la Grande Mosquée Ketchaoua (reconvertie plusieurs fois), Djama El Kebir (1097 apr. J.-C., la plus ancienne d'Alger), Sidi Abderrahman. Architecture à coupoles, minarets carrés à base carrée (tradition nord-africaine).</p>

<h2>Matériaux et techniques constructives</h2>
<ul>
  <li><strong>Structure</strong> : murs porteurs en moellons calcaire (grès tendre local), liés à la chaux aérienne</li>
  <li><strong>Voûtes et coupoles</strong> : brique cuite en opus incertum, arc outrepassé (en fer à cheval)</li>
  <li><strong>Charpente</strong> : bois de cèdre de l'Atlas (plafonds décorés, caissons polychromes)</li>
  <li><strong>Revêtements</strong> : chaux tadelakt poli (imperméabilisation des salles d'eau), carreaux de faïence, marbre d'Italie et de Carrare</li>
  <li><strong>Toitures-terrasses</strong> : technique de la dalle en mortier de chaux hydraulique (tufeau) + carrelage céramique local</li>
</ul>

<h2>État de conservation et menaces</h2>
<p>La Casbah est dans un état de dégradation avancée :</p>
<ul>
  <li><strong>Affaissements et effondrements</strong> : 200+ bâtiments en ruines totales ou partielles</li>
  <li><strong>Humidité et infiltrations</strong> : réseau d'assainissement vétuste, fuites des réseaux AEP</li>
  <li><strong>Surpopulation</strong> : logements subdivisés en petits appartements surpeuplés</li>
  <li><strong>Séismes</strong> : la Casbah est en zone III (la plus sismique d'Algérie)</li>
  <li><strong>Manque de financement</strong> : budget de réhabilitation insuffisant, procédures de classement complexes</li>
</ul>

<h2>Stratégies de réhabilitation</h2>
<ol>
  <li><strong>Plan permanent de sauvegarde et de mise en valeur</strong> (PPSMV) : document réglementaire imposant les règles de restauration par îlot</li>
  <li><strong>Techniques de consolidation</strong> : injection de coulis de chaux dans les murs fissurés, chaînage en acier inox, micropieux pour fondations dégradées</li>
  <li><strong>Relogement temporaire</strong> des occupants en logements relais pendant les travaux</li>
  <li><strong>Formation d'artisans</strong> spécialisés en restauration du patrimoine (stuc, zellige, boiserie) — programme ICOMOS/Algérie</li>
  <li><strong>Intégration touristique</strong> : musées de site, circuit patrimonial, chambres d'hôtes dans les maisons réhabilitées</li>
</ol>

<h2>Conclusion</h2>
<p>La Casbah d'Alger est bien plus qu'un monument historique — c'est un laboratoire vivant d'architecture méditerranéenne et un témoignage irremplaçable de la civilisation ottomane nord-africaine. Sa sauvegarde passe par une approche intégrée : technique (restauration des structures), sociale (amélioration des conditions de vie des habitants) et économique (valorisation patrimoniale). Le défi est immense mais urgent, car chaque effondrement détruit une page irremplaçable de l'histoire algérienne.</p>
    `.trim(),
    category_id: CAT.archi,
    tags: ['Casbah d\'Alger', 'architecture ottomane', 'patrimoine UNESCO', 'réhabilitation', 'médina', 'architecture vernaculaire', 'Algérie'],
    bibliography: [
      'UNESCO (1992). Nomination de la Casbah d\'Alger au Patrimoine Mondial. Centre du Patrimoine Mondial, Paris.',
      'Golvin L. (1988). Palais et maisons d\'Alger aux XVIIe et XVIIIe siècles. Publications du CNRS, Aix-en-Provence.',
      'Lesbet D. (1985). La Casbah d\'Alger — Gestion urbaine et vide social. Thèse d\'État, Paris X Nanterre.',
      'Écochard M., Letourneau C. (1938). Les bains de Damas. Mémoires PIFD, Beyrouth.',
      'Ministère de la Culture (2013). Plan Permanent de Sauvegarde et de Mise en Valeur de la Casbah d\'Alger (PPSMV). Alger.',
    ],
    doi: null,
    read_time_min: 12,
    source_url: 'https://asjp.cerist.dz',
  },

];

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  const INSERT = process.argv.includes('--insert');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Seed Articles Scientifiques — Al Handassa.dz');
  console.log(`  Mode : ${INSERT ? '⚡ INSERTION EN BASE' : '🔍 DRY-RUN (ajoutez --insert)'}`);
  console.log(`  ${ARTICLES.length} articles à traiter`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = await pool.connect();

  // Titres déjà en base
  const existing = await client.query('SELECT title FROM articles');
  const existingTitles = new Set(existing.rows.map(r => r.title.trim().toLowerCase()));
  console.log(`  ${existingTitles.size} articles déjà en base\n`);

  let inserted = 0, skipped = 0;

  for (const a of ARTICLES) {
    if (existingTitles.has(a.title.trim().toLowerCase())) {
      console.log(`  ⏭  [existe] ${a.title.substring(0, 70)}`);
      skipped++;
      continue;
    }

    // Générer le slug unique
    let slug = slugify(a.title);
    if (!INSERT) {
      console.log(`  🔍 [CAT ${a.category_id}] ${a.title.substring(0, 65)}…`);
      inserted++;
      continue;
    }

    // Vérifier unicité slug
    const sc = await client.query('SELECT id FROM articles WHERE slug=$1', [slug]);
    if (sc.rows.length) slug = slug + '-' + Date.now();

    // Estimation du temps de lecture si non fournie
    const wordCount = a.content.replace(/<[^>]+>/g, '').split(/\s+/).length;
    const readTime = a.read_time_min || Math.max(5, Math.round(wordCount / 200));

    await client.query(
      `INSERT INTO articles (
        title, slug, excerpt, content, category_id,
        thumbnail_url, read_time_min, is_free, price,
        language, tags, bibliography, doi,
        is_published, published_at
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,TRUE,0,
        'fr',$8,$9,$10,
        TRUE,NOW()
      )`,
      [
        a.title, slug, a.excerpt, a.content, a.category_id,
        a.thumbnail_url || null, readTime,
        a.tags, a.bibliography || [],
        a.doi || null,
      ]
    );
    console.log(`  ✅ [CAT ${a.category_id}] ${a.title.substring(0, 65)}…`);
    inserted++;
  }

  client.release();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (INSERT) {
    console.log(`  ✅ Insérés : ${inserted}  |  ⏭ Déjà en base : ${skipped}`);
  } else {
    console.log(`  ${inserted} à insérer  |  ${skipped} déjà présents`);
    console.log('  → Relancez avec --insert pour insérer en base');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
