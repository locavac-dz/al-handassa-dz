/**
 * fix-video-thumbs.js
 * - Vidéos YouTube sans thumbnail → hqdefault.jpg de YouTube
 * - Vidéos MP4 locales sans thumbnail → frame extraite avec FFmpeg
 */
require('dotenv').config();
const { Pool } = require('pg');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const UPLOADS   = path.join(__dirname, 'uploads');
const THUMB_DIR = path.join(UPLOADS, 'images', 'thumbs');
fs.mkdirSync(THUMB_DIR, { recursive: true });

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// FFmpeg : extraire une frame à t=5s (ou t=2s si la vidéo est courte)
function extractFrame(videoPath, outPath, seekSec = 5) {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', [
      '-ss', String(seekSec),
      '-i', videoPath,
      '-vframes', '1',
      '-vf', 'scale=480:-1',   // largeur 480px, hauteur proportionnelle
      '-q:v', '4',             // qualité JPEG (2=meilleure, 5=acceptable)
      '-y',                    // écraser si existant
      outPath,
    ], { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        // Réessayer à 2s si 5s dépasse la durée
        if (seekSec > 2) {
          return extractFrame(videoPath, outPath, 2).then(resolve).catch(reject);
        }
        return reject(new Error(stderr?.split('\n').pop()?.trim() || err.message));
      }
      resolve();
    });
  });
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Fix miniatures vidéos — Al Handassa.dz');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const res = await pool.query(`
    SELECT id, title, slug, video_url, source, thumbnail_url
    FROM videos
    WHERE is_active = TRUE
      AND (thumbnail_url IS NULL OR thumbnail_url = '')
    ORDER BY created_at DESC
  `);

  console.log(`  ${res.rows.length} vidéos sans miniature\n`);

  let fixedYT = 0, fixedMP4 = 0, skipped = 0, failed = 0;

  for (const v of res.rows) {
    const ytId = extractYouTubeId(v.video_url);

    if (ytId) {
      // ── Vidéo YouTube ──────────────────────────────────────────────────
      const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      await pool.query('UPDATE videos SET thumbnail_url=$1, updated_at=NOW() WHERE id=$2', [thumbUrl, v.id]);
      console.log(`  ✅ [YT]  ${v.title.substring(0, 60)}`);
      fixedYT++;

    } else if (v.video_url && v.video_url.startsWith('/uploads/')) {
      // ── Vidéo MP4 locale ───────────────────────────────────────────────
      const videoPath = path.join(UPLOADS, v.video_url.replace('/uploads/', ''));
      if (!fs.existsSync(videoPath)) {
        console.log(`  ⚠  [MP4] Fichier introuvable : ${v.video_url}`);
        skipped++;
        continue;
      }
      const filename = `thumb-vid-${v.slug || v.id}.jpg`;
      const outPath  = path.join(THUMB_DIR, filename);
      process.stdout.write(`  ⏳ [MP4] ${v.title.substring(0, 55).padEnd(56)} `);
      try {
        await extractFrame(videoPath, outPath);
        const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
        const thumbUrl = `/uploads/images/thumbs/${filename}`;
        await pool.query('UPDATE videos SET thumbnail_url=$1, updated_at=NOW() WHERE id=$2', [thumbUrl, v.id]);
        console.log(`→ ✅ ${sizeKB} KB`);
        fixedMP4++;
      } catch (err) {
        console.log(`→ ❌ ${err.message.substring(0, 60)}`);
        failed++;
      }
    } else {
      console.log(`  ⚠  [???] Aucune source : ${v.title.substring(0, 55)}`);
      skipped++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ✅ YouTube  : ${fixedYT}`);
  console.log(`  ✅ MP4 local: ${fixedMP4}`);
  console.log(`  ❌ Échecs   : ${failed}`);
  console.log(`  ⚠  Ignorées : ${skipped}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
