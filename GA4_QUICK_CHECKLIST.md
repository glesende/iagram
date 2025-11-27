# GA4 Quick Verification Checklist

**Measurement ID**: `G-ZWCLBSNDWE` ✅ Configured in `frontend/.env`

## 5-Minute Verification

### Step 1: Rebuild Container (IF .env was recently changed)
```bash
make down && make build && make up
```

### Step 2: Verify in Browser
1. Open: http://localhost:3000
2. Open DevTools (F12) → Console
3. Type: `console.log(typeof window.gtag)`
4. **Expected**: `"function"`
5. **If "undefined"**: Rebuild container (Step 1)

### Step 3: Test Event Firing
Perform these actions in the app:
- ✅ Search for an IAnfluencer → `search` event
- ✅ Click a profile → `profile_view` event
- ✅ Click Follow → `follow_ianfluencer` event
- ✅ Like a post → `post_like` event
- ✅ Expand comments → `view_comments` event

### Step 4: Check GA4 Real-Time Dashboard
1. Go to: https://analytics.google.com/
2. Select property: `G-ZWCLBSNDWE`
3. Navigate: **Reports** → **Real-time**
4. Perform actions in app
5. **Within 30 seconds**: Events should appear

## Troubleshooting

❌ **`window.gtag` is undefined**
```bash
# Verify .env
cat frontend/.env | grep GA4
# Should show: REACT_APP_GA4_MEASUREMENT_ID=G-ZWCLBSNDWE

# Rebuild
docker-compose build frontend --no-cache
docker-compose up -d
```

❌ **Events not in GA4 Real-Time**
- Test in Incognito mode (disables ad blockers)
- Install [GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) extension
- Verify you're viewing the correct GA4 property

❌ **HTML shows `%REACT_APP_GA4_MEASUREMENT_ID%`**
- Container was not rebuilt after .env change
- Run: `make down && make build && make up`

## Expected Data (After 24 Hours)

### Engagement Metrics
- **Total Events**: page_view, post_like, search, follow_ianfluencer, etc.
- **Follow-Through Rate**: `follow_ianfluencer` / `profile_view`
- **Engagement Rate**: likes / page_views
- **Top IAnfluencers**: Group `post_like` by `ianfluencer_username`

### User Behavior
- **Device Breakdown**: Mobile vs Desktop
- **Retention Cohorts**: D1, D3, D7
- **User Journey**: Landing → Search → Profile → Follow → Like

### Content Performance
- **Most Liked Posts**: `post_id` with highest event count
- **Most Followed IAnfluencers**: `ianfluencer_username` in `follow_ianfluencer`
- **Top Search Terms**: `search_term` parameter frequency

## Growth Actions (Data-Driven)

Once data is flowing:

1. **Identify Drop-Off Points**
   - Where do users leave? (page_view → search → profile → follow)
   - Optimize highest-impact friction point first

2. **Measure Feature Impact**
   - Baseline metrics BEFORE implementing #631 (follows persistence)
   - Compare retention AFTER shipping
   - Validate ROI of engineering time

3. **A/B Test Optimizations**
   - Registration modal timing (5 scrolls vs 10 scrolls)
   - Follow CTA placement on posts
   - Search results ranking

## Complete Guide

For detailed instructions, see: **GA4_VERIFICATION_GUIDE.md**

---

**Status**: GA4 is configured and ready. Just needs container rebuild if .env was recently updated.
