// Quick test script to verify AngelOne credentials and market connection
import { AngelOneService } from '../src/server/angel-one-service.js';

async function testAngelOneCredentials() {
    console.log('🔍 Testing AngelOne API Credentials...\n');
    
    const angelService = new AngelOneService();
    
    try {
        // Test basic connection
        console.log('1. Testing AngelOne API connection...');
        const testResult = await angelService.getStockLtp('RELIANCE');
        
        if (testResult) {
            console.log(`✅ SUCCESS: Got price for RELIANCE: ₹${testResult.price}`);
            console.log(`   Change: ${testResult.changePercent >= 0 ? '+' : ''}${testResult.changePercent.toFixed(2)}%`);
        } else {
            console.log('❌ FAILED: Could not get price data from AngelOne');
        }
        
        // Test market hours
        console.log('\n2. Testing market status...');
        const isOpen = angelService.isNSEMarketOpen ? angelService.isNSEMarketOpen() : false;
        console.log(`📅 NSE Market Status: ${isOpen ? 'OPEN' : 'CLOSED'}`);
        
        // Test credentials
        console.log('\n3. Checking credentials...');
        console.log(`API Key: ${process.env.ANGEL_API_KEY ? '✅ Present' : '❌ Missing'}`);
        console.log(`Client Code: ${process.env.ANGEL_CLIENT_CODE ? '✅ Present' : '❌ Missing'}`);
        console.log(`Password: ${process.env.ANGEL_PASSWORD ? '✅ Present' : '❌ Missing'}`);
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testAngelOneCredentials();