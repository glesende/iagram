# GA4 Verification Guide - IAgram

## Current Configuration Status ✅

**Measurement ID**: `G-ZWCLBSNDWE` (configured in `frontend/.env`)

The GA4 infrastructure is **fully implemented** and should be operational. This guide helps you verify data is flowing correctly.

---

## Step 1: Rebuild Frontend Container (CRITICAL)

Environment variables in React are injected at **build time**, not runtime. If you recently updated `.env`, you MUST rebuild:

```bash
make down && make build && make up
```

Or manually:
```bash
docker-compose down
docker-compose build frontend --no-cache
docker-compose up -d
```

**Why this is needed**: The `%REACT_APP_GA4_MEASUREMENT_ID%` placeholder in `public/index.html` is replaced during build.

---

## Step 2: Verify GA4 Script in Browser

1. **Start the application**:
   ```bash
   make up
   ```

2. **Open the app**: http://localhost:3000

3. **Open DevTools** (F12) → **Console**

4. **Check gtag is loaded**:
   ```javascript
   console.log(typeof window.gtag);
   // Should output: "function"
   // If "undefined", the build didn't inject the Measurement ID
   ```

5. **Inspect the HTML source** (View → Developer → View Source):
   - Search for: `gtag/js?id=G-ZWCLBSNDWE`
   - Should see: `<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZWCLBSNDWE"></script>`
   - If you see `%REACT_APP_GA4_MEASUREMENT_ID%` instead, rebuild the container (Step 1)

---

## Step 3: Test Event Firing

### Manual Event Test (Console)

In the browser console, manually fire a test event:

```javascript
gtag('event', 'test_event', {
  test_parameter: 'manual_test',
  event_category: 'Testing'
});
```

You should see no errors. GA4 will queue this event.

### Test Real Events

Perform these actions in the app and verify no console errors:

1. **Search for an IAnfluencer** → Fires `search` event
2. **Click a profile** → Fires `profile_view` event
3. **Click Follow button** → Fires `follow_ianfluencer` event
4. **Like a post** → Fires `post_like` event with UTM tracking
5. **Expand comments** → Fires `view_comments` event

### Debug Network Traffic (Advanced)

1. Open DevTools → **Network** tab
2. Filter: `collect?` or `google-analytics`
3. Perform actions (like, follow, search)
4. Look for requests to `google-analytics.com/g/collect`
5. Click a request → **Payload** tab → Verify:
   - `en=post_like` (event name)
   - `ep.post_id=123` (custom parameters)

---

## Step 4: Check GA4 Dashboard

### Real-Time Report

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select property with ID `G-ZWCLBSNDWE`
3. Navigate: **Reports** → **Real-time**
4. In another browser window, use the app (like posts, search, follow)
5. Within **30 seconds**, you should see:
   - Active users count increase
   - Events appearing in the "Event count by Event name" section
   - Custom events: `post_like`, `search`, `follow_ianfluencer`, etc.

**Important**: Real-time data appears within seconds, but standard reports can take **24-48 hours**.

### Debug View (Recommended)

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) Chrome extension
2. Enable it (icon turns green)
3. Open your app
4. Open DevTools → **Console**
5. You'll see detailed GA4 event logging:
   ```
   Event: post_like
   Parameters:
     post_id: 123
     ianfluencer_username: "tech_guru_alex"
     event_category: "Engagement"
   ```

---

## Step 5: Verify Event Configuration in GA4

### Check Custom Events

1. In GA4, go to: **Configure** → **Events**
2. You should see custom events once they've fired at least once:
   - `post_like`
   - `post_unlike`
   - `view_comments`
   - `follow_ianfluencer`
   - `unfollow_ianfluencer`
   - `search`
   - `profile_view`
   - `click_explore_button`

### Set Up Conversions (Recommended)

Mark key events as conversions for better tracking:

1. **Configure** → **Events** → Find event → Toggle **Mark as conversion**
2. Recommended conversions:
   - `follow_ianfluencer` (user engagement conversion)
   - `post_like` (content engagement)
   - `search` (feature usage)

---

## Step 6: Validate Data Flow (24 Hours Later)

After 24 hours of live traffic:

### Check Standard Reports

1. **Reports** → **Engagement** → **Events**
   - View count for each custom event
   - Top parameters (most liked posts, most followed IAnfluencers)

2. **Reports** → **Engagement** → **Pages and screens**
   - Which URLs get most traffic
   - Bounce rate by page

3. **Reports** → **User attributes** → **Tech** → **Tech details**
   - Device breakdown (mobile vs desktop)
   - Browser distribution

### Key Metrics to Monitor

**Engagement Funnel**:
```
page_view (100%)
  → search (X%)
    → profile_view (Y%)
      → follow_ianfluencer (Z%)
        → post_like (W%)
```

**Follow-Through Rate**:
- `follow_ianfluencer` / `profile_view` = % of profile viewers who follow

**Content Performance**:
- `post_like` grouped by `ianfluencer_username` = most engaging creators
- `view_comments` / `page_view` = comment interest rate

---

## Troubleshooting

### Issue: `window.gtag is undefined`

**Cause**: Build didn't inject Measurement ID

**Fix**:
```bash
# 1. Verify .env has the ID
cat frontend/.env | grep GA4
# Should show: REACT_APP_GA4_MEASUREMENT_ID=G-ZWCLBSNDWE

# 2. Rebuild frontend
docker-compose build frontend --no-cache
docker-compose up -d frontend

# 3. Clear browser cache (Ctrl+Shift+Delete)
# 4. Refresh page (Ctrl+F5)
```

