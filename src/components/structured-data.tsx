/**
 * Structured Data Component for SEO
 * Adds JSON-LD schema markup for better Google indexing
 */

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Airport Watch Live',
    'alternateName': 'AirportWatch',
    'url': 'https://www.airportwatch.live',
    'description': 'Real-time airport and flight status tracking across the United States. Monitor live flight delays, cancellations, and airport conditions for 100+ US airports.',
    'applicationCategory': 'Travel',
    'operatingSystem': 'Web Browser',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'ratingCount': '1250'
    },
    'provider': {
      '@type': 'Organization',
      'name': 'Airport Watch Live',
      'url': 'https://www.airportwatch.live'
    },
    'featureList': [
      'Real-time flight tracking',
      'Airport status monitoring',
      'Flight delay alerts',
      'Interactive flight map',
      'Historical performance analytics',
      'Live flight data from OpenSky Network',
      'FAA airport status updates',
      'BTS historical data integration'
    ],
    'keywords': 'airport watch live, flight tracker, airport status, flight delays, real-time flights, aviation dashboard'
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

