// Environment configuration for Cloudflare Pages deployment
// This file centralizes environment variable handling

export const config = {
  // PocketBase URL - must be set via environment variables
  // For Cloudflare Pages, set this via environment variables in the Pages dashboard
  pocketbaseUrl: import.meta.env.VITE_PB_URL || '',
  // Client token used to authorize diminish-token API calls (provided via env)
  diminishClientToken: import.meta.env.VITE_DIMINISH_CLIENT_TOKEN || '',
  // Client token used to authorize deduct-token API calls (provided via env)
  deductClientToken: import.meta.env.VITE_DEDUCT_CLIENT_TOKEN || '',
  
  // App configuration
  app: {
    name: 'MIS Arcade',
    version: '1.0.0'
  },
  
  // Development mode detection
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  // Feature flags
  requireVerified: String(import.meta.env.VITE_REQUIRE_VERIFIED || '').toLowerCase() === 'true'
}

// Validate required environment variables
const requiredEnvVars = {
  VITE_PB_URL: import.meta.env.VITE_PB_URL,
  VITE_DIMINISH_CLIENT_TOKEN: import.meta.env.VITE_DIMINISH_CLIENT_TOKEN,
  VITE_DEDUCT_CLIENT_TOKEN: import.meta.env.VITE_DEDUCT_CLIENT_TOKEN
}

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingEnvVars.length > 0) {
  const errorMessage = `Missing required environment variables: ${missingEnvVars.join(', ')}`
  
  console.warn(errorMessage)
  console.warn('Running in guest mode - some features may be limited')
  console.warn('Please set these environment variables in your .env file or deployment configuration')
}
