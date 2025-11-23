# Demo Credentials for Testing

## Quick Test Account

Use these credentials to quickly test the dashboard:

### Test Account
- **Email**: `demo@ruleengine.com`
- **Password**: `demo123456`
- **Company**: Demo Company

## Creating Your Own Account

1. Visit `http://localhost:3000`
2. Click "Get Started"
3. Fill in:
   - Company Name: Your company
   - Email: Your email
   - Password: At least 8 characters
4. Click "Create Account"

You'll be automatically logged in and get a default app with API credentials.

## Default App Credentials

When you sign up, a default app is automatically created with:
- **App Name**: `{Your Company} - Default App`
- **App ID**: `app_xxxxxxxxxxxxxxxx` (auto-generated)
- **API Key**: `ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (shown once)

**Important**: Save your API key! It's only shown once on creation.

## Testing the B2B2C API

Once you have your credentials, test the API:

```bash
# Set your credentials
export API_KEY="your-api-key-here"
export APP_ID="your-app-id-here"

# List integrations
curl -X GET http://localhost:3000/api/v1/integrations \
  -H "X-API-Key: $API_KEY" \
  -H "X-App-ID: $APP_ID"

# You should see:
# {
#   "integrations": [
#     {
#       "id": "...",
#       "name": "Slack",
#       "slug": "slack",
#       "version": "1.0.0",
#       ...
#     }
#   ]
# }
```

## Viewing Execution Logs

All API calls are logged and visible in the dashboard:

1. Go to **Executions** page
2. See all your API calls
3. Filter by status, integration, or app
4. Click any execution to see details

## Creating Additional Apps

You can create multiple apps for different environments:

1. Go to **Apps** page
2. Click **"+ Create App"**
3. Enter app name (e.g., "Production", "Staging")
4. Get new API credentials
5. Use different credentials for each environment

## Next Steps

- Explore **Integrations** to see available integrations
- Build a **Workflow** with the visual builder
- Check **Settings** to update your account
- View **Executions** to monitor API calls

---

**Need Help?**

See these guides:
- `QUICK_START_UI.md` - Dashboard walkthrough
- `DASHBOARD_SETUP.md` - Complete setup guide
- `UI_COMPONENTS_SUMMARY.md` - All UI features
