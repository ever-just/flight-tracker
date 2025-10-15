/**
 * Application Version Configuration
 * 
 * UPDATE THIS WITH EVERY COMMIT:
 * - Increment patch version (x.x.X) for bug fixes and minor changes
 * - Increment minor version (x.X.0) for new features
 * - Increment major version (X.0.0) for breaking changes
 * 
 * Last updated: 2025-10-14
 */

export const VERSION = {
  major: 1,
  minor: 0,
  patch: 3,
  full: '1.0.3',
  buildDate: '2025-10-14',
  environment: process.env.NODE_ENV || 'development'
} as const

export const getVersionString = () => {
  return `v${VERSION.full} (${VERSION.buildDate})`
}

export const getFullVersionInfo = () => {
  return {
    version: VERSION.full,
    buildDate: VERSION.buildDate,
    environment: VERSION.environment
  }
}

