// Business analytics (Loud Styles). Admin only. Mounted at /api/analytics.
//   GET /overview?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|week|month|year
//   GET /profit?from=YYYY-MM-DD&to=YYYY-MM-DD

const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const analytics = require('../services/analytics');

const router = express.Router();
router.use(authenticateToken, requireRole(['ADMIN']));

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req.query));
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
};

router.get('/overview', handle(analytics.getOverview));
router.get('/profit', handle(analytics.getProfit));

module.exports = router;
