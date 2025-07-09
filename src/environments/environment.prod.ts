export const environment = {
  production: true,
  medusaBackendUrl: process.env['MEDUSA_BACKEND_URL'] || 'http://localhost:9000',
  medusaPublishableKey: process.env['MEDUSA_PUBLISHABLE_KEY'] || 'pk_test_your_publishable_key_here'
}; 