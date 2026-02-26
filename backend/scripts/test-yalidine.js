
const yalidineService = require('../src/services/yalidine');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    try {
        console.log('Testing Yalidine API...');
        const response = await yalidineService.getAllParcels({ page: 1 });
        console.log('Response Status:', response ? 'OK' : 'Empty');
        if (response && response.data) {
            console.log('Shipments found:', response.data.length);
            if (response.data.length > 0) {
                console.log('Sample Tracking:', response.data[0].tracking);
                console.log('Sample Status:', response.data[0].last_status);
            }
        } else {
            console.log('No data found or structure mismatch.');
            console.log(JSON.stringify(response, null, 2));
        }
    } catch (error) {
        console.error('API Error:', error.message);
    }
}

main();
