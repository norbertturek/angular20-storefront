# Authentication Setup

This document explains how authentication is configured in the Angular storefront and how to resolve common issues.

## Environment Variables

The following environment variables are supported for authentication configuration:

### Supported Variables

1. **MEDUSA_BACKEND_URL** (optional, defaults to http://localhost:9000)
   - The URL of your Medusa backend server
   - Alternative: `NEXT_PUBLIC_MEDUSA_BACKEND_URL`

2. **MEDUSA_PUBLISHABLE_API_KEY** (required)
   - Your Medusa publishable API key
   - This key is required for all authentication operations
   - You can find this in your Medusa admin dashboard under Settings > API Keys
   - Alternative: `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

### Fallback Values

If environment variables are not set, the application will use these fallback values:
- **Backend URL**: `http://localhost:9000`
- **Publishable Key**: `pk_387cefe6a8168838292c26e8c037dba126d25f690ea317000b3745b6060a8747`

⚠️ **Note**: The fallback publishable key is for development only. For production, always set the proper environment variables.

### Setting Environment Variables

#### Development
Create a `.env` file in the root of the storefront directory:

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your values
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_PUBLISHABLE_API_KEY=pk_your_actual_publishable_key_here
```

#### Production
Set the environment variables in your deployment platform:

```bash
export MEDUSA_BACKEND_URL=https://your-backend-url.com
export MEDUSA_PUBLISHABLE_API_KEY=pk_your_actual_publishable_key_here
```

## Authentication Flow

### Registration
1. User fills out registration form
2. Frontend sends data to `/api/auth/register` endpoint
3. Server creates customer account using Medusa SDK
4. Server logs in the customer and returns token
5. Frontend stores customer data and token

### Login
1. User fills out login form
2. Frontend sends credentials to `/api/auth/login` endpoint
3. Server authenticates using Medusa SDK
4. Server returns customer data and token
5. Frontend stores customer data and token

## Common Issues

### "Publishable API key required" Error

This error occurs when the publishable API key is not properly configured. To fix:

1. Ensure `MEDUSA_PUBLISHABLE_API_KEY` is set in your environment
2. Verify the key is valid in your Medusa admin dashboard
3. Check that the key is being passed correctly in the `x-publishable-api-key` header
4. For development, the fallback key should work if your backend is configured to accept it

### "Proxy error (SDK)" Error

This error occurs when there's an issue with the Medusa SDK configuration. To fix:

1. Verify `MEDUSA_BACKEND_URL` is correct and accessible
2. Ensure the backend server is running
3. Check that CORS is properly configured on the backend

## Testing Authentication

1. Start the development server: `npm start`
2. Check the console output for environment variable status
3. Navigate to `/register` to test registration
4. Navigate to `/login` to test login
5. Check the browser console and server logs for any errors

## Security Notes

- The publishable API key is safe to use in the frontend
- Authentication tokens are stored in memory (signals) and not persisted
- For production, consider implementing proper token storage and refresh mechanisms
- Never commit real publishable keys to version control 