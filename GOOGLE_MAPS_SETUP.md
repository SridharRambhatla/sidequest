# Google Maps API Setup Guide

This guide will help you fix the Google Maps API errors and configure it properly for the Sidequest application.

## Understanding the Error

The error `ApiProjectMapError` means:
- Your API key is not properly configured in Google Cloud Console
- The Maps JavaScript API is not enabled for your project
- API key restrictions are blocking requests
- Billing is not enabled on your Google Cloud project

## Step-by-Step Setup

### 1. Create/Access Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Note your Project ID (you'll need this)

### 2. Enable Required APIs

Enable these APIs in your project:

1. Go to **APIs & Services** > **Library**
2. Search and enable the following:
   - **Maps JavaScript API** (Required)
   - **Places API** (Required for place photos)
   - **Geocoding API** (Optional, for address lookup)
   - **Directions API** (Optional, for route planning)

Direct links:
- [Enable Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
- [Enable Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)

### 3. Enable Billing

Google Maps requires billing to be enabled (even for free tier):

1. Go to **Billing** in Cloud Console
2. Link a billing account or create a new one
3. Add payment method (credit/debit card)

**Note**: Google provides $200 free credit per month for Maps Platform. Most development usage stays within free tier.

### 4. Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key
4. Click **Edit API Key** to configure restrictions

### 5. Configure API Key Restrictions

#### Application Restrictions

For development:
- Select **HTTP referrers (web sites)**
- Add these referrers:
  ```
  http://localhost:3000/*
  http://localhost:*
  http://127.0.0.1:*
  ```

For production:
- Add your production domain:
  ```
  https://yourdomain.com/*
  https://*.yourdomain.com/*
  ```

#### API Restrictions

- Select **Restrict key**
- Choose these APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API (if using)
  - Directions API (if using)

### 6. Update Environment Variables

Update your `.env` file:

```env
# Replace with your actual API key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Important**: The prefix `NEXT_PUBLIC_` is required for Next.js to expose the variable to the browser.

### 7. Verify Setup

1. Restart your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser console (F12)
3. Check for any Google Maps errors
4. The map should now load correctly

## Testing the API Key

Test your API key directly in browser:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Maps Test</title>
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
</head>
<body>
  <div id="map" style="height: 400px; width: 100%;"></div>
  <script>
    const map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 13
    });
  </script>
</body>
</html>
```

## Common Issues and Solutions

### Issue: "ApiProjectMapError"

**Solution**:
1. Verify billing is enabled
2. Check that Maps JavaScript API is enabled
3. Wait 5-10 minutes after enabling APIs
4. Clear browser cache and reload

### Issue: "NoApiKeys" or "InvalidKeyMapError"

**Solution**:
1. Verify API key is correctly set in `.env`
2. Ensure `NEXT_PUBLIC_` prefix is present
3. Restart development server after changing `.env`
4. Check API key hasn't been deleted in Cloud Console

### Issue: "RefererNotAllowedMapError"

**Solution**:
1. Add your domain to HTTP referrer restrictions
2. For localhost, add: `http://localhost:*`
3. For production, add: `https://yourdomain.com/*`
4. Save changes and wait 5 minutes

### Issue: "ApiTargetBlockedMapError"

**Solution**:
1. Check API restrictions on the key
2. Ensure Maps JavaScript API is in the allowed list
3. Remove API restrictions temporarily for testing

### Issue: Map shows but places/photos don't load

**Solution**:
1. Enable Places API in Cloud Console
2. Add Places API to API restrictions
3. Verify quota limits haven't been exceeded

## Monitoring Usage and Costs

### Check Usage

1. Go to **APIs & Services** > **Dashboard**
2. View requests per API
3. Monitor quota usage

### Set Budget Alerts

1. Go to **Billing** > **Budgets & alerts**
2. Create budget alert
3. Set threshold (e.g., $50/month)
4. Add email notifications

### Optimize Costs

- Use Static Maps API for non-interactive maps (cheaper)
- Implement client-side caching
- Use map styles to reduce tile requests
- Limit zoom levels and map bounds
- Consider using map clustering for many markers

## Free Tier Limits

Google Maps Platform free tier (as of 2024):
- $200 credit per month
- Maps JavaScript API: ~28,000 loads/month free
- Places API: ~17,000 requests/month free
- Geocoding API: ~40,000 requests/month free

## Production Checklist

- [ ] Billing enabled
- [ ] All required APIs enabled
- [ ] API key created with proper restrictions
- [ ] HTTP referrers configured for production domain
- [ ] Budget alerts set up
- [ ] API key stored securely (not in Git)
- [ ] Environment variables configured in deployment platform
- [ ] SSL/HTTPS enabled on production domain
- [ ] Usage monitoring dashboard set up

## Alternative: Using Environment-Specific Keys

For better security, use different API keys for development and production:

```env
# .env.development
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy_DEV_KEY_HERE

# .env.production
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy_PROD_KEY_HERE
```

Configure restrictions accordingly:
- Dev key: Allow localhost only
- Prod key: Allow production domain only

## Support Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Error Messages Reference](https://developers.google.com/maps/documentation/javascript/error-messages)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [Support](https://developers.google.com/maps/support)

## Multi-City Support

The application now supports multiple cities dynamically. The map will automatically center on the selected city:

- Bangalore (default)
- Rishikesh
- Kasol
- Gokarna
- Rameshwaram

The map component receives city coordinates from the backend and adjusts accordingly. No hardcoded Bangalore coordinates in the map display logic.
