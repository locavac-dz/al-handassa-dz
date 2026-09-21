/**
 * Génération automatique d'aperçu PDF → JPG
 * Appelé après upload d'un produit (PDF ou ZIP)
 *
 * Politique de l'aperçu : pour un produit PAYANT, seules les `maxPages` premières pages sont publiées (PDF tronqué +
 * images). Publier le PDF entier revenait à donner gratuitement le produit vendu (previews/ est public). Un produit
 * gratuit garde son aperçu complet (maxPages = 0). Valeur par défaut : PREVIEW_MAX_PAGES (5 ; 0 = pas de limite).
 */
const { execFile } = require('child_process');
const path = require('path');
const fs   = require('fs');

const UPLOADS = path.join(__dirname, '../../uploads');
const PREVIEWS = path.join(UPLOADS, 'previews');

// Nombre de pages d'aperçu d'un produit payant (PREVIEW_MAX_PAGES, défaut 5 ; 0 = illimité)
function defaultMaxPages() {
  const n = parseInt(process.env.PREVIEW_MAX_PAGES, 10);
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

// Script Python inline pour générer les aperçus (nécessite PyMuPDF : pip install pymupdf)
const PYTHON_SCRIPT = `
import sys, os, shutil, zipfile, re
try:
    import pymupdf as fitz   # PyMuPDF ≥ 1.24.3 (l'import « fitz » est déprécié et affiche un avertissement)
except ImportError:
    import fitz

file_path   = sys.argv[1]
slug_base   = sys.argv[2]
previews_dir= sys.argv[3]
max_pages   = int(sys.argv[4]) if len(sys.argv) > 4 else 0   # 0 = toutes les pages

os.makedirs(previews_dir, exist_ok=True)

def gen_from_pdf(pdf_path, slug):
    prev_pdf = os.path.join(previews_dir, f"preview_{slug}.pdf")
    doc = fitz.open(pdf_path)
    total = len(doc)
    nb = min(total, max_pages) if max_pages > 0 else total
    if nb < total:
        doc.select(list(range(nb)))          # ne garde que les nb premières pages
        doc.save(prev_pdf, garbage=4, deflate=True)
    else:
        doc.close()
        shutil.copy2(pdf_path, prev_pdf)
        doc = fitz.open(pdf_path)
    for i in range(nb):
        pix = doc[i].get_pixmap(matrix=fitz.Matrix(1.8, 1.8))
        pix.save(os.path.join(previews_dir, f"{slug}_p{i+1}.jpg"))
    doc.close()
    print(nb)

ext = os.path.splitext(file_path)[1].lower()

if ext == '.pdf':
    gen_from_pdf(file_path, slug_base)

elif ext == '.zip':
    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            pdfs = [n for n in z.namelist() if n.lower().endswith('.pdf') and not n.startswith('__')]
            if not pdfs:
                print(0)
                sys.exit(0)
            best = max(pdfs, key=lambda n: z.getinfo(n).file_size)
            tmp  = os.path.join(previews_dir, '_tmp_preview.pdf')
            with z.open(best) as src, open(tmp, 'wb') as dst:
                dst.write(src.read())
        gen_from_pdf(tmp, slug_base)
        if os.path.exists(tmp):
            os.remove(tmp)
    except Exception as e:
        print(0)
else:
    print(0)
`;

/**
 * Lance la génération d'aperçu en arrière-plan
 * @param {string} filePath   - chemin absolu du fichier uploadé
 * @param {string} productId  - id du produit en base
 * @param {string} slug       - slug du produit
 * @param {function} updateDb - callback pour mettre à jour la BDD
 * @param {{maxPages?: number}} [opts] - pages d'aperçu (0 = toutes ; défaut : PREVIEW_MAX_PAGES)
 */
function generatePreviewAsync(filePath, productId, slug, updateDb, { maxPages } = {}) {
  if (!fs.existsSync(filePath)) return;

  const ext = path.extname(filePath).toLowerCase();
  if (!['.pdf', '.zip'].includes(ext)) return;

  const limit = Number.isInteger(maxPages) && maxPages >= 0 ? maxPages : defaultMaxPages();

  // Slug de l'aperçu (simplifié, max 40 chars)
  const slugBase = slug.replace(/[^a-z0-9-]/g, '').slice(0, 40);

  // Écrire le script Python temporairement
  const scriptPath = path.join(PREVIEWS, '_gen_preview.py');
  if (!fs.existsSync(PREVIEWS)) fs.mkdirSync(PREVIEWS, { recursive: true });
  fs.writeFileSync(scriptPath, PYTHON_SCRIPT);

  // Interpréteur Python : PREVIEW_PYTHON (chemin explicite) puis python3 / python du PATH
  const pythons = [process.env.PREVIEW_PYTHON, 'python3', 'python'].filter(Boolean);

  function tryPython(idx) {
    if (idx >= pythons.length) {
      console.warn('[Preview] Python introuvable — aperçu non généré');
      return;
    }
    execFile(pythons[idx], [scriptPath, filePath, slugBase, PREVIEWS, String(limit)],
      { timeout: 120000 },
      (err, stdout, stderr) => {
        if (err) {
          if (idx < pythons.length - 1) return tryPython(idx + 1);
          console.warn('[Preview] Erreur génération:', err.message);
          return;
        }
        // Le nombre de pages est la DERNIÈRE ligne : d'éventuels avertissements de PyMuPDF ne doivent pas le masquer
        const nbPages = parseInt(stdout.trim().split('\n').pop(), 10) || 0;
        if (nbPages > 0) {
          const previewUrl = `/uploads/previews/preview_${slugBase}.pdf`;
          updateDb(productId, previewUrl, nbPages);
          console.log(`[Preview] ${nbPages} page(s) générée(s) pour ${slug}${limit ? ` (limite ${limit})` : ''}`);
        } else {
          console.warn('[Preview] 0 pages générées pour', slug);
        }
      }
    );
  }

  tryPython(0);
}

module.exports = { generatePreviewAsync, defaultMaxPages };
