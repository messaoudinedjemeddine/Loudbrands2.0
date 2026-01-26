require('dotenv').config();
const yalidineService = require('./src/services/yalidine');

async function testFees() {
    console.log('--- Debugging Fee Calculation ---');

    if (!yalidineService.isConfigured()) {
        console.error('Yalidine not configured in .env');
        return;
    }

    const fromWilayaId = 5; // Batna
    const toWilayaId = 16; // Alger (Standard test)

    // Scenario 1: Hardcoded Shipment Defaults (What shipOrder uses)
    // length: 30, width: 20, height: 10, weight: 1
    console.log('\n--- Scenario 1: "Ordinary" Shipment Defaults (1kg, 30x20x10) ---');
    await runCalculation(fromWilayaId, toWilayaId, 1, 30, 20, 10, 5000);

    // Scenario 2: Small Order (1 Item) - Should match Scenario 1 roughly
    // sum + 0.5 = 0.5kg
    // sum + 10 = 10cm height
    console.log('\n--- Scenario 2: Small Dynamic Order (0.5kg, 30x20x10) ---');
    await runCalculation(fromWilayaId, toWilayaId, 0.5, 30, 20, 10, 5000);

    // Scenario 3: Medium Order (5 Items)
    // sum + 0.5 = 2.5kg
    // sum + 10 = 50cm height
    // Volumetric might trigger here?
    console.log('\n--- Scenario 3: Medium Dynamic Order (2.5kg, 30x20x50) ---');
    await runCalculation(fromWilayaId, toWilayaId, 2.5, 30, 20, 50, 25000);

    // Scenario 4: Large Order (10 Items)
    // sum + 0.5 = 5.0kg
    // sum + 10 = 100cm height
    console.log('\n--- Scenario 4: Large Dynamic Order (5.0kg, 30x20x100) ---');
    await runCalculation(fromWilayaId, toWilayaId, 5.0, 30, 20, 100, 50000);
}

async function runCalculation(fromId, toId, weight, length, width, height, declaredValue) {
    try {
        // 1. Get Base Fees
        const feesData = await yalidineService.calculateFees(fromId, toId);
        // console.log('Base Fees Data:', JSON.stringify(feesData, null, 2));

        // 2. Calculate Weight Fees
        let billableWeight = weight || 1;
        let weightFees = 0;

        billableWeight = yalidineService.getBillableWeight(weight, length, width, height);
        weightFees = yalidineService.calculateWeightFees(billableWeight, feesData.oversize_fee);

        console.log(`Input: Weight=${weight}kg, Dim=${length}x${width}x${height}cm`);
        console.log(`Billable Weight: ${billableWeight.toFixed(2)}kg`);
        console.log(`Oversize Fee Rate: ${feesData.oversize_fee}`);
        console.log(`Calculated Weight Fee: ${weightFees}`);

        // 3. Calculate Final
        const firstCommune = Object.values(feesData.per_commune)[0];
        const homeDeliveryFee = (firstCommune.express_home || 0) + weightFees;

        console.log(`> FINAL HOME FEE: ${homeDeliveryFee} DA`);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testFees();
