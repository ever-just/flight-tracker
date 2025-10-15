#!/usr/bin/env node

/**
 * Migration script to compress existing large flight history file
 * and prune old data to reduce file size
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

const DATA_DIR = path.join(process.cwd(), 'data');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archives');
const OLD_FILE = path.join(DATA_DIR, 'flight-history.json');
const NEW_FILE = path.join(DATA_DIR, 'flight-history-current.json');
const MAX_HISTORY_DAYS = 7;

async function migrateFlightHistory() {
  console.log('🚀 Starting flight history migration...');
  
  try {
    // Check if old file exists
    if (!fs.existsSync(OLD_FILE)) {
      console.log('✅ No flight-history.json file found. Nothing to migrate.');
      return;
    }
    
    // Get file size
    const stats = fs.statSync(OLD_FILE);
    const fileSizeMB = Math.round(stats.size / 1024 / 1024);
    console.log(`📊 Current file size: ${fileSizeMB}MB`);
    
    if (fileSizeMB < 10) {
      console.log('✅ File is already under 10MB. No migration needed.');
      return;
    }
    
    // Ensure archive directory exists
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
      console.log('📁 Created archives directory');
    }
    
    // Read the large file in chunks to avoid memory issues
    console.log('📖 Reading flight history data...');
    const rawData = fs.readFileSync(OLD_FILE, 'utf-8');
    const data = JSON.parse(rawData);
    
    // Archive the original file first (compressed)
    const timestamp = new Date().toISOString().split('T')[0];
    const archivePath = path.join(ARCHIVE_DIR, `flight-history-legacy-${timestamp}.json.gz`);
    
    console.log('🗜️ Compressing and archiving original file...');
    const gzip = zlib.createGzip();
    const source = fs.createReadStream(OLD_FILE);
    const destination = fs.createWriteStream(archivePath);
    
    await pipeline(source, gzip, destination);
    console.log(`✅ Archived to: ${archivePath}`);
    
    // Prune old data (keep only last 7 days)
    const cutoffTime = Date.now() - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
    let prunedFlightHistory = [];
    let originalCount = 0;
    let keptCount = 0;
    
    if (data.flightHistory && Array.isArray(data.flightHistory)) {
      originalCount = data.flightHistory.length;
      
      data.flightHistory.forEach(([callsign, snapshots]) => {
        const recentSnapshots = snapshots.filter(s => s.timestamp > cutoffTime);
        if (recentSnapshots.length > 0) {
          prunedFlightHistory.push([callsign, recentSnapshots]);
          keptCount++;
        }
      });
      
      console.log(`🔄 Pruned flight records: ${originalCount} → ${keptCount}`);
    }
    
    // Create new pruned data object
    const prunedData = {
      flightHistory: prunedFlightHistory,
      yesterdayStats: data.yesterdayStats || null,
      peakFlights: data.peakFlights || 0,
      peakTime: data.peakTime || new Date().toISOString(),
      currentDelays: data.currentDelays || 0,
      currentCancellations: data.currentCancellations || 0,
      timestamp: Date.now()
    };
    
    // Write pruned data to new file
    console.log('💾 Writing pruned data to new file...');
    fs.writeFileSync(NEW_FILE, JSON.stringify(prunedData, null, 2));
    
    // Get new file size
    const newStats = fs.statSync(NEW_FILE);
    const newFileSizeMB = Math.round(newStats.size / 1024 / 1024);
    console.log(`📊 New file size: ${newFileSizeMB}MB`);
    
    // Rename new file to original name
    fs.renameSync(NEW_FILE, OLD_FILE);
    console.log('✅ Migration complete! Flight history file has been optimized.');
    
    // Calculate space saved
    const spaceSavedMB = fileSizeMB - newFileSizeMB;
    const percentReduction = Math.round((spaceSavedMB / fileSizeMB) * 100);
    console.log(`💾 Space saved: ${spaceSavedMB}MB (${percentReduction}% reduction)`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateFlightHistory()
  .then(() => {
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  });
