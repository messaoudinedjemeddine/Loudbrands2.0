const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const sseService = require('../services/sse-service');
const router = express.Router();

/**
 * SSE endpoint for real-time notifications
 * GET /api/sse/notifications?token=xxx
 * Requires authentication via query parameter (EventSource doesn't support headers)
 */
router.get('/notifications', async (req, res, next) => {
  // Extract token from query parameter (EventSource limitation)
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // Manually authenticate using the token
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request for middleware compatibility
    req.user = decoded;
    
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`🔌 SSE connection attempt from user: ${userId} (${userRole})`);

    // Only allow admin roles to connect
    const allowedRoles = ['ADMIN', 'CONFIRMATRICE', 'AGENT_LIVRAISON', 'STOCK_MANAGER'];
    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ SSE access denied for user: ${userId} (${userRole})`);
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    // Add client to SSE service
    sseService.addClient(userId, res);
    console.log(`✅ SSE client added for user: ${userId} (Total clients: ${sseService.getTotalClients()})`);

    // Keep connection alive with periodic ping
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (error) {
        clearInterval(pingInterval);
        sseService.removeClient(userId, res);
      }
    }, 30000); // Send ping every 30 seconds

    // Clean up on close
    res.on('close', () => {
      clearInterval(pingInterval);
      sseService.removeClient(userId, res);
    });
  } catch (error) {
    console.error('❌ SSE authentication error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
