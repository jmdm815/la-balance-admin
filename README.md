# Admin App CORS Fix

This version is focused on reliable order submission from the customer site.

## Includes
- Upstash Redis persistence
- explicit OPTIONS handler for CORS
- GET/POST/PATCH routes with Access-Control-Allow-Origin headers

## Required environment variables
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- ALLOWED_ORIGIN=https://your-customer-app.vercel.app
