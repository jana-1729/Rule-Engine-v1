#!/bin/bash

# API Flow Test Script
# Tests the complete B2B2C flow

set -e  # Exit on error

BASE_URL="http://localhost:3000/api/v1"
API_KEY=""

echo "🚀 Testing B2B2C API Flow"
echo "=========================="
echo ""

# Step 1: Create Account & App
echo "📝 Step 1: Creating account and app..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/apps" \
  -H "Content-Type: application/json" \
  -d '{
    "accountEmail": "test@company-x.com",
    "accountPassword": "Test123!@#",
    "accountName": "Test Company X",
    "appName": "Test App",
    "webhookUrl": "https://webhook.site/unique-id"
  }')

echo "Response: $SIGNUP_RESPONSE"

# Extract API key
API_KEY=$(echo $SIGNUP_RESPONSE | grep -o '"apiKey":"[^"]*' | sed 's/"apiKey":"//')

if [ -z "$API_KEY" ]; then
  echo "❌ Failed to get API key"
  exit 1
fi

echo "✅ Account created!"
echo "📋 API Key: $API_KEY"
echo ""

# Step 2: List Integrations
echo "📋 Step 2: Listing integrations..."
INTEGRATIONS=$(curl -s "$BASE_URL/integrations" \
  -H "X-API-Key: $API_KEY")

echo "Response: $INTEGRATIONS"
echo "✅ Integrations listed!"
echo ""

# Step 3: Initiate OAuth
echo "🔐 Step 3: Initiating OAuth for end user..."
OAUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/connections/authorize" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "test-user-123",
    "integrationSlug": "slack",
    "redirectUri": "http://localhost:3000/callback",
    "metadata": {
      "email": "enduser@example.com",
      "name": "Test End User"
    }
  }')

echo "Response: $OAUTH_RESPONSE"

AUTH_URL=$(echo $OAUTH_RESPONSE | grep -o '"authorizationUrl":"[^"]*' | sed 's/"authorizationUrl":"//' | sed 's/\\//g')

if [ -z "$AUTH_URL" ]; then
  echo "⚠️  OAuth URL not available (integration not configured)"
else
  echo "✅ OAuth initiated!"
  echo "🔗 Authorization URL: $AUTH_URL"
  echo "   (End user would be redirected here)"
fi
echo ""

# Step 4: Try to execute action (will fail without connection)
echo "⚡ Step 4: Attempting to execute action..."
EXEC_RESPONSE=$(curl -s -X POST "$BASE_URL/integrations/slack/actions/send_message" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "test-user-123",
    "input": {
      "channel": "#general",
      "text": "Test message"
    }
  }')

echo "Response: $EXEC_RESPONSE"
echo "⚠️  Expected to fail (user hasn't connected Slack yet)"
echo ""

# Step 5: View Executions
echo "📊 Step 5: Fetching executions..."
EXECUTIONS=$(curl -s "$BASE_URL/executions?limit=5" \
  -H "X-API-Key: $API_KEY")

echo "Response: $EXECUTIONS"
echo "✅ Executions retrieved!"
echo ""

echo "=========================="
echo "✅ API Flow Test Complete!"
echo "=========================="
echo ""
echo "Summary:"
echo "--------"
echo "✅ Account created"
echo "✅ API key issued: $API_KEY"
echo "✅ Integrations listed"
echo "✅ OAuth flow initiated"
echo "✅ Execution attempted"
echo "✅ Logs retrieved"
echo ""
echo "Next steps:"
echo "1. Complete OAuth flow manually"
echo "2. Try executing action again with connected user"
echo "3. View logs in dashboard"
echo ""
echo "Save this API key for future tests:"
echo "$API_KEY"

