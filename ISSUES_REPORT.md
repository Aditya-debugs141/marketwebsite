# Market Website - Comprehensive Issues Report
**Generated:** March 20, 2026  
**Project:** Indian Stock News Market Dashboard  
**Status:** Multiple issues identified across TypeScript, React, and configuration

---

## Executive Summary
- **Total Issues Found:** 25+
- **Critical Issues:** 1
- **High Priority:** 6
- **Medium Priority:** 12
- **Low Priority:** 6+
- **Build Status:** Passing (errors suppressed in next.config.ts)

---

## 🔴 CRITICAL ISSUES

### 1. Build Errors Hidden via TypeScript Ignore
**Severity:** CRITICAL  
**File:** [next.config.ts](next.config.ts)  
**Location:** Lines 5-7

```typescript
typescript: {
  ignoreBuildErrors: true,
},
```

**Issue:** TypeScript build errors are being suppressed globally. This masks real compilation issues and can lead to runtime failures in production.

**Impact:** Cannot detect actual type errors until runtime  
**Recommendation:** Remove `ignoreBuildErrors: true` and fix underlying TypeScript errors

---

## 🔴 HIGH PRIORITY ISSUES

### 2. AI Sentiment Providers - REMOVED
**Status:** RESOLVED  
**Resolution:** All AI sentiment analysis has been completely removed to reduce API quota consumption. The application now uses only rules-based sentiment analysis for deals which doesn't require external API calls. The rules-based logic is in [src/server/engine/deal-sentiment-rules.ts](src/server/engine/deal-sentiment-rules.ts).

---

### 3. Unused ESLint Disable Directive
**Severity:** HIGH  
**File:** [src/hooks/use-socket.ts](src/hooks/use-socket.ts)  
**Line:** 28

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

**Issue:** The eslint-disable directive targets a rule that has no problems in this scope. Remove or fix the actual dependency.

**Recommendation:** Either remove the directive or add missing dependencies to the useEffect array

---

### 4. Unused ESLint-Disable Directive in ThreeBackground
**Severity:** HIGH  
**File:** [src/components/ThreeBackground.tsx](src/components/ThreeBackground.tsx)  
**Line:** 119

**Issue:** Unused @typescript-eslint/no-explicit-any disable comment

**Recommendation:** Either remove or fix the `any` type issues that it's supposed to suppress

---

### 5. External API Rate Limiting and Blocking
**Severity:** HIGH  
**Files:**
- [src/lib/news-service.ts](src/lib/news-service.ts) - Lines 249-264
- [src/server/data-sources/mc-deals.ts](src/server/data-sources/mc-deals.ts)

**Issue:** News feeds from external sources are returning HTTP 400/404 errors:
- MoneyControl RSS: Frequent 400/429 responses
- Screener.in: Blocking requests (CAPTCHA/rate limiting)
- NSE API: Requires special cookie handling and headers

```typescript
// From test output:
"error": "Failed after 3 attempts: HTTP 404 Not Found"
"error": "Failed after 3 attempts: HTTP 400 Bad Request"
```

**Impact:** News feed may be incomplete or unavailable  
**Workaround:** Application gracefully falls back to simulated/cached data

---

### 6. API Timeout Issues
**Severity:** HIGH  
**File:** [src/lib/news-service.ts](src/lib/news-service.ts)  
**Lines:** 229-264

**Issue:** `fetchSourceWithRetry` has a 7-second timeout that may be too aggressive for some sources. Multiple retries with exponential backoff, but still losing valid data.

```typescript
const timeoutId = setTimeout(() => controller.abort(), 7000); // 7-second timeout
```

**Recommendation:** 
1. Increase timeout to 10-12 seconds
2. Implement adaptive retry logic based on source
3. Add request logging/monitoring

---

### 7. NSE API Cookie/Session Requirement
**Severity:** HIGH  
**File:** [src/scripts/tests/test-nse-live.py](src/scripts/tests/test-nse-live.py)  
**Issue:** NSE API requires initial session cookie before accessing bulk deals endpoint

**Impact:** Live NSE deal data may not be fetched properly  
**Recommendation:** Implement cookie jar management or session persistence in deal fetchers

---

## 🟠 MEDIUM PRIORITY ISSUES

### 8. Unexpected `any` Type - verify-heatmap.ts
**Severity:** MEDIUM  
**File:** [src/scripts/verify-heatmap.ts](src/scripts/verify-heatmap.ts)  
**Line:** 26

```typescript
const response = await nse.getDataByEndpoint(url);  // Returns 'any'
```

**Issue:** No explicit type specified for NSE API response  
**Fix:** Add proper type definition:
```typescript
const response = await nse.getDataByEndpoint(url) as { data?: unknown[] };
```

---


---

### 10. Unexpected `any` Types - MarketHeatmap Component
**Severity:** MEDIUM  
**File:** [src/components/MarketHeatmap.tsx](src/components/MarketHeatmap.tsx)  
**Lines:** 72, 136

```typescript
const RenderCustomContent = (props: any) => { ... }  // Line 72
const CustomTooltip = ({ active, payload }: any) => { ... }  // Line 136
```

**Issue:** Multiple `any` types without proper type specification  
**Fix:** Define proper types:
```typescript
interface CustomContentProps {
  x: number;
  y: number;
  [key: string]: unknown;
}
const RenderCustomContent = (props: CustomContentProps) => { ... }
```

---

### 11. Unexpected `any` Type - ThreeBackground Component
**Severity:** MEDIUM  
**File:** [src/components/ThreeBackground.tsx](src/components/ThreeBackground.tsx)  
**Lines:** 69, 71

```typescript
socket.on('sector_update', (data: any[]) => {  // Line 69
    const bank = data.find((s: any) => s.name.includes('BANK'));  // Line 71
```

**Issue:** Multiple `any` types in socket event handlers  
**Fix:** Define proper types for sector data

---

### 12. Unused Variables - NewsCard Component Import
**Severity:** MEDIUM  
**File:** [src/components/NewsCard.tsx](src/components/NewsCard.tsx)  
**Line:** 4

```typescript
import { ..., Calendar, ... } from 'lucide-react';
```

The `Calendar` icon is imported but never used.

**Fix:** Remove unused import

---

### 13. Unexpected `any` Type - check-target-price.ts
**Severity:** MEDIUM  
**File:** [src/scripts/check-target-price.ts](src/scripts/check-target-price.ts)  
**Line:** 21

```typescript
// Some handling of 'any' type without specification
```

**Fix:** Add explicit type specification

---

### 14. Unexpected `any` Type - debug-engine.ts
**Severity:** MEDIUM  
**File:** [src/server/debug-engine.ts](src/server/debug-engine.ts)  
**Line:** 13

Catch block handling `any` type without proper specification

---

### 15. Missing Dependency in useEffect - MotionWrapper
**Severity:** MEDIUM  
**File:** [src/components/MotionWrapper.tsx](src/components/MotionWrapper.tsx)  
**Line:** 9

```typescript
useEffect(() => {
    // ...
    // Missing dependency: 'props.className'
}, []);
```

**Issue:** React Hook has missing dependencies in dependency array  
**Fix:** Add `props.className` to dependency array or memoize props

---

### 16. Unused Variables - MarketTicker Component
**Severity:** MEDIUM  
**File:** [src/components/MarketTicker.tsx](src/components/MarketTicker.tsx)  
**Lines:** 26, 28

```typescript
const oldPrice = ...;  // Never used
const change = ...;    // Never used
```

**Fix:** Remove unused destructuring assignments

---

### 17. Unused Variables - SectorHeatmap Component
**Severity:** MEDIUM  
**File:** [src/components/SectorHeatmap.tsx](src/components/SectorHeatmap.tsx)  
**Line:** 34

Multiple unused destructured properties: `payload`, `colors`, `rank`

---

### 18. Unused Import - ThreeBackground
**Severity:** MEDIUM  
**File:** [src/components/ThreeBackground.tsx](src/components/ThreeBackground.tsx)  
**Line:** 5

```typescript
import { useMemo } from 'react';  // Never used
```

---

### 19. Unused Destructured Variable - ThreeBackground
**Severity:** MEDIUM  
**File:** [src/components/ThreeBackground.tsx](src/components/ThreeBackground.tsx)  
**Line:** 57-58

```typescript
const { data } = socket.on(...);  // 'data' parameter unused
```

---

### 20. Unused Import - check-target-price.ts
**Severity:** MEDIUM  
**File:** [src/scripts/check-target-price.ts](src/scripts/check-target-price.ts)  
**Line:** 4

