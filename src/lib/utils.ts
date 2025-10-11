import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format number with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

// Get status color based on delay time
export function getStatusColor(avgDelay: number): string {
  if (avgDelay <= 0) return 'operational'
  if (avgDelay <= 15) return 'operational'
  if (avgDelay <= 30) return 'minor-delay'
  if (avgDelay <= 60) return 'major-delay'
  return 'closed'
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

// Format time for display
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Airport code to full name mapping (top 100 US airports)
export const airportNames: Record<string, string> = {
  ATL: "Hartsfield-Jackson Atlanta International",
  DFW: "Dallas/Fort Worth International",
  DEN: "Denver International",
  ORD: "Chicago O'Hare International",
  LAX: "Los Angeles International",
  CLT: "Charlotte Douglas International",
  MCO: "Orlando International",
  LAS: "Las Vegas Harry Reid International",
  PHX: "Phoenix Sky Harbor International",
  MIA: "Miami International",
  SEA: "Seattle-Tacoma International",
  EWR: "Newark Liberty International",
  SFO: "San Francisco International",
  IAH: "Houston George Bush Intercontinental",
  BOS: "Boston Logan International",
  MSP: "Minneapolis-St. Paul International",
  DTW: "Detroit Metropolitan Wayne County",
  FLL: "Fort Lauderdale-Hollywood International",
  JFK: "John F. Kennedy International",
  LGA: "LaGuardia",
  BWI: "Baltimore/Washington International",
  DCA: "Ronald Reagan Washington National",
  MDW: "Chicago Midway International",
  SLC: "Salt Lake City International",
  SAN: "San Diego International",
  TPA: "Tampa International",
  PDX: "Portland International",
  IAD: "Washington Dulles International",
  STL: "St. Louis Lambert International",
  HNL: "Daniel K. Inouye International",
  AUS: "Austin-Bergstrom International",
  BNA: "Nashville International",
  DAL: "Dallas Love Field",
  HOU: "Houston William P. Hobby",
  OAK: "Oakland International",
  MSY: "Louis Armstrong New Orleans International",
  RDU: "Raleigh-Durham International",
  SJC: "San Jose International",
  SMF: "Sacramento International",
  SAT: "San Antonio International",
  RSW: "Southwest Florida International",
  PHL: "Philadelphia International",
  CLE: "Cleveland Hopkins International",
  PIT: "Pittsburgh International",
  IND: "Indianapolis International",
  CMH: "John Glenn Columbus International",
  CVG: "Cincinnati/Northern Kentucky International",
  MKE: "Milwaukee Mitchell International",
  MCI: "Kansas City International",
  JAX: "Jacksonville International",
  BDL: "Bradley International",
  BUF: "Buffalo Niagara International",
  ABQ: "Albuquerque International Sunport",
  OMA: "Omaha Eppley Airfield",
  RIC: "Richmond International",
  BHM: "Birmingham-Shuttlesworth International",
  SDF: "Louisville Muhammad Ali International",
  PBI: "Palm Beach International",
  ONT: "Ontario International",
  BUR: "Hollywood Burbank",
  ANC: "Ted Stevens Anchorage International",
  SNA: "John Wayne Orange County",
  ELP: "El Paso International",
  TUL: "Tulsa International",
  OKC: "Will Rogers World",
  PVD: "Rhode Island T.F. Green International",
  CHS: "Charleston International",
  RNO: "Reno-Tahoe International",
  MEM: "Memphis International",
  GEG: "Spokane International",
  BOI: "Boise Airport",
  TUS: "Tucson International",
  SYR: "Syracuse Hancock International",
  DSM: "Des Moines International",
  ROC: "Greater Rochester International",
  ORF: "Norfolk International",
  GRR: "Gerald R. Ford International",
  SAV: "Savannah/Hilton Head International",
  DAY: "Dayton International",
  ICT: "Wichita Dwight D. Eisenhower National",
  LIT: "Bill and Hillary Clinton National",
  GSO: "Piedmont Triad International",
  GSP: "Greenville-Spartanburg International",
  PWM: "Portland International Jetport",
  XNA: "Northwest Arkansas National",
  MSN: "Dane County Regional",
  ALB: "Albany International",
  TYS: "McGhee Tyson",
  FAT: "Fresno Yosemite International",
  PNS: "Pensacola International",
  COS: "Colorado Springs",
  FNT: "Bishop International",
  RST: "Rochester International",
  FAR: "Hector International",
  LBB: "Lubbock Preston Smith International",
  MAF: "Midland International Air and Space Port",
  CRP: "Corpus Christi International",
  GRB: "Green Bay Austin Straubel International",
  SBN: "South Bend International",
  BTV: "Burlington International",
}

// Get coordinates for major airports (for map display)
export const airportCoordinates: Record<string, [number, number]> = {
  ATL: [33.6407, -84.4277],
  DFW: [32.8998, -97.0403],
  DEN: [39.8561, -104.6737],
  ORD: [41.9742, -87.9073],
  LAX: [33.9425, -118.4081],
  CLT: [35.2144, -80.9473],
  MCO: [28.4312, -81.3081],
  LAS: [36.0840, -115.1537],
  PHX: [33.4343, -112.0117],
  MIA: [25.7959, -80.2871],
  SEA: [47.4502, -122.3088],
  EWR: [40.6895, -74.1745],
  SFO: [37.6213, -122.3790],
  IAH: [29.9902, -95.3368],
  BOS: [42.3656, -71.0096],
  MSP: [44.8848, -93.2223],
  DTW: [42.2162, -83.3554],
  FLL: [26.0742, -80.1506],
  JFK: [40.6413, -73.7781],
  LGA: [40.7769, -73.8740],
  // Add more as needed
}
