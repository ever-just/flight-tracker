#!/usr/bin/env node

/**
 * Service Layer Analysis Script
 * Analyzes all service files for mock vs real data usage
 * Identifies fallback mechanisms and data transformation logic
 */

const fs = require('fs');
const path = require('path');

// Service files to analyze
const SERVICES_DIR = path.join(__dirname, '..', 'src', 'services');
const SERVICE_FILES = [
  'real-data-aggregator.ts',
  'realtime-flight-tracker.ts',
  'real-dashboard.service.ts',
  'real-opensky.service.ts',
  'bts-data.service.ts',
  'faa.service.ts',
  'aviationstack.service.ts',
  'weather.service.ts',
  'opensky.service.ts'
];

// Mock data patterns to search for
const MOCK_PATTERNS = [
  /getMock\w+/g,
  /generateMock\w+/g,
  /mockData/gi,
  /fakeData/gi,
  /sampleData/gi,
  /testData/gi,
  /Math\.random\(\)\s*\*/g,  // Random data generation
  /return\s+\[[\s\S]*?\{[\s\S]*?(?:flight|airport|delay)/gi,  // Hardcoded arrays
  /fallback.*mock/gi,
  /demo\s*(?:data|mode)/gi
];

// Real data source patterns
const REAL_DATA_PATTERNS = [
  /fetch\(/g,
  /axios/g,
  /http\.get/g,
  /https\.get/g,
  /real.*api/gi,
  /opensky.*api/gi,
  /faa.*api/gi,
  /aviationstack/gi,
  /bts.*data/gi
];

// Cache patterns
const CACHE_PATTERNS = [
  /cache\.get/gi,
  /cache\.set/gi,
  /cacheTTL/gi,
  /cache.*expire/gi,
  /ttl/gi
];

// Analysis results
const analysisResults = {
  timestamp: new Date().toISOString(),
  services: {},
  summary: {
    totalServices: 0,
    withMockData: 0,
    withRealData: 0,
    withCaching: 0,
    mockFunctions: [],
    criticalIssues: []
  }
};

function analyzeFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`Analyzing ${fileName}...`);
  
  const result = {
    fileName,
    exists: false,
    mockDataUsage: {
      found: false,
      patterns: [],
      lines: []
    },
    realDataSources: {
      found: false,
      apis: [],
      lines: []
    },
    caching: {
      found: false,
      ttlValues: [],
      lines: []
    },
    fallbackMechanisms: [],
    dataTransformations: [],
    errorHandling: [],
    environmentVariables: []
  };
  
  try {
    if (!fs.existsSync(filePath)) {
      result.error = 'File not found';
      return result;
    }
    
    result.exists = true;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Analyze each line
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for mock data patterns
      MOCK_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          result.mockDataUsage.found = true;
          const match = line.match(pattern);
          if (match) {
            result.mockDataUsage.patterns.push(match[0]);
            result.mockDataUsage.lines.push({
              lineNum,
              content: line.trim(),
              pattern: match[0]
            });
          }
          pattern.lastIndex = 0; // Reset regex
        }
      });
      
      // Check for real data sources
      REAL_DATA_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          result.realDataSources.found = true;
          const match = line.match(pattern);
          if (match) {
            result.realDataSources.apis.push(match[0]);
            result.realDataSources.lines.push({
              lineNum,
              content: line.trim()
            });
          }
          pattern.lastIndex = 0;
        }
      });
      
      // Check for caching
      CACHE_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          result.caching.found = true;
          result.caching.lines.push({
            lineNum,
            content: line.trim()
          });
          
          // Extract TTL values
          const ttlMatch = line.match(/ttl[:\s]*(\d+)/i);
          if (ttlMatch) {
            result.caching.ttlValues.push(parseInt(ttlMatch[1]));
          }
          pattern.lastIndex = 0;
        }
      });
      
      // Check for environment variables
      const envMatch = line.match(/process\.env\.(\w+)/g);
      if (envMatch) {
        envMatch.forEach(env => {
          const varName = env.replace('process.env.', '');
          if (!result.environmentVariables.includes(varName)) {
            result.environmentVariables.push(varName);
          }
        });
      }
      
      // Check for error handling
      if (/catch\s*\(|\.catch\(|try\s*\{/.test(line)) {
        result.errorHandling.push({
          lineNum,
          type: line.includes('catch') ? 'catch' : 'try'
        });
      }
      
      // Check for fallback mechanisms
      if (/fallback|backup|alternative|default.*data/i.test(line)) {
        result.fallbackMechanisms.push({
          lineNum,
          content: line.trim()
        });
      }
      
      // Check for data transformations
      if (/map\(|reduce\(|filter\(|transform|convert|parse/i.test(line)) {
        result.dataTransformations.push({
          lineNum,
          type: line.match(/map|reduce|filter|transform|convert|parse/i)?.[0]
        });
      }
    });
    
    // Analyze imports
    const imports = content.match(/import.*from\s+['"].*['"]/g) || [];
    result.imports = imports.map(imp => {
      const match = imp.match(/from\s+['"](.+)['"]/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    // Check if service exports real or mock data functions
    const exports = content.match(/export\s+(const|function|class)\s+(\w+)/g) || [];
    result.exports = exports.map(exp => {
      const match = exp.match(/export\s+(?:const|function|class)\s+(\w+)/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    // Determine primary data source
    if (result.mockDataUsage.found && !result.realDataSources.found) {
      result.primaryDataSource = 'MOCK_ONLY';
      analysisResults.summary.criticalIssues.push(`${fileName}: Uses only mock data`);
    } else if (result.realDataSources.found && !result.mockDataUsage.found) {
      result.primaryDataSource = 'REAL_ONLY';
    } else if (result.realDataSources.found && result.mockDataUsage.found) {
      result.primaryDataSource = 'HYBRID';
      
      // Check if mock is only for fallback
      const hasFallback = result.fallbackMechanisms.length > 0 || 
                         result.errorHandling.length > 0;
      if (hasFallback) {
        result.primaryDataSource = 'REAL_WITH_FALLBACK';
      }
    } else {
      result.primaryDataSource = 'UNKNOWN';
    }
    
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

// Main analysis
async function runAnalysis() {
  console.log('='.repeat(60));
  console.log('SERVICE LAYER ANALYSIS');
  console.log('='.repeat(60));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');
  
  // Analyze each service file
  for (const fileName of SERVICE_FILES) {
    const filePath = path.join(SERVICES_DIR, fileName);
    const result = analyzeFile(filePath);
    
    analysisResults.services[fileName] = result;
    analysisResults.summary.totalServices++;
    
    if (result.mockDataUsage.found) {
      analysisResults.summary.withMockData++;
      result.mockDataUsage.patterns.forEach(pattern => {
        if (!analysisResults.summary.mockFunctions.includes(pattern)) {
          analysisResults.summary.mockFunctions.push(pattern);
        }
      });
    }
    
    if (result.realDataSources.found) {
      analysisResults.summary.withRealData++;
    }
    
    if (result.caching.found) {
      analysisResults.summary.withCaching++;
    }
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Services Analyzed: ${analysisResults.summary.totalServices}`);
  console.log(`Services with Mock Data: ${analysisResults.summary.withMockData}`);
  console.log(`Services with Real Data: ${analysisResults.summary.withRealData}`);
  console.log(`Services with Caching: ${analysisResults.summary.withCaching}`);
  
  console.log('\nData Source Breakdown:');
  Object.entries(analysisResults.services).forEach(([fileName, result]) => {
    if (result.exists) {
      const mockLines = result.mockDataUsage.lines.length;
      const realLines = result.realDataSources.lines.length;
      console.log(`  ${fileName}:`);
      console.log(`    Primary Source: ${result.primaryDataSource}`);
      console.log(`    Mock Data Lines: ${mockLines}`);
      console.log(`    Real Data Lines: ${realLines}`);
      console.log(`    Has Caching: ${result.caching.found ? 'Yes' : 'No'}`);
      console.log(`    Error Handlers: ${result.errorHandling.length}`);
    }
  });
  
  if (analysisResults.summary.mockFunctions.length > 0) {
    console.log('\nMock Functions Found:');
    analysisResults.summary.mockFunctions.forEach(func => {
      console.log(`  - ${func}`);
    });
  }
  
  if (analysisResults.summary.criticalIssues.length > 0) {
    console.log('\n⚠️  CRITICAL ISSUES:');
    analysisResults.summary.criticalIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }
  
  // Environment variables summary
  console.log('\nEnvironment Variables Used:');
  const allEnvVars = new Set();
  Object.values(analysisResults.services).forEach(service => {
    if (service.environmentVariables) {
      service.environmentVariables.forEach(env => allEnvVars.add(env));
    }
  });
  Array.from(allEnvVars).sort().forEach(env => {
    console.log(`  - ${env}`);
  });
  
  // Save detailed results
  const reportPath = path.join(__dirname, '..', 'reports', 'service-analysis-results.json');
  const reportsDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(analysisResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  
  // Create markdown report
  const markdownReport = generateMarkdownReport(analysisResults);
  const mdPath = path.join(reportsDir, 'service-analysis-report.md');
  fs.writeFileSync(mdPath, markdownReport);
  console.log(`📝 Markdown report saved to: ${mdPath}`);
}

function generateMarkdownReport(results) {
  let report = `# Service Layer Analysis Report\n`;
  report += `Generated: ${results.timestamp}\n\n`;
  
  report += `## Summary\n`;
  report += `- **Total Services:** ${results.summary.totalServices}\n`;
  report += `- **With Mock Data:** ${results.summary.withMockData}\n`;
  report += `- **With Real Data:** ${results.summary.withRealData}\n`;
  report += `- **With Caching:** ${results.summary.withCaching}\n\n`;
  
  report += `## Service Details\n\n`;
  
  Object.entries(results.services).forEach(([fileName, service]) => {
    if (!service.exists) return;
    
    report += `### ${fileName}\n`;
    report += `**Primary Data Source:** ${service.primaryDataSource}\n\n`;
    
    if (service.mockDataUsage.found) {
      report += `#### Mock Data Usage\n`;
      service.mockDataUsage.lines.forEach(line => {
        report += `- Line ${line.lineNum}: \`${line.pattern}\`\n`;
      });
      report += `\n`;
    }
    
    if (service.realDataSources.found) {
      report += `#### Real Data Sources\n`;
      const uniqueAPIs = [...new Set(service.realDataSources.apis)];
      uniqueAPIs.forEach(api => {
        report += `- ${api}\n`;
      });
      report += `\n`;
    }
    
    if (service.caching.found) {
      report += `#### Caching\n`;
      if (service.caching.ttlValues.length > 0) {
        report += `TTL Values: ${service.caching.ttlValues.join(', ')} seconds\n`;
      }
      report += `\n`;
    }
    
    if (service.environmentVariables.length > 0) {
      report += `#### Environment Variables\n`;
      service.environmentVariables.forEach(env => {
        report += `- ${env}\n`;
      });
      report += `\n`;
    }
  });
  
  if (results.summary.criticalIssues.length > 0) {
    report += `## ⚠️ Critical Issues\n\n`;
    results.summary.criticalIssues.forEach(issue => {
      report += `- ${issue}\n`;
    });
  }
  
  return report;
}

// Run the analysis
runAnalysis().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