```typescript
import { YahooQuote } from '...';  // Never used
```

---

## 🟡 LOW PRIORITY ISSUES

### 21. Graceful Degradation - News Feed Failures
**Severity:** LOW  
**Files:** [src/server/wss-server.ts](src/server/wss-server.ts) Lines 167, 190

```typescript
console.error('News Job Failed:', e);
console.error('Heatmap Job Failed:', e);
```

**Note:** These are caught and logged, but not re-emitted to clients. Application continues with old cache.

**Impact:** Minor - App handles failures gracefully with fallback data  
**Recommendation:** Add client-side indicators when data is stale

---

### 22. Unused Variable - wss-server.ts
**Severity:** LOW  
**File:** [src/server/wss-server.ts](src/server/wss-server.ts)  
**Line:** 28

```typescript
aiEngine.init().catch(err => console.error('AI Init Failed:', err));
// 'err' implicitly typed as 'any'
```

**Fix:** Add explicit type:
```typescript
aiEngine.init().catch((err: unknown) => console.error('AI Init Failed:', err));
```

---

### 23. Console Debug Statements
**Severity:** LOW  
**Files:**
- [src/server/debug-engine.ts](src/server/debug-engine.ts) - Multiple console.log calls
- [src/lib/market-service.ts](src/lib/market-service.ts) - Debug logging

**Recommendation:** Remove or gate behind debug flag for production

---

**Recommendation:** Add user notification when using offline fallback mode

---

### 25. Unreachable Code Path
**Severity:** LOW  
**File:** [src/lib/news-service.ts](src/lib/news-service.ts)  
**Line:** 264

```typescript
throw new Error('Unreachable code block');
```

This appears to be defensive code but will never be reached in normal flow.

---

## 📊 LINT ERRORS SUMMARY

From [logs/eslint.txt](logs/eslint.txt):

```
4 problems (1 error, 3 warnings)
  0 errors and 1 warning potentially fixable with `--fix` option
```

**Breakdown:**
- 1 Error: `@typescript-eslint/no-explicit-any`
- 3 Warnings: Unused variables and directive issues

---

## 🔧 RECOMMENDED ACTIONS

### Immediate (Critical)
1. [ ] Remove `ignoreBuildErrors: true` from next.config.ts
2. [ ] Fix all TypeScript errors that appear
3. [ ] Set up environment variables (`.env.local`)

### High Priority
4. [ ] Fix all `any` type annotations (use proper types)
5. [ ] Remove unused imports and variables
6. [ ] Fix missing useEffect dependencies
7. [ ] Implement NSE cookie/session management

### Medium Priority
8. [ ] Increase API timeout to 10-12 seconds
9. [ ] Add request retry logging
10. [ ] Implement client-side stale data indicators
11. [ ] Add API rate limit handling

### Low Priority
12. [ ] Remove/gate debug console statements
13. [ ] Add telemetry for fallback sentiment analysis
14. [ ] Clean up test files in production build

---

## 📝 BUILD CONFIGURATION

**Current Configuration:**
- Next.js: 16.1.6
- TypeScript: ^5
- ESLint: ^9
- Ignoring TypeScript Errors: ✅ (DISABLED - remove this!)

---

## 🧪 TEST STATUS

From [test-output.json](test-output.json) and [test-output.txt](test-output.txt):

**News Feed Tests:** ⚠️ Partial Failures
- Economic Times: ✅ OK
- MoneyControl: ❌ HTTP 400
- Screener.in: ❌ Blocked
- Some sources: ⏱️ Timeouts

**Workaround:** Application uses simulated data when APIs fail

---

## 📚 RELATED DOCUMENTATION

- [README.md](README.md) - Contains environment setup guide
- [.env.example](.env.example) - Template for environment variables
- [tsconfig.json](tsconfig.json) - TypeScript configuration
- [eslint.config.mjs](eslint.config.mjs) - ESLint rules

---

## 🎯 NEXT STEPS

1. **Week 1:** Fix critical TypeScript errors and build configuration
2. **Week 2:** Resolve all `any` type issues and unused variables
3. **Week 3:** Implement API resilience improvements
4. **Week 4:** Add monitoring and user-facing error indicators

---

**Report Generated:** 2026-03-20  
**Project Location:** `c:\Users\adith\OneDrive\Desktop\market website`
