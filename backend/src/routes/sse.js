const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const sseService = require('../services/sse-service');
const router = express.Router();

/**
 * SSE endpoint for real-time notifications
 * GET /api/sse/notifications?token=xxx
 * Requires authentication via query parameter (EventSource doesn't support headers)
 */
// Handle OPTIONS preflight for SSE
router.options('/notifications', (req, res) => {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  });
  res.end();
});

router.get('/notifications', async (req, res, next) => {
  // Wrap everything in try-catch to prevent unhandled errors
  try {
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
      
      // JWT token contains 'userId', not 'id'
      const userId = req.user.userId || req.user.id;
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

    // Set SSE headers BEFORE adding client
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Send initial connection message immediately
    try {
      const connectionMessage = {
        type: 'connected',
        message: 'SSE connection established',
        userId: userId,
        userRole: userRole,
        timestamp: new Date().toISOString()
      };
      res.write(`data: ${JSON.stringify(connectionMessage)}\n\n`);
      console.log(`📤 Sent connection message to user ${userId}:`, connectionMessage);
    } catch (error) {
      console.error('❌ Error sending initial connection message:', error.message);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Failed to establish SSE connection' });
      }
      return;
    }

    // Add client to SSE service
    try {
      sseService.addClient(userId, res);
      console.log(`✅ SSE client added for user: ${userId} (Total clients: ${sseService.getTotalClients()})`);
    } catch (addError) {
      console.error('❌ Error adding SSE client:', addError);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Failed to establish SSE connection' });
      }
      return;
    }

    // Keep connection alive with periodic ping
    // Use 20 seconds to stay well within Heroku's 55-second timeout
    const pingInterval = setInterval(() => {
      try {
        // Check if connection is still writable before sending ping
        if (res.destroyed || res.closed || !res.writable) {
          console.warn(`⚠️ Connection not writable for ping, user ${userId}`);
          clearInterval(pingInterval);
          sseService.removeClient(userId, res);
          return;
        }
        
        res.write(': ping\n\n');
        console.log(`💓 Ping sent to user ${userId}`);
      } catch (error) {
        console.error('❌ Error sending ping:', error.message);
        clearInterval(pingInterval);
        sseService.removeClient(userId, res);
      }
    }, 20000); // Send ping every 20 seconds (well within Heroku's 55s timeout)

    // Clean up on close
    res.on('close', () => {
      console.log(`🔌 SSE connection closed for user: ${userId}`);
      clearInterval(pingInterval);
      sseService.removeClient(userId, res);
    });

    // Handle errors
    res.on('error', (error) => {
      console.error(`❌ SSE connection error for user ${userId}:`, error.message || error);
      clearInterval(pingInterval);
      sseService.removeClient(userId, res);
    });

    // Handle finish event (connection ended normally)
    res.on('finish', () => {
      console.log(`✅ SSE connection finished for user: ${userId}`);
      clearInterval(pingInterval);
      sseService.removeClient(userId, res);
    });
    } catch (error) {
      console.error('❌ SSE authentication error:', error.message);
      if (!res.headersSent) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      return;
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error('❌ Unexpected SSE route error:', error.message || error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    // If headers already sent, we can't send a response, but we should still log
    console.error('❌ SSE error after headers sent, connection may be broken');
  }
});

// Test endpoint to verify SSE route is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'SSE route is working',
    timestamp: new Date().toISOString(),
    totalClients: sseService.getTotalClients()
  });
});

module.exports = router;
