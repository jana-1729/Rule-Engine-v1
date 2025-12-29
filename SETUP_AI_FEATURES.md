# 🚀 Quick Setup: AI Features

> **5-Minute Setup Guide**  
> Get AI-powered field mapping working in your Rule Engine

---

## Step 1: Get Gemini API Key (2 minutes)

1. Go to **Google AI Studio**: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

**Free Tier Includes**:
- ✅ 15 requests/minute
- ✅ 1 million tokens/day
- ✅ 1,500 requests/day
- ✅ No credit card required!

---

## Step 2: Add Environment Variable (1 minute)

Add to your `.env.local` file:

```bash
GOOGLE_GEMINI_API_KEY=AIza-your-key-here
GEMINI_MODEL=gemini-2.5-flash-lite-latest
```

Or run this command:

```bash
echo "GOOGLE_GEMINI_API_KEY=AIza-your-key-here" >> .env.local
echo "GEMINI_MODEL=gemini-2.5-flash-lite-latest" >> .env.local
```

---

## Step 3: Start Development Server (1 minute)

```bash
npm run dev
```

---

## Step 4: Test AI Features (1 minute)

Visit the demo page:

```
http://localhost:3000/dashboard/ai-demo
```

**What you'll see**:
- Source schema (Slack message)
- Target schema (Notion page)
- AI mapping button
- Click to generate intelligent mappings!

---

## ✅ You're Done!

The AI features are now active. You can:

1. **Test the demo** at `/dashboard/ai-demo`
2. **Use in workflows** with `<AIMappingPanel />`
3. **Call the API** at `/api/v1/ai/suggest-mapping`

---

## 🎯 Quick Test

Test the API with curl:

```bash
curl -X POST http://localhost:3000/api/v1/ai/suggest-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSchema": {
      "user_name": { "type": "string" },
      "user_email": { "type": "string" }
    },
    "targetSchema": {
      "name": { "type": "string" },
      "email": { "type": "string" }
    },
    "context": "Mapping user data"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "mappings": [...],
    "overallConfidence": 0.95,
    "warnings": []
  }
}
```

---

## 🚨 Troubleshooting

### Issue: "AI service not available"
**Solution**: Check your API key is set correctly in `.env.local`

```bash
# Verify key is set
cat .env.local | grep GEMINI

# Restart dev server
npm run dev
```

### Issue: "Rate limit exceeded"
**Solution**: Free tier has 15 req/min limit. Wait a minute or upgrade.

### Issue: "Cannot find module"
**Solution**: Reinstall dependencies

```bash
npm install
```

---

## 📚 Next Steps

1. **Read the docs**: `docs/QUICK_START_PHASE_2.md`
2. **View the summary**: `DAY_1_COMPLETION_SUMMARY.md`
3. **Explore the code**: `src/services/ai/`
4. **Build workflows**: Add AI mapping to your workflow builder

---

**That's it! You're ready to use AI features! 🎉**

**Cost**: $0/month with free tier  
**Time to setup**: 5 minutes  
**Power**: GPT-4 level intelligence

