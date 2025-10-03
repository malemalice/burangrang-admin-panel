# CORS Configuration for Multiple Frontend Domains

## Overview

The backend now supports multiple frontend domains through a flexible CORS configuration. This allows the same backend API to serve multiple frontend applications.

## Configuration

### Environment Variables

Set the `CORS_ORIGINS` environment variable with comma-separated domains:

```env
# Development
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:3001"

# Production
CORS_ORIGINS="https://admin.soulyousee.com,https://app.soulyousee.com,https://soulyousee.com"
```

### Default Configuration

If `CORS_ORIGINS` is not set, the following defaults are used:

- `http://localhost:3000` - webapp frontend
- `http://localhost:5173` - webv2 frontend  
- `http://localhost:3001` - additional frontend if needed

## Supported Frontend Applications

1. **webapp** (http://localhost:3000) - Main admin panel
2. **webv2** (http://localhost:5173) - New frontend application
3. **Additional frontends** - Any other frontend applications

## CORS Features

- ✅ **Multiple Origins**: Support for multiple frontend domains
- ✅ **Credentials**: Supports cookies and authentication headers
- ✅ **All HTTP Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- ✅ **Standard Headers**: Content-Type, Accept, Authorization, X-Requested-With
- ✅ **Environment-based**: Easy configuration via environment variables

## Testing CORS

To test if CORS is working correctly:

1. Start the backend server
2. Open browser dev tools on your frontend
3. Make an API request
4. Check the Network tab for CORS headers

Expected CORS headers:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Accept,Authorization,X-Requested-With
```

## Troubleshooting

### Common CORS Issues

1. **Origin not allowed**: Add your frontend URL to `CORS_ORIGINS`
2. **Credentials not working**: Ensure `credentials: true` is set in frontend requests
3. **Preflight requests failing**: Check that OPTIONS method is allowed

### Debug Steps

1. Check environment variable: `echo $CORS_ORIGINS`
2. Verify backend logs for CORS configuration
3. Test with curl: `curl -H "Origin: http://localhost:5173" -I http://localhost:3000/api/health`
4. Check browser network tab for CORS errors

## Security Notes

- Only add trusted domains to `CORS_ORIGINS`
- Use HTTPS in production
- Regularly review and update allowed origins
- Consider using subdomains for better security

## Example Frontend Configuration

```typescript
// Frontend API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Ensure credentials are included
fetch(`${API_BASE_URL}/products`, {
  method: 'GET',
  credentials: 'include', // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
});
```
