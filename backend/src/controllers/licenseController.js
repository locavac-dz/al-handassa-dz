const { query } = require('../config/database');
const { normalizeKey } = require('../utils/license');

// ─── POST /api/licenses/validate ───────────────────────────────────
// Endpoint public (pas d'authentification : appelé depuis l'app desktop,
// sans session plateforme). Ne renvoie jamais le détail d'un refus pour
// ne pas donner de prise à une énumération de clés.
async function validateLicense(req, res, next) {
  try {
    const key = normalizeKey(req.body?.key);
    if (key.length !== 24 || !key.startsWith('AH')) {
      return res.json({ valid: false });
    }

    const result = await query(
      `SELECT license_plan, status, expires_at, activated_at
       FROM software_licenses
       WHERE license_key = $1`,
      [key]
    );

    if (!result.rows.length) return res.json({ valid: false });

    const license = result.rows[0];
    const expired = new Date(license.expires_at) < new Date();
    if (license.status !== 'active' || expired) {
      return res.json({ valid: false });
    }

    if (!license.activated_at) {
      await query(`UPDATE software_licenses SET activated_at = NOW() WHERE license_key = $1`, [key]);
    }

    res.json({
      valid: true,
      plan: license.license_plan,
      expiresAt: license.expires_at,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { validateLicense };
