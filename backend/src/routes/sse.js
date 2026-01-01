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
    console.log('❌ SSE: No token provided');
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

    // Prevent timeout for long-running connections
    req.setTimeout(0); // Disable timeout
    res.setTimeout(0); // Disable timeout

    // Add client to SSE service
    try {
      sseService.addClient(userId, res);
      console.log(`✅ SSE client added for user: ${userId} (Total clients: ${sseService.getTotalClients()})`);
    } catch (addError) {
      console.error('❌ Error adding SSE client:', addError);
      return res.status(500).json({ error: 'Failed to establish SSE connection' });
    }

    // Keep connection alive with periodic ping
    const pingInterval = setInterval(() => {
      try {
        if (!res.headersSent) {
          res.write(': ping\n\n');
        }
      } catch (error) {
        console.error('❌ Error sending ping:', error);
        clearInterval(pingInterval);
        sseService.removeClient(userId, res);
      }
    }, 30000); // Send ping every 30 seconds

    // Clean up on close
    res.on('close', () => {
      console.log(`🔌 SSE connection closed for user: ${userId}`);
      clearInterval(pingInterval);
      sseService.removeClient(userId, res);
    });

    // Handle errors
    res.on('error', (error) => {
      console.error(`❌ SSE connection error for user ${userId}:`, error);
      clearInterval(pingInterval);
      sseService.removeClient(userId, res);
    });
  } catch (error) {
    console.error('❌ SSE authentication error:', error.message);
    if (!res.headersSent) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
});

module.exports = router;
