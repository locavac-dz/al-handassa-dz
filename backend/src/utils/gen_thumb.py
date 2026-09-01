"""
gen_thumb.py — Génère une miniature JPEG depuis la 1ère page d'un PDF.
Usage : python gen_thumb.py <input.pdf> <output.jpg>
"""
import sys, fitz

def main():
    if len(sys.argv) != 3:
        print("Usage: python gen_thumb.py <input.pdf> <output.jpg>", file=sys.stderr)
        sys.exit(1)

    pdf_path, out_path = sys.argv[1], sys.argv[2]
    doc = fitz.open(pdf_path)

    # Trouver la première page non vide (max 5 pages)
    page_index = 0
    for i in range(min(5, len(doc))):
        if doc[i].get_text().strip():
            page_index = i
            break

    page = doc[page_index]
    # Zoom adapté : cible ~400px de largeur pour thumbnails web
    # La plupart des PDFs font 595pt (A4) → zoom 0.67 ≈ 400px
    page_width = page.rect.width
    target_w = 420  # pixels
    zoom = target_w / page_width if page_width > 0 else 0.7
    zoom = max(0.5, min(zoom, 1.5))  # clamper entre 0.5x et 1.5x

    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)

    # Sauvegarder en JPEG avec compression (jpg_quality 75 = bon rapport qualité/taille)
    pix.save(out_path, "jpeg", jpg_quality=78)
    doc.close()
    print(f"OK: {out_path}")

if __name__ == '__main__':
    main()
