const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// Système de points de fidélité
const userLoyalty = new Map(); // userID -> { points, level, badges }

const LEVELS = [
  { name: 'Bronze 🥉', minPoints: 0, multiplier: 1 },
  { name: 'Silver 🥈', minPoints: 500, multiplier: 1.5 },
  { name: 'Gold 🏆', minPoints: 1000, multiplier: 2 }
];

function getLevelByPoints(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}

// Ajouter des points après un achat
router.post('/add-points', authenticate, (req, res) => {
  try {
    const { userId, orderAmount } = req.body;
    const points = Math.floor(orderAmount); // 1 DA = 1 point

    let loyalty = userLoyalty.get(userId) || { points: 0, level: 'Bronze', badges: [] };
    loyalty.points += points;
    loyalty.level = getLevelByPoints(loyalty.points).name;

    // Ajouter des badges spéciaux
    if (loyalty.points === 100) loyalty.badges.push('🎯 Première centaine');
    if (loyalty.points === 500) loyalty.badges.push('🌟 Niveau Silver atteint');
    if (loyalty.points === 1000) loyalty.badges.push('👑 Niveau Gold atteint');

    userLoyalty.set(userId, loyalty);

    res.json({
      success: true,
      points_added: points,
      total_points: loyalty.points,
      level: loyalty.level,
      next_level_points: loyalty.points >= 1000 ? '∞' : (1000 - loyalty.points)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir l'état de fidélité
router.get('/status', authenticate, (req, res) => {
  try {
    const loyalty = userLoyalty.get(req.user.id) || { points: 0, level: 'Bronze 🥉', badges: [] };

    res.json({
      points: loyalty.points,
      level: loyalty.level,
      badges: loyalty.badges,
      redemption_options: [
        { points: 100, reward: '10% de réduction', description: 'Valable 30 jours' },
        { points: 250, reward: '30% de réduction', description: 'Valable 30 jours' },
        { points: 500, reward: 'Panier gratuit', description: 'Un produit gratuit au choix' },
        { points: 1000, reward: 'Accès VIP', description: 'Accès prioritaire aux nouveautés' }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Utiliser des points
router.post('/redeem', authenticate, (req, res) => {
  try {
    const { redeemPoints } = req.body;
    const loyalty = userLoyalty.get(req.user.id);

    if (!loyalty || loyalty.points < redeemPoints) {
      return res.status(400).json({ error: 'Points insuffisants' });
    }

    loyalty.points -= redeemPoints;
    loyalty.level = getLevelByPoints(loyalty.points).name;

    const discount = {
      100: 0.10,
      250: 0.30,
      500: 'free_product',
      1000: 'vip_access'
    }[redeemPoints] || 0;

    res.json({
      success: true,
      points_redeemed: redeemPoints,
      remaining_points: loyalty.points,
      reward: discount,
      message: `✅ ${redeemPoints} points utilisés avec succès!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard (top 10)
router.get('/leaderboard', (req, res) => {
  const leaderboard = Array.from(userLoyalty.entries())
    .map(([userId, data]) => ({
      userId,
      points: data.points,
      level: data.level
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)
    .map((user, rank) => ({ ...user, rank: rank + 1 }));

  res.json({ data: leaderboard });
});

module.exports = router;
