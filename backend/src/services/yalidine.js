const axios = require('axios');

class YalidineService {
  constructor() {
    this.baseURL = 'https://api.yalidine.app/v1';
    this.apiId = process.env.YALIDINE_API_ID;
    this.apiToken = process.env.YALIDINE_API_TOKEN;

    console.log('🔍 Yalidine API Debug Info:');
    console.log('API ID:', this.apiId ? `${this.apiId.substring(0, 10)}...` : 'NOT SET');
    console.log('API Token:', this.apiToken ? `${this.apiToken.substring(0, 10)}...` : 'NOT SET');
    console.log('Base URL:', this.baseURL);

    if (!this.apiId || !this.apiToken) {
      console.warn('⚠️ Yalidine API credentials not configured. Shipping features will be disabled.');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-API-ID': this.apiId,
        'X-API-TOKEN': this.apiToken,
        'Content-Type': 'application/json'
      },
      timeout: 30000, // Increased timeout for better reliability
      validateStatus: function (status) {
        // Don't throw error for 4xx and 5xx status codes, handle them manually
        return status < 600;
      }
    });

    // Add response interceptor to log rate limit headers
    this.client.interceptors.response.use(
      (response) => {
        console.log('📊 Rate Limits:', {
          'Second-Quota-Left': response.headers['second-quota-left'],
          'Minute-Quota-Left': response.headers['minute-quota-left'],
          'Hour-Quota-Left': response.headers['hour-quota-left'],
          'Day-Quota-Left': response.headers['day-quota-left']
        });
        return response;
      },
      (error) => {
        if (error.response) {
          console.error('❌ API Error:', {
            status: error.response.status,
            data: error.response.data,
            headers: {
              'Second-Quota-Left': error.response.headers['second-quota-left'],
              'Minute-Quota-Left': error.response.headers['minute-quota-left'],
              'Hour-Quota-Left': error.response.headers['hour-quota-left'],
              'Day-Quota-Left': error.response.headers['day-quota-left']
            }
          });
        }
        return Promise.reject(error);
      }
    );
  }

  // Check if API is configured
  isConfigured() {
    return !!(this.apiId && this.apiToken);
  }

  // Get all wilayas (provinces)
  async getWilayas() {
    if (!this.isConfigured()) {
      throw new Error('Yalidine API credentials not configured');
    }
    try {
      console.log('🔍 Fetching wilayas from Yalidine API...');
      const response = await this.client.get('/wilayas/');
      console.log('✅ Successfully fetched wilayas');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching wilayas:', error.message);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', JSON.stringify(error.response.data));
        console.error('❌ Response headers:', JSON.stringify(error.response.headers));
      }
      if (error.request) {
        console.error('❌ Request made but no response received');
        console.error('❌ Request config:', JSON.stringify({
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }));
      }
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Failed to fetch wilayas: ${errorMessage}`);
    }
  }

  // Get communes by wilaya
  async getCommunes(wilayaId = null) {
    try {
      const url = wilayaId ? `/communes/?wilaya_id=${wilayaId}` : '/communes/';
      console.log('🔍 Fetching communes from Yalidine API...', wilayaId ? `for wilaya ${wilayaId}` : '');
      const response = await this.client.get(url);
      console.log('✅ Successfully fetched communes');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching communes:', error.message);
      throw new Error('Failed to fetch communes');
    }
  }

  // Get pickup centers
  async getCenters(wilayaId = null) {
    try {
      const url = wilayaId ? `/centers/?wilaya_id=${wilayaId}` : '/centers/';
      console.log('🔍 Fetching centers from Yalidine API...', wilayaId ? `for wilaya ${wilayaId}` : '');
      const response = await this.client.get(url);
      console.log('✅ Successfully fetched centers');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching centers:', error.message);
      throw new Error('Failed to fetch pickup centers');
    }
  }

  // Calculate shipping fees
  async calculateFees(fromWilayaId, toWilayaId) {
    try {
      console.log('🔍 Calculating fees from wilaya', fromWilayaId, 'to wilaya', toWilayaId);
      const response = await this.client.get(`/fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`);
      console.log('✅ Successfully calculated fees');
      return response.data;
    } catch (error) {
      console.error('❌ Error calculating fees:', error.message);
      throw new Error('Failed to calculate shipping fees');
    }
  }

  // Create a new parcel/shipment
  async createParcel(parcelData) {
    try {
      console.log('🔍 Creating parcel with data:', {
        order_id: parcelData.order_id,
        firstname: parcelData.firstname,
        familyname: parcelData.familyname,
        contact_phone: parcelData.contact_phone,
        to_wilaya_name: parcelData.to_wilaya_name,
        to_commune_name: parcelData.to_commune_name
      });

      const response = await this.client.post('/parcels/', [parcelData]);
      console.log('✅ Successfully created parcel');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating parcel:', error.message);
      if (error.response && error.response.data) {
        console.error('API Error details:', error.response.data);
      }
      throw new Error('Failed to create shipment');
    }
  }

  // Create multiple parcels
  async createParcels(parcelsData) {
    try {
      console.log('🔍 Creating multiple parcels:', parcelsData.length);
      const response = await this.client.post('/parcels/', parcelsData);
      console.log('✅ Successfully created parcels');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating parcels:', error.message);
      throw new Error('Failed to create shipments');
    }
  }

  // Get parcel details
  async getParcel(tracking) {
    try {
      console.log('🔍 Fetching parcel details for tracking:', tracking);
      // Encode tracking number to handle special characters like :
      const encodedTracking = encodeURIComponent(tracking);
      const response = await this.client.get(`/parcels/${encodedTracking}`);
      console.log('✅ Successfully fetched parcel details');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching parcel:', error.message);
      if (error.response) {
        console.error('❌ Error response:', error.response.data);
      }
      throw new Error('Failed to fetch parcel details');
    }
  }

  // Get parcel history/tracking
  async getParcelHistory(tracking) {
    try {
      console.log('🔍 Fetching parcel history for tracking:', tracking);
      // Encode tracking number to handle special characters like :
      const encodedTracking = encodeURIComponent(tracking);
      const response = await this.client.get(`/histories/?tracking=${encodedTracking}`);
      console.log('✅ Successfully fetched parcel history');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching parcel history:', error.message);
      if (error.response) {
        console.error('❌ Error response:', error.response.data);
      }
      throw new Error('Failed to fetch tracking information');
    }
  }

  // Update parcel
  async updateParcel(tracking, updateData) {
    try {
      console.log('🔍 Updating parcel:', tracking);
      // Encode tracking number to handle special characters like :
      const encodedTracking = encodeURIComponent(tracking);
      const response = await this.client.patch(`/parcels/${encodedTracking}`, updateData);
      console.log('✅ Successfully updated parcel');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating parcel:', error.message);
      if (error.response) {
        console.error('❌ Error response:', error.response.data);
      }
      throw new Error('Failed to update shipment');
    }
  }

  // Delete parcel
  async deleteParcel(tracking) {
    try {
      console.log('🔍 Deleting parcel:', tracking);
      // Encode tracking number to handle special characters like :
      const encodedTracking = encodeURIComponent(tracking);
      const response = await this.client.delete(`/parcels/${encodedTracking}`);
      console.log('✅ Successfully deleted parcel');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting parcel:', error.message);
      if (error.response) {
        console.error('❌ Error response:', error.response.data);
      }
      throw new Error('Failed to delete shipment');
    }
  }

  // Get all parcels/shipments with filters
  async getAllParcels(filters = {}) {
    try {
      console.log('🔍 Fetching all parcels from Yalidine API with filters:', filters);

      // Build query parameters according to Yalidine API documentation
      const queryParams = new URLSearchParams();

      // Set page_size to maximum (1000) to get all parcels in one request
      queryParams.append('page_size', '1000');

      // Add page parameter if provided
      if (filters.page && !isNaN(filters.page) && filters.page > 0) {
        queryParams.append('page', filters.page.toString());
      }

      // Add last_status filter if provided (Yalidine uses last_status parameter)
      if (filters.status && filters.status.trim() !== '') {
        queryParams.append('last_status', filters.status.trim());
      }

      // Add tracking filter if provided
      if (filters.tracking && filters.tracking.trim() !== '') {
        queryParams.append('tracking', filters.tracking.trim());
      }

      // Add order_id filter if provided
      if (filters.order_id && filters.order_id.trim() !== '') {
        queryParams.append('order_id', filters.order_id.trim());
      }

      // Add to_wilaya_id filter if provided
      if (filters.to_wilaya_id && !isNaN(filters.to_wilaya_id)) {
        queryParams.append('to_wilaya_id', filters.to_wilaya_id.toString());
      }

      // Add to_commune_name filter if provided
      if (filters.to_commune_name && filters.to_commune_name.trim() !== '') {
        queryParams.append('to_commune_name', filters.to_commune_name.trim());
      }

      // Add is_stopdesk filter if provided
      if (filters.is_stopdesk !== undefined) {
        queryParams.append('is_stopdesk', filters.is_stopdesk.toString());
      }

      // Add freeshipping filter if provided
      if (filters.freeshipping !== undefined) {
        queryParams.append('freeshipping', filters.freeshipping.toString());
      }

      // Add date_creation filter if provided
      if (filters.date_creation && filters.date_creation.trim() !== '') {
        queryParams.append('date_creation', filters.date_creation.trim());
      }

      // Add date_last_status filter if provided
      if (filters.date_last_status && filters.date_last_status.trim() !== '') {
        queryParams.append('date_last_status', filters.date_last_status.trim());
      }

      // Add payment_status filter if provided
      if (filters.payment_status && filters.payment_status.trim() !== '') {
        queryParams.append('payment_status', filters.payment_status.trim());
      }

      // Use the correct Yalidine API endpoint
      const url = `/parcels/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 Fetching parcels from Yalidine API:', url);

      const response = await this.client.get(url);
      console.log('✅ Successfully fetched parcels, count:', response.data.data?.length || 0);
      console.log('📊 Total data available:', response.data.total_data || 0);
      console.log('🔄 Has more pages:', response.data.has_more || false);

      // Debug: Log the first shipment to see available fields
      if (response.data.data && response.data.data.length > 0) {
        console.log('🔍 Sample shipment data structure:', JSON.stringify(response.data.data[0], null, 2));
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching parcels:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error('Failed to fetch shipments');
    }
  }

  // Calculate weight fees
  calculateWeightFees(weight, oversizeFee) {
    if (weight <= 5) return 0;
    return (weight - 5) * oversizeFee;
  }

  // Calculate volumetric weight
  calculateVolumetricWeight(length, width, height) {
    return (length * width * height * 0.0002);
  }

  // Get billable weight
  getBillableWeight(actualWeight, length, width, height) {
    const volumetricWeight = this.calculateVolumetricWeight(length, width, height);
    return Math.max(actualWeight, volumetricWeight);
  }

  // Calculate total shipping cost
  calculateTotalCost(baseFee, weight, oversizeFee, codPercentage = 0, declaredValue = 0) {
    const weightFee = this.calculateWeightFees(weight, oversizeFee);
    const codFee = codPercentage > 0 ? (declaredValue * codPercentage / 100) : 0;

    return {
      baseFee,
      weightFee,
      codFee,
      total: baseFee + weightFee + codFee
    };
  }

  // Validate phone number (Relaxed format)
  validatePhoneNumber(phone) {
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    // Accept valid lengths (9 to 15 digits to accommodate various formats)
    return cleanPhone.length >= 9 && cleanPhone.length <= 15;
  }

  // Format parcel data for API
  formatParcelData(orderData) {
    const {
      orderId,
      firstname,
      familyname,
      contactPhone,
      address,
      fromWilayaName,
      toWilayaName,
      toCommuneName,
      productList,
      price,
      weight,
      length,
      width,
      height,
      isStopDesk = false,
      stopDeskId = null,
      doInsurance = false,
      declaredValue = 0,
      freeshipping = false,
      hasExchange = false,
      productToCollect = null
    } = orderData;

    const cleanPhone = contactPhone.replace(/\D/g, '');

    const payload = {
      order_id: orderId,
      from_wilaya_name: fromWilayaName,
      firstname: firstname,
      familyname: familyname,
      contact_phone: cleanPhone,
      address: address,
      to_commune_name: toCommuneName ? toCommuneName.trim() : '',
      to_wilaya_name: toWilayaName ? toWilayaName.trim() : '',
      product_list: productList,
      price: Math.round(price),
      do_insurance: doInsurance,
      declared_value: Math.round(declaredValue),
      length: Math.round(length),
      width: Math.round(width),
      height: Math.round(height),
      weight: Math.round(weight),
      freeshipping: freeshipping,
      is_stopdesk: isStopDesk,
      has_exchange: hasExchange,
      product_to_collect: productToCollect
    };

    // Only include stopdesk_id if it is a stopdesk delivery and ID is provided
    if (isStopDesk && stopDeskId) {
      payload.stopdesk_id = stopDeskId;
    } else {
      delete payload.stopdesk_id; // Ensure it is omitted completely
    }

    return payload;
  }

  // Test API connection and list available endpoints
  async testConnection() {
    try {
      console.log('🔍 Testing Yalidine API connection...');

      // Test basic connection
      const response = await this.client.get('/');
      console.log('✅ API connection successful');

      // Try to get account info or available endpoints
      try {
        const accountResponse = await this.client.get('/account/');
        console.log('✅ Account info available:', accountResponse.data);
      } catch (accountError) {
        console.log('⚠️ Account endpoint not available');
      }

      // Try to get available endpoints
      try {
        const endpointsResponse = await this.client.get('/api/');
        console.log('✅ Available endpoints:', endpointsResponse.data);
      } catch (endpointsError) {
        console.log('⚠️ Endpoints listing not available');
      }

      return { success: true, message: 'API connection successful' };
    } catch (error) {
      console.error('❌ API connection failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Get API status and rate limits
  async getApiStatus() {
    try {
      const response = await this.client.get('/wilayas/');
      return {
        status: 'connected',
        rateLimits: {
          secondQuotaLeft: response.headers['second-quota-left'],
          minuteQuotaLeft: response.headers['minute-quota-left'],
          hourQuotaLeft: response.headers['hour-quota-left'],
          dayQuotaLeft: response.headers['day-quota-left']
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}

module.exports = new YalidineService(); 