/**
 * WhatsApp Notification Service
 * Supports multiple providers: Twilio, WhatsApp Cloud API, or CallMeBot
 */

const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'callmebot'; // 'twilio', 'cloud-api', or 'callmebot'
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM; // Format: whatsapp:+14155238886
    this.whatsappCloudApiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    this.whatsappCloudApiPhoneNumberId = process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;
    this.callmebotApiKey = process.env.CALLMEBOT_API_KEY;
    this.adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER; // The number to send notifications to
  }

  /**
   * Format phone number for WhatsApp (international format)
   * @param {string} phoneNumber - Phone number in any format
   * @returns {string} - Formatted phone number (e.g., +213XXXXXXXXX)
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 0, replace with country code (Algeria: 213)
    if (cleaned.startsWith('0')) {
      cleaned = '213' + cleaned.substring(1);
    }
    // If it doesn't start with country code, add it
    else if (!cleaned.startsWith('213')) {
      cleaned = '213' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Format order details into a readable message
   */
  formatOrderMessage(order) {
    const items = order.items || [];
    const itemsList = items.map((item, index) => {
      const productName = item.product?.name || 'Unknown Product';
      const quantity = item.quantity || 1;
      const size = item.size || item.productSize?.size || '';
      const price = item.price || 0;
      return `${index + 1}. ${productName}${size ? ` (${size})` : ''} x${quantity} - ${price} DA`;
    }).join('\n');

    const deliveryInfo = order.deliveryType === 'HOME_DELIVERY' 
      ? `📍 Livraison à domicile\n${order.deliveryAddress || 'Adresse non spécifiée'}`
      : `🏪 Retrait en point relais\n${order.deliveryDesk?.name || 'Point relais non spécifié'}`;

    const wilayaInfo = order.deliveryDetails?.wilayaName || order.city?.name || 'N/A';
    const communeInfo = order.deliveryDetails?.communeName || 'N/A';

    return `🛒 *Nouvelle Commande #${order.orderNumber}*

👤 *Client:*
• Nom: ${order.customerName}
• Téléphone: ${order.customerPhone}
${order.customerEmail ? `• Email: ${order.customerEmail}` : ''}

📦 *Articles:*
${itemsList}

💰 *Total:*
• Sous-total: ${order.subtotal} DA
${order.deliveryFee ? `• Frais de livraison: ${order.deliveryFee} DA` : ''}
• *Total: ${order.total} DA*

🚚 *Livraison:*
${deliveryInfo}
• Wilaya: ${wilayaInfo}
${communeInfo !== 'N/A' ? `• Commune: ${communeInfo}` : ''}

${order.notes ? `📝 *Notes:* ${order.notes}` : ''}

🔗 Voir la commande: ${process.env.FRONTEND_URL || 'https://loudbrandss.com'}/admin/orders/${order.id}`;
  }

  /**
   * Send WhatsApp message using Twilio
   */
  async sendViaTwilio(message) {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioWhatsAppFrom) {
      throw new Error('Twilio credentials not configured');
    }

    const twilio = require('twilio');
    const client = twilio(this.twilioAccountSid, this.twilioAuthToken);

    const formattedNumber = this.formatPhoneNumber(this.adminWhatsAppNumber);

    try {
      const result = await client.messages.create({
        from: this.twilioWhatsAppFrom,
        to: `whatsapp:${formattedNumber}`,
        body: message
      });

      console.log('WhatsApp message sent via Twilio:', result.sid);
      return { success: true, messageId: result.sid, provider: 'twilio' };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message using WhatsApp Cloud API (Meta)
   */
  async sendViaCloudAPI(message) {
    if (!this.whatsappCloudApiToken || !this.whatsappCloudApiPhoneNumberId) {
      throw new Error('WhatsApp Cloud API credentials not configured');
    }

    const formattedNumber = this.formatPhoneNumber(this.adminWhatsAppNumber);
    // Remove + sign for Cloud API recipient number
    const recipientNumber = formattedNumber.replace('+', '');

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.whatsappCloudApiPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipientNumber, // Recipient phone number (admin's number)
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappCloudApiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp message sent via Cloud API:', response.data);
      return { success: true, messageId: response.data.messages[0].id, provider: 'cloud-api' };
    } catch (error) {
      console.error('WhatsApp Cloud API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send WhatsApp message using CallMeBot (free, simple HTTP API)
   * Note: This requires the recipient to have CallMeBot activated on their WhatsApp
   */
  async sendViaCallMeBot(message) {
    if (!this.callmebotApiKey || !this.adminWhatsAppNumber) {
      throw new Error('CallMeBot API key or admin number not configured');
    }

    const formattedNumber = this.formatPhoneNumber(this.adminWhatsAppNumber);
    // Remove + sign for CallMeBot
    const phoneNumber = formattedNumber.replace('+', '');

    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(message)}&apikey=${this.callmebotApiKey}`;
      
      const response = await axios.get(url, {
        timeout: 10000 // 10 second timeout
      });
      
      // CallMeBot returns different success messages depending on the API version
      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const successIndicators = ['Message sent', 'OK', 'success', 'Message Sent'];
      
      if (successIndicators.some(indicator => responseText.toLowerCase().includes(indicator.toLowerCase()))) {
        console.log('WhatsApp message sent via CallMeBot');
        return { success: true, provider: 'callmebot' };
      } else {
        // Log the actual response for debugging
        console.error('CallMeBot response:', responseText);
        throw new Error('CallMeBot returned error: ' + responseText);
      }
    } catch (error) {
      console.error('CallMeBot error:', error);
      throw error;
    }
  }

  /**
   * Send order notification to admin WhatsApp number
   */
  async sendOrderNotification(order) {
    if (!this.adminWhatsAppNumber) {
      console.warn('Admin WhatsApp number not configured. Skipping WhatsApp notification.');
      return { success: false, error: 'Admin WhatsApp number not configured' };
    }

    try {
      const message = this.formatOrderMessage(order);
      
      switch (this.provider) {
        case 'twilio':
          return await this.sendViaTwilio(message);
        case 'cloud-api':
          return await this.sendViaCloudAPI(message);
        case 'callmebot':
          return await this.sendViaCallMeBot(message);
        default:
          throw new Error(`Unknown WhatsApp provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();

