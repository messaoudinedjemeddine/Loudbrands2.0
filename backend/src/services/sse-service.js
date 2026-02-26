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
   * @param {number} maxConnectionsPerUser - Maximum connections allowed per user (default: 2)
   */
  addClient(userId, res, maxConnectionsPerUser = 2) {
    try {
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      
      const userClients = this.clients.get(userId);
      
      // Limit connections per user - close oldest connections if limit exceeded
      if (userClients.size >= maxConnectionsPerUser) {
        console.warn(`⚠️ User ${userId} has ${userClients.size} connections, limiting to ${maxConnectionsPerUser}`);
        // Close oldest connections (first in Set)
        const clientsArray = Array.from(userClients);
        const toClose = clientsArray.slice(0, userClients.size - maxConnectionsPerUser + 1);
        toClose.forEach(oldRes => {
          try {
            if (oldRes && !oldRes.destroyed && oldRes.writable) {
              oldRes.end(); // Gracefully close old connection
            }
          } catch (e) {
            console.warn('Error closing old connection:', e.message);
          }
          this.removeClient(userId, oldRes);
        });
      }
      
      userClients.add(res);

      // Note: Headers should be set in the route handler before calling addClient
      // This method just manages the client connection

      // Handle client disconnect
      res.on('close', () => {
        console.log(`🔌 SSE connection closed event for user ${userId}`);
        this.removeClient(userId, res);
      });

      // Handle errors
      res.on('error', (error) => {
        console.error(`❌ SSE connection error for user ${userId}:`, error.message || error);
        this.removeClient(userId, res);
      });

      // Handle finish event
      res.on('finish', () => {
        console.log(`✅ SSE connection finished for user ${userId}`);
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
   * Check if a response object is still writable
   * @param {Object} res - Express response object
   * @returns {boolean}
   */
  isConnectionAlive(res) {
    try {
      if (!res) return false;
      // Check if response is still writable and not destroyed
      // res.headersSent can be true (headers sent) or false (not sent yet)
      // We need res.writable to be true and res.destroyed/res.closed to be false
      return !res.destroyed && 
             !res.closed && 
             res.writable !== false && 
             typeof res.write === 'function';
    } catch (error) {
      console.error('Error checking connection state:', error.message);
      return false;
    }
  }

  /**
   * Send a message to a specific client connection
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   * @param {Object} data - Data to send
   */
  sendToClient(userId, res, data) {
    try {
      // Check if connection is still alive before writing
      if (!this.isConnectionAlive(res)) {
        console.warn(`⚠️ Connection not writable for user ${userId}, removing client`);
        this.removeClient(userId, res);
        return false;
      }

      const message = `data: ${JSON.stringify(data)}\n\n`;
      console.log(`📤 Sending SSE message to client ${userId}:`, data.type || 'unknown');
      res.write(message);
      console.log(`✅ SSE message written to client ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending SSE message to client ${userId}:`, error.message);
      this.removeClient(userId, res);
      return false;
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
        // Check if connection is still alive before writing
        if (!this.isConnectionAlive(res)) {
          console.warn(`⚠️ Connection not writable for user ${userId}, marking for removal`);
          disconnectedClients.push(res);
          return;
        }

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

  /**
   * Get all connected user IDs (for debugging)
   * @returns {Array<string>}
   */
  getConnectedUserIds() {
    return Array.from(this.clients.keys());
  }
}

// Export singleton instance
module.exports = new SSEService();
