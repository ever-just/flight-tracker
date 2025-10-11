// Test script to verify real-time data updates
// Using native fetch (available in Node.js 18+)

const API_URL = 'http://localhost:3000/api/dashboard/summary?period=today';
let previousData = null;

async function fetchData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    if (previousData) {
      const flightChange = data.summary.totalFlights - previousData.summary.totalFlights;
      const delayChange = data.summary.totalDelays - previousData.summary.totalDelays;
      
      console.log(`\n[${new Date().toLocaleTimeString()}] Data Update:`);
      console.log(`  Flights: ${previousData.summary.totalFlights} → ${data.summary.totalFlights} (${flightChange >= 0 ? '+' : ''}${flightChange})`);
      console.log(`  Delays: ${previousData.summary.totalDelays} → ${data.summary.totalDelays} (${delayChange >= 0 ? '+' : ''}${delayChange})`);
      console.log(`  On-Time: ${previousData.summary.onTimePercentage}% → ${data.summary.onTimePercentage}%`);
      console.log(`  Cancellations: ${previousData.summary.totalCancellations} → ${data.summary.totalCancellations}`);
    } else {
      console.log(`\n[${new Date().toLocaleTimeString()}] Initial Data:`);
      console.log(`  Flights: ${data.summary.totalFlights}`);
      console.log(`  Delays: ${data.summary.totalDelays}`);
      console.log(`  On-Time: ${data.summary.onTimePercentage}%`);
      console.log(`  Cancellations: ${data.summary.totalCancellations}`);
    }
    
    previousData = data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

console.log('Testing real-time dashboard updates...');
console.log('Fetching data every 5 seconds (matching dashboard refresh rate)');
console.log('Press Ctrl+C to stop\n');

// Initial fetch
fetchData();

// Fetch every 5 seconds to match dashboard update frequency
setInterval(fetchData, 5000);
