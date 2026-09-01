/**
 * generateThumb.js
 * Génère une miniature JPEG depuis la première page d'un PDF via PyMuPDF.
 */

const { execFile } = require('child_process');
const path = require('path');
const fs   = require('fs');

const SCRIPT = path.join(__dirname, 'gen_thumb.py');

/**
 * @param {string} pdfPath   Chemin absolu vers le PDF source
 * @param {string} outPath   Chemin absolu vers le JPEG de sortie
 * @returns {Promise<void>}
 */
function generateThumb(pdfPath, outPath) {
  return new Promise((resolve, reject) => {
    execFile('python', [SCRIPT, pdfPath, outPath], (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve();
    });
  });
}

module.exports = { generateThumb };
