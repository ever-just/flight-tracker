// Quick test to verify OpenSky API works
const axios = require('axios');

async function testOpenSky() {
  try {
    console.log('Testing OpenSky API...');
    const url = 'https://opensky-network.org/api/states/all?lamin=24.396308&lomin=-125.000000&lamax=49.384358&lomax=-66.934570';
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.data && response.data.states) {
      console.log(`✅ SUCCESS! Found ${response.data.states.length} flights over USA`);
      console.log('Sample flights:');
      response.data.states.slice(0, 5).forEach(state => {
        const callsign = state[1] ? state[1].trim() : 'N/A';
        const altitude = state[7] ? Math.round(state[7] * 3.28084) : 0;
        console.log(`  - ${callsign}: Alt ${altitude}ft`);
      });
    } else {
      console.log('❌ No flight data in response');
    }
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

testOpenSky();
