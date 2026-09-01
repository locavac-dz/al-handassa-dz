/**
 * Génération automatique d'aperçu PDF → JPG
 * Appelé après upload d'un produit (PDF ou ZIP)
 */
const { execFile } = require('child_process');
const path = require('path');
const fs   = require('fs');

const UPLOADS = path.join(__dirname, '../../uploads');
const PREVIEWS = path.join(UPLOADS, 'previews');

// Script Python inline pour générer les aperçus
const PYTHON_SCRIPT = `
import sys, os, shutil, zipfile, re
import fitz  # PyMuPDF

file_path   = sys.argv[1]
slug_base   = sys.argv[2]
previews_dir= sys.argv[3]

os.makedirs(previews_dir, exist_ok=True)

def gen_from_pdf(pdf_path, slug):
    prev_pdf = os.path.join(previews_dir, f"preview_{slug}.pdf")
    shutil.copy2(pdf_path, prev_pdf)
    doc = fitz.open(pdf_path)
    nb  = len(doc)
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
 */
function generatePreviewAsync(filePath, productId, slug, updateDb) {
  if (!fs.existsSync(filePath)) return;

  const ext = path.extname(filePath).toLowerCase();
  if (!['.pdf', '.zip'].includes(ext)) return;

  // Slug de l'aperçu (simplifié, max 40 chars)
  const slugBase = slug.replace(/[^a-z0-9-]/g, '').slice(0, 40);

  // Écrire le script Python temporairement
  const scriptPath = path.join(PREVIEWS, '_gen_preview.py');
  if (!fs.existsSync(PREVIEWS)) fs.mkdirSync(PREVIEWS, { recursive: true });
  fs.writeFileSync(scriptPath, PYTHON_SCRIPT);

  // Trouver Python
  const pythons = ['python', 'python3',
    'C:\\Users\\33633\\AppData\\Local\\Programs\\Python\\Python312\\python.exe'];

  function tryPython(idx) {
    if (idx >= pythons.length) {
      console.warn('[Preview] Python introuvable — aperçu non généré');
      return;
    }
    execFile(pythons[idx], [scriptPath, filePath, slugBase, PREVIEWS],
      { timeout: 120000 },
      (err, stdout, stderr) => {
        if (err) {
          if (idx < pythons.length - 1) return tryPython(idx + 1);
          console.warn('[Preview] Erreur génération:', err.message);
          return;
        }
        const nbPages = parseInt(stdout.trim(), 10) || 0;
        if (nbPages > 0) {
          const previewUrl = `/uploads/previews/preview_${slugBase}.pdf`;
          updateDb(productId, previewUrl, nbPages);
          console.log(`[Preview] ${nbPages} pages générées pour ${slug}`);
        } else {
          console.warn('[Preview] 0 pages générées pour', slug);
        }
      }
    );
  }

  tryPython(0);
}

module.exports = { generatePreviewAsync };
