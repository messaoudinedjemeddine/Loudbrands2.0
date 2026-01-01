/**
 * Server-Sent Events (SSE) Service
 * Manages SSE connections and broadcasts notifications to connected clients
 */

class SSEService {
  constructor() {
    this.clients = new Map(); // Map of userId -> Set of response objects
  }

  /**
   * Add a new SSE client connection
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  addClient(userId, res) {
    try {
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(res);

      // Set up SSE headers - don't use writeHead if headers already sent
      if (!res.headersSent) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable nginx buffering
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        });
      } else {
        // Headers already sent, just set them
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
      }

      // Send initial connection message
      this.sendToClient(userId, res, {
        type: 'connected',
        message: 'SSE connection established',
        timestamp: new Date().toISOString()
      });

      // Handle client disconnect
      res.on('close', () => {
        this.removeClient(userId, res);
      });

      // Handle errors
      res.on('error', (error) => {
        console.error(`SSE connection error for user ${userId}:`, error);
        this.removeClient(userId, res);
      });

      console.log(`✅ SSE client connected: ${userId} (Total clients: ${this.getTotalClients()})`);
    } catch (error) {
      console.error(`❌ Error adding SSE client ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a client connection
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  removeClient(userId, res) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(res);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
    console.log(`SSE client disconnected: ${userId} (Total clients: ${this.getTotalClients()})`);
  }

  /**
   * Send a message to a specific client connection
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   * @param {Object} data - Data to send
   */
  sendToClient(userId, res, data) {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      res.write(message);
    } catch (error) {
      console.error(`Error sending SSE message to client ${userId}:`, error);
      this.removeClient(userId, res);
    }
  }

  /**
   * Broadcast a notification to all clients of a specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  sendToUser(userId, notification) {
    if (!this.clients.has(userId)) {
      console.log(`No SSE clients found for user: ${userId}`);
      return false;
    }

    const userClients = this.clients.get(userId);
    const disconnectedClients = [];
    let successCount = 0;

    userClients.forEach(res => {
      try {
        const message = `data: ${JSON.stringify(notification)}\n\n`;
        res.write(message);
        successCount++;
        console.log(`✅ SSE message sent to client ${userId} (${successCount}/${userClients.size})`);
      } catch (error) {
        console.error(`❌ Error broadcasting to client ${userId}:`, error.message);
        disconnectedClients.push(res);
      }
    });

    // Clean up disconnected clients
    disconnectedClients.forEach(res => {
      this.removeClient(userId, res);
    });

    return successCount > 0;
  }

  /**
   * Broadcast a notification to all admin users
   * @param {Object} notification - Notification data
   */
  broadcastToAdmins(notification) {
    let sentCount = 0;
    this.clients.forEach((clients, userId) => {
      if (this.sendToUser(userId, notification)) {
        sentCount++;
      }
    });
    console.log(`SSE notification broadcasted to ${sentCount} admin user(s)`);
    return sentCount;
  }

  /**
   * Get total number of connected clients
   * @returns {number}
   */
  getTotalClients() {
    let total = 0;
    this.clients.forEach(clients => {
      total += clients.size;
    });
    return total;
  }

  /**
   * Get number of connected clients for a specific user
   * @param {string} userId - User ID
   * @returns {number}
   */
  getUserClientCount(userId) {
    return this.clients.has(userId) ? this.clients.get(userId).size : 0;
  }
}

// Export singleton instance
module.exports = new SSEService();
