# ✈️ Airport Watch Live

A modern, real-time flight tracking and airport monitoring dashboard for tracking US airports and flight operations. Monitor live delays, cancellations, and airport conditions across 100+ US airports.

**Live Site:** [https://www.airportwatch.live](https://www.airportwatch.live)

Built with Next.js 14, TypeScript, and Tailwind CSS.

![Flight Tracker Dashboard](https://img.shields.io/badge/Next.js-14.1.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 🚀 Features

### Real-Time Monitoring
- **Live Flight Tracking**: Track flights in real-time across the United States
- **Airport Status**: Monitor operational status of 100+ major US airports
- **Delay & Cancellation Tracking**: Real-time updates on flight delays and cancellations
- **Interactive Map**: Visualize flights and airport status on an interactive map

### Analytics & Insights
- **Performance Metrics**: On-time performance, delay statistics, and cancellation rates
- **Historical Comparisons**: Compare current metrics with daily, monthly, and yearly trends
- **Traffic Analysis**: Monitor flight volume changes and patterns
- **Airport Rankings**: View top airports by traffic, delays, and performance

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Aviation-themed design with theme toggle
- **Real-Time Updates**: Auto-refresh with live data streaming
- **Advanced Filtering**: Filter by status, region, and search functionality

## 🛠️ Tech Stack

### Frontend
- **Next.js 14.1.0** - React framework with App Router
- **TypeScript 5.3.3** - Type-safe development
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **React Query** - Data fetching and caching
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization

### Backend & Database
- **Next.js API Routes** - RESTful API endpoints
- **Prisma ORM** - Type-safe database access
- **SQLite** - Lightweight relational database (development)
- **Zod** - Schema validation

### External APIs
- **FAA Airport Status API** - Real-time airport status
- **OpenSky Network API** - Live flight tracking
- **BTS Data** - Historical flight statistics

## 📦 Installation

### Prerequisites
- Node.js 18.17.0 or higher
- Docker (for production builds)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/ever-just/flight-tracker.git
cd flight-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# External APIs
FAA_API_URL="https://nasstatus.faa.gov/api/airport-status-information"
OPENSKY_API_URL="https://opensky-network.org/api"
OPENSKY_CLIENT_ID="your_opensky_username"
OPENSKY_CLIENT_SECRET="your_opensky_password"
AVIATIONSTACK_API_KEY="your_aviationstack_key"

# Application
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NODE_ENV="development"

# Cache settings (in seconds)
AIRPORT_STATUS_CACHE_TTL=300
FLIGHT_DATA_CACHE_TTL=60
HISTORICAL_DATA_CACHE_TTL=3600

# API Rate Limits
OPENSKY_DAILY_LIMIT=4000
AVIATIONSTACK_MONTHLY_LIMIT=100
```

4. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Initialize SQLite database
npx prisma db push
```

5. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🗂️ Project Structure

```
flight-tracker/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/                # API routes
│   │   ├── airports/           # Airports pages
│   │   ├── map/               # Map view page
│   │   └── page.tsx           # Dashboard home page
│   ├── components/            # React components
│   │   ├── ui/               # UI components (shadcn/ui)
│   │   ├── airport-card.tsx  # Airport status card
│   │   ├── flight-map.tsx    # Leaflet map component
│   │   └── trend-chart.tsx   # Recharts visualizations
│   ├── lib/                   # Utilities and helpers
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Utility functions
│   └── services/             # API service classes
│       ├── faa.service.ts    # FAA API integration
│       └── opensky.service.ts # OpenSky API integration
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
└── package.json             # Dependencies
```

## 📊 API Endpoints

### Dashboard
- `GET /api/dashboard/summary` - Dashboard overview data

### Airports
- `GET /api/airports` - List all airports with filtering
- `GET /api/airports/[code]` - Get specific airport details
- `GET /api/airports/[code]/trends` - Historical trends for an airport

### Flights
- `GET /api/flights/live` - Real-time flight positions
- `GET /api/flights/statistics` - Flight statistics

## 🎨 Design System

### Color Palette
- **Primary**: Deep Navy (#0A1929)
- **Accent**: Aviation Blue (#2196F3)
- **Secondary**: Sky Blue (#4FC3F7)
- **Success**: Emerald (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Headings**: Space Grotesk
- **Body**: Inter

## 🚀 Deployment

### Docker Hub + DigitalOcean App Platform

This project uses a Docker-based deployment for better reliability and consistency.

1. **Build Docker Image (locally)**
```bash
# Build for AMD64 (DigitalOcean compatible)
docker buildx build --platform linux/amd64 --push \
  -t yourusername/airportwatch:amd64 \
  -t yourusername/airportwatch:latest .
```

2. **Deploy to DigitalOcean**
   - Create a new App Platform app
   - Use Docker Hub as the source
   - Point to your Docker image
   - Configure environment variables
   - Deploy!

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 📈 Performance Optimization

- **Code Splitting**: Dynamic imports for optimal bundle size
- **Image Optimization**: Next.js Image component with lazy loading
- **Caching Strategy**: React Query with stale-while-revalidate
- **Database Indexing**: Optimized queries with proper indexes
- **API Rate Limiting**: Intelligent caching to respect API limits

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Check linting
npm run lint

# Type checking
npm run type-check
```

## 🔐 Security

- CORS configuration for API endpoints
- Environment variable management
- SQL injection prevention with Prisma
- XSS protection with React
- Rate limiting on API routes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues or questions, please open an issue on GitHub.

## 🙏 Acknowledgments

- FAA for providing airport status data
- OpenSky Network for flight tracking API
- Bureau of Transportation Statistics for historical data
- shadcn/ui for beautiful components
- Vercel for Next.js framework

---

**Live Site:** [www.airportwatch.live](https://www.airportwatch.live)

Built with ❤️ for aviation enthusiasts and travelers