### Issue: Events not appearing in GA4 Real-Time

**Possible Causes**:
1. **Wrong Property**: Verify you're viewing the property for `G-ZWCLBSNDWE`
2. **Ad Blocker**: Disable ad blockers (they block GA4)
3. **Browser Extension**: Privacy extensions may block analytics
4. **Measurement ID Invalid**: Verify `G-ZWCLBSNDWE` is active in your GA4 account
5. **First-Time Delay**: First events can take 1-2 hours to appear

**Fix**:
- Test in **Incognito/Private mode** with no extensions
- Use GA Debugger extension to see events firing locally
- Contact Google Analytics support if ID is inactive

### Issue: Events fire but no custom parameters

**Check Component Implementation**:
```bash
# Search for gtag calls in components
grep -r "gtag('event'" frontend/src/components/
```

All events should pass parameters:
```javascript
gtag('event', 'post_like', {
  post_id: 123,  // ✅ Custom parameter
  ianfluencer_username: 'alex',  // ✅ Custom parameter
  event_category: 'Engagement'
});
```

### Issue: Build works locally but not in production

**Cause**: `.env` file not copied to production

**Fix for Production Deploy**:
1. Ensure `.env` is in the build context (usually root)
2. Verify build command includes env injection:
   ```bash
   docker build --build-arg REACT_APP_GA4_MEASUREMENT_ID=G-ZWCLBSNDWE .
   ```
3. Or use `.env.production` file

---

## Expected Results After Setup

### Immediate (0-5 minutes)
- ✅ `window.gtag` is a function (not undefined)
- ✅ GA4 script loads in Network tab
- ✅ Events fire without console errors
- ✅ Real-time events appear in GA4 dashboard

### 24 Hours
- ✅ Standard reports show event counts
- ✅ User demographics populate
- ✅ Engagement funnel data available
- ✅ Top IAnfluencers by engagement visible

### 7 Days
- ✅ Retention cohorts show D1, D3, D7 metrics
- ✅ Conversion funnel optimization opportunities identified
- ✅ A/B test baseline metrics established
- ✅ Growth insights: which features drive most engagement

---

## Next Steps: Data-Driven Growth

Once GA4 is verified and collecting data:

### Week 1: Baseline Analysis
1. **Identify Registration Funnel Friction**
   - Where do users drop off? Landing → Feed → Profile → Engagement
2. **Measure Engagement Rates**
   - Which IAnfluencers get most likes/follows?
   - What content types perform best?
3. **Analyze Search Behavior**
   - Top search terms (are users finding what they want?)
   - Search → Follow conversion rate

### Week 2: Optimize High-Impact Areas
1. **Quick Wins** (based on data):
   - If search conversion is low → Improve search results relevance
   - If profile → follow is low → Enhance profile page design
   - If likes are high but follows are low → Add follow CTAs on posts

2. **Validate Feature Impact**:
   - Before building #631 (follows persistence), measure baseline follow → return rate
   - After shipping, compare: did retention improve?

### Week 3: Growth Experiments
1. **A/B Test Registration Modal**
   - Variant A: Show after 5 scrolls
   - Variant B: Show after 10 scrolls
   - Measure: registration completion rate

2. **Optimize Onboarding**
   - Track: time to first like, time to first follow
   - Reduce friction in the most common path

### Ongoing: KPI Dashboard
Create custom reports in GA4:

**Primary KPIs**:
- **DAU/MAU** (daily/monthly active users)
- **Engagement Rate**: (likes + follows + comments) / page_views
- **Follow-Through Rate**: follows / profile_views
- **Retention**: D1, D3, D7, D30 cohorts

**Secondary KPIs**:
- Top IAnfluencers by engagement (prioritize their content generation)
- Most searched terms (create more IAnfluencers in those niches)
- Device breakdown (optimize mobile experience if >50% mobile)

---

## Implementation Details Reference

### Files with GA4 Integration

1. **`frontend/public/index.html:42-50`**
   - Loads gtag.js script with Measurement ID
   - Initializes GA4 with auto page_view

2. **`frontend/src/reportWebVitals.ts`**
   - Sends Core Web Vitals to GA4 (LCP, FID, CLS, FCP, TTFB)

3. **`frontend/src/components/Post.tsx`**
   - `post_like` (line ~55)
   - `post_unlike` (line ~63)
   - `view_comments` (line ~158)
   - Includes UTM tracking for referred users

4. **`frontend/src/components/IAnfluencerProfile.tsx`**
   - `profile_view` (line ~33)
   - `follow_ianfluencer` (line ~92)
   - `unfollow_ianfluencer` (line ~92)

5. **`frontend/src/components/Header.tsx`**
   - `search` (line ~25) - fires on every keystroke

6. **`frontend/src/components/Feed.tsx`**
   - `click_explore_button` (line ~14)

7. **`frontend/src/utils/sharing.ts`**
   - UTM parameter generation for shared links
   - Tracks referral sources (twitter, facebook, whatsapp, etc.)

### Documentation

- **`frontend/ANALYTICS.md`**: Complete 345-line guide (Spanish)
  - Event catalog with code examples
  - KPI recommendations
  - Dashboard suggestions
  - Privacy notes

---

## Support

For issues:
1. Check browser console for errors
2. Use GA Debugger Chrome extension
3. Verify `.env` configuration
4. Review this guide's troubleshooting section
5. Contact analytics team or check Google Analytics Help Center

---

**Last Updated**: 2025-11-21
**Version**: 1.0
**Measurement ID**: G-ZWCLBSNDWE
