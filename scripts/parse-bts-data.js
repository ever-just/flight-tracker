#!/usr/bin/env node

/**
 * BTS Data Parser - Extracts real flight statistics from BTS CSV
 * Generates lightweight JSON cache for dashboard
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_PATH = path.join(__dirname, '../data/On_Time_Marketing_Carrier_On_Time_Performance_(Beginning_January_2018)_2025_6.csv');
const OUTPUT_PATH = path.join(__dirname, '../public/data/bts-summary.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🚀 Starting BTS data parsing...');
console.log(`📂 Reading from: ${CSV_PATH}`);
console.log(`💾 Output to: ${OUTPUT_PATH}\n`);

// Data structures
const airportStats = new Map(); // Airport-level aggregations
const monthlyStats = new Map();  // Monthly aggregations
const quarterlyStats = new Map(); // Quarterly aggregations
const yearlyStats = new Map();    // Yearly aggregations

let totalRows = 0;
let processedRows = 0;
let headers = [];

async function parseCSV() {
  const fileStream = fs.createReadStream(CSV_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    totalRows++;
    
    if (totalRows === 1) {
      // Parse headers
      headers = line.split(',').map(h => h.replace(/"/g, '').trim());
      console.log(`📋 Found ${headers.length} columns`);
      continue;
    }

    // Simple CSV parsing (handles quoted fields)
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });

    // Extract key fields
    const year = parseInt(row.Year);
    const month = parseInt(row.Month);
    const quarter = parseInt(row.Quarter);
    const origin = row.Origin;
    const dest = row.Dest;
    const depDelay = parseFloat(row.DepDelayMinutes) || 0;
    const arrDelay = parseFloat(row.ArrDelayMinutes) || 0;
    const cancelled = parseFloat(row.Cancelled) || 0;
    const distance = parseFloat(row.Distance) || 0;

    // Skip invalid rows
    if (!origin || !dest || !year) continue;

    processedRows++;

    // Aggregate by origin airport
    updateAirportStats(origin, {
      year, month, quarter, depDelay, arrDelay, cancelled, distance, isOrigin: true
    });

    // Aggregate by destination airport
    updateAirportStats(dest, {
      year, month, quarter, depDelay, arrDelay, cancelled, distance, isOrigin: false
    });

    // Aggregate by month
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    updateTimeStats(monthlyStats, monthKey, { depDelay, arrDelay, cancelled, distance });

    // Aggregate by quarter
    const quarterKey = `${year}-Q${quarter}`;
    updateTimeStats(quarterlyStats, quarterKey, { depDelay, arrDelay, cancelled, distance });

    // Aggregate by year
    updateTimeStats(yearlyStats, String(year), { depDelay, arrDelay, cancelled, distance });

    // Progress indicator
    if (processedRows % 50000 === 0) {
      console.log(`⏳ Processed ${processedRows.toLocaleString()} flights...`);
    }
  }

  console.log(`\n✅ Parsing complete!`);
  console.log(`📊 Total rows: ${totalRows.toLocaleString()}`);
  console.log(`✈️  Valid flights: ${processedRows.toLocaleString()}`);
  console.log(`🛫 Airports tracked: ${airportStats.size}`);
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

function updateAirportStats(code, data) {
  if (!airportStats.has(code)) {
    airportStats.set(code, {
      code,
      totalFlights: 0,
      departures: 0,
      arrivals: 0,
      totalDepDelay: 0,
      totalArrDelay: 0,
      totalCancelled: 0,
      totalDistance: 0,
      monthlyData: new Map(),
      yearlyData: new Map()
    });
  }

  const stats = airportStats.get(code);
  stats.totalFlights++;
  
  if (data.isOrigin) stats.departures++;
  else stats.arrivals++;
  
  stats.totalDepDelay += data.depDelay;
  stats.totalArrDelay += data.arrDelay;
  stats.totalCancelled += data.cancelled;
  stats.totalDistance += data.distance;

  // Track monthly stats
  const monthKey = `${data.year}-${String(data.month).padStart(2, '0')}`;
  if (!stats.monthlyData.has(monthKey)) {
    stats.monthlyData.set(monthKey, { flights: 0, delays: 0, cancelled: 0 });
  }
  const monthData = stats.monthlyData.get(monthKey);
  monthData.flights++;
  monthData.delays += (data.depDelay + data.arrDelay) / 2;
  monthData.cancelled += data.cancelled;

  // Track yearly stats
  if (!stats.yearlyData.has(data.year)) {
    stats.yearlyData.set(data.year, { flights: 0, delays: 0, cancelled: 0 });
  }
  const yearData = stats.yearlyData.get(data.year);
  yearData.flights++;
  yearData.delays += (data.depDelay + data.arrDelay) / 2;
  yearData.cancelled += data.cancelled;
}

function updateTimeStats(map, key, data) {
  if (!map.has(key)) {
    map.set(key, {
      totalFlights: 0,
      totalDepDelay: 0,
      totalArrDelay: 0,
      totalCancelled: 0,
      totalDistance: 0
    });
  }

  const stats = map.get(key);
  stats.totalFlights++;
  stats.totalDepDelay += data.depDelay;
  stats.totalArrDelay += data.arrDelay;
  stats.totalCancelled += data.cancelled;
  stats.totalDistance += data.distance;
}

function generateSummary() {
  console.log('\n📈 Generating summary statistics...');

  // Convert airport stats to summary format
  const airports = Array.from(airportStats.values()).map(stats => {
    const avgDepDelay = stats.totalFlights > 0 ? stats.totalDepDelay / stats.totalFlights : 0;
    const avgArrDelay = stats.totalFlights > 0 ? stats.totalArrDelay / stats.totalFlights : 0;
    const cancellationRate = stats.totalFlights > 0 ? (stats.totalCancelled / stats.totalFlights) * 100 : 0;
    const onTimeRate = 100 - Math.min(100, (avgDepDelay > 15 ? 100 : (avgDepDelay / 15) * 100));

    // Convert monthly map to array
    const monthlyArray = Array.from(stats.monthlyData.entries()).map(([month, data]) => ({
      month,
      ...data,
      avgDelay: data.flights > 0 ? data.delays / data.flights : 0
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Convert yearly map to array
    const yearlyArray = Array.from(stats.yearlyData.entries()).map(([year, data]) => ({
      year,
      ...data,
      avgDelay: data.flights > 0 ? data.delays / data.flights : 0
    })).sort((a, b) => a.year - b.year);

    return {
      code: stats.code,
      totalFlights: stats.totalFlights,
      departures: stats.departures,
      arrivals: stats.arrivals,
      avgDepartureDelay: Math.round(avgDepDelay * 10) / 10,
      avgArrivalDelay: Math.round(avgArrDelay * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      avgDistance: Math.round(stats.totalDistance / stats.totalFlights),
      monthly: monthlyArray.slice(-12), // Last 12 months
      yearly: yearlyArray
    };
  });

  // Sort by total flights
  airports.sort((a, b) => b.totalFlights - a.totalFlights);

  // Convert time-based stats
  const monthly = Array.from(monthlyStats.entries()).map(([month, stats]) => ({
    month,
    totalFlights: stats.totalFlights,
    avgDepDelay: stats.totalFlights > 0 ? Math.round(stats.totalDepDelay / stats.totalFlights * 10) / 10 : 0,
    avgArrDelay: stats.totalFlights > 0 ? Math.round(stats.totalArrDelay / stats.totalFlights * 10) / 10 : 0,
    cancellationRate: stats.totalFlights > 0 ? Math.round((stats.totalCancelled / stats.totalFlights) * 1000) / 10 : 0
  })).sort((a, b) => a.month.localeCompare(b.month));

  const quarterly = Array.from(quarterlyStats.entries()).map(([quarter, stats]) => ({
    quarter,
    totalFlights: stats.totalFlights,
    avgDepDelay: stats.totalFlights > 0 ? Math.round(stats.totalDepDelay / stats.totalFlights * 10) / 10 : 0,
    avgArrDelay: stats.totalFlights > 0 ? Math.round(stats.totalArrDelay / stats.totalFlights * 10) / 10 : 0,
    cancellationRate: stats.totalFlights > 0 ? Math.round((stats.totalCancelled / stats.totalFlights) * 1000) / 10 : 0
  })).sort((a, b) => a.quarter.localeCompare(b.quarter));

  const yearly = Array.from(yearlyStats.entries()).map(([year, stats]) => ({
    year,
    totalFlights: stats.totalFlights,
    avgDepDelay: stats.totalFlights > 0 ? Math.round(stats.totalDepDelay / stats.totalFlights * 10) / 10 : 0,
    avgArrDelay: stats.totalFlights > 0 ? Math.round(stats.totalArrDelay / stats.totalFlights * 10) / 10 : 0,
    cancellationRate: stats.totalFlights > 0 ? Math.round((stats.totalCancelled / stats.totalFlights) * 1000) / 10 : 0
  })).sort((a, b) => a.year.localeCompare(b.year));

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'Bureau of Transportation Statistics (BTS)',
      dataRange: {
        start: monthly[0]?.month || '',
        end: monthly[monthly.length - 1]?.month || ''
      },
      totalFlights: processedRows,
      totalAirports: airports.length
    },
    airports: airports.slice(0, 200), // Top 200 airports
    trends: {
      monthly: monthly.slice(-36), // Last 36 months
      quarterly: quarterly.slice(-12), // Last 12 quarters
      yearly: yearly
    }
  };
}

// Main execution
(async () => {
  try {
    await parseCSV();
    const summary = generateSummary();
    
    console.log('\n💾 Writing summary to JSON...');
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2));
    
    console.log(`\n🎉 SUCCESS! Generated ${(fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2)} MB JSON cache`);
    console.log(`\n📊 Summary Statistics:`);
    console.log(`   • Top airport: ${summary.airports[0].code} (${summary.airports[0].totalFlights.toLocaleString()} flights)`);
    console.log(`   • Avg on-time rate: ${(summary.airports.reduce((sum, a) => sum + a.onTimeRate, 0) / summary.airports.length).toFixed(1)}%`);
    console.log(`   • Avg cancellation rate: ${(summary.airports.reduce((sum, a) => sum + a.cancellationRate, 0) / summary.airports.length).toFixed(2)}%`);
    console.log(`   • Time range: ${summary.metadata.dataRange.start} to ${summary.metadata.dataRange.end}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

