# Quickstart: Dashboard Production Readiness & UX Enhancements

## Prerequisites

- Node.js 20+
- SendGrid Stats.xlsx sample dataset in repository root
- Modern browser (Chrome 120+, Firefox 120+, Safari 17+)

## Setup

```bash
cd sendgrid-dashboard
npm install
npm run dev
```

Open http://localhost:3000

---

## Test Scenario 1: Data Persistence Recovery

### Objective
Verify uploaded data persists across page refreshes

### Steps
1. Open dashboard (should show "0 events loaded")
2. Upload `SendGrid Stats.xlsx` via drag-and-drop or file picker
3. Wait for success message (e.g., "500 events loaded")
4. Note the total event count in header
5. Apply a filter (e.g., email contains "test")
6. Note the filtered event count
7. **Hard refresh the page** (Ctrl+F5 / Cmd+Shift+R)
8. Observe the page reloads

### Expected Results
✅ **Pass Criteria**:
- Event count header shows same total as step 4
- Filters are cleared (default 7-day range restored)
- Data loads from localStorage (no upload prompt)
- Activity feed displays same events
- Charts render correctly

❌ **Fail Criteria**:
- Event count shows "0 events loaded"
- Upload prompt appears again
- localStorage shows no `sendgrid-dashboard-v1` key
- Console errors related to storage

### Cleanup
- Clear localStorage: Browser DevTools → Application → Storage → localStorage → Clear All
- Refresh page to reset to initial state

---

## Test Scenario 2: Error Boundary Protection

### Objective
Verify error boundaries prevent full app crashes

### Steps
1. Upload dataset and confirm dashboard loads
2. Open Browser DevTools → Console
3. Inject error simulation code:
   ```javascript
   // Simulate component crash
   window.__simulateError = () => {
     throw new Error('Simulated component error');
   };
   ```
4. Trigger error in a component (will need developer assistance to add error button)
5. Observe error boundary catches the error

### Expected Results
✅ **Pass Criteria**:
- Error boundary displays fallback UI with error message
- Rest of dashboard remains functional (other sections visible)
- Console logs error with component name and stack trace
- "Try Again" button is present
- Clicking "Try Again" recovers the component

❌ **Fail Criteria**:
- Entire page becomes blank
- No error message displayed
- Other sections of dashboard crash
- No recovery option available

### Cleanup
- Click "Try Again" or refresh page

---

## Test Scenario 3: URL Session Sharing

### Objective
Verify filters can be shared via URL

### Steps
1. Upload dataset
2. Apply multiple filters:
   - Email: `alex@example.com`
   - Category: `Welcome`
   - Event Type: `open`
   - Date Range: 2024-01-01 to 2024-01-31
   - Granularity: `weekly`
3. Wait 1 second (debounce delay)
4. Check URL bar - should contain query params: `?e=alex@example.com&c=Welcome&t=open&sd=2024-01-01&ed=2024-01-31&g=weekly`
5. Click browser address bar and copy URL
6. Open new incognito/private browser window
7. Paste URL and press Enter
8. Observe dashboard loads with filters pre-applied

### Expected Results
✅ **Pass Criteria**:
- URL contains all filter parameters (short codes: e, c, t, sd, ed, g)
- New browser window applies filters automatically
- Activity feed shows only matching events
- Figures table uses weekly granularity
- No upload prompt (data still needs upload in new window, this is expected)

❌ **Fail Criteria**:
- URL does not update with filters
- Shared URL loads with default filters
- URL parameters are malformed or missing
- Console errors on URL decode

### Cleanup
- Close incognito window
- Clear filters in main window

---

## Test Scenario 4: Multi-Select Filters

### Objective
Verify multiple categories and event types can be selected simultaneously

### Steps
1. Upload dataset with diverse categories (Welcome, Marketing, Transactional)
2. Open Category filter dropdown
3. Select **multiple** categories: `Welcome` and `Marketing`
4. Observe filter chips appear below dropdown
5. Open Event Type filter dropdown
6. Select **multiple** event types: `open` and `click`
7. Observe activity feed updates

### Expected Results
✅ **Pass Criteria**:
- Category dropdown shows checkboxes (not radio buttons)
- Multiple categories can be selected simultaneously
- Filter chips display: "Welcome ✕" and "Marketing ✕"
- Activity feed shows events matching: `(category = Welcome OR category = Marketing) AND (event = open OR event = click)`
- Event count badge updates correctly
- Clicking ✕ on chip removes that filter
- "Select All" and "Clear All" buttons work

❌ **Fail Criteria**:
- Only single selection allowed (radio button behavior)
- Filter logic uses AND instead of OR (no events match)
- Chips do not appear
- Clicking chip ✕ doesn't remove filter

### Cleanup
- Click "Clear All" or individual chip ✕ buttons

---

## Test Scenario 5: Insights Auto-Generation

### Objective
Verify insights panel displays rule-based metrics

### Steps
1. Upload dataset with known bounce rate (check Excel file beforehand)
2. Wait for dashboard to load
3. Locate "Insights" panel (should be after Metrics Panel)
4. Observe auto-generated insights

### Expected Results
✅ **Pass Criteria**:
- Insights panel is visible and expanded by default
- At least 3 insights displayed (e.g., bounce rate, open rate trend, top category)
- Insights have color-coded indicators:
  - Green: "Delivery rate healthy (98%)"
  - Yellow: "Open rate declined 15% vs. previous period"
  - Red: "Bounce rate (6%) exceeds threshold (5%)"
- Insights include numeric values and recommendations
- Insights update when filters change (apply category filter, insights recalculate)

❌ **Fail Criteria**:
- No insights panel visible
- Insights show placeholder text or "No data"
- Color coding incorrect (red for good metrics)
- Insights do not update with filter changes
- Console errors during insight calculation

### Cleanup
- Collapse insights panel (should save state to localStorage)

---

## Test Scenario 6: Keyboard Navigation

### Objective
Verify all interactive elements are keyboard-accessible

### Steps
1. Upload dataset
2. Click browser address bar to focus it
3. Press **Tab** key repeatedly
4. Observe focus moves through:
   - Filter dropdowns
   - Date range inputs
   - Search input
   - Export buttons
   - Table headers (sortable)
   - Activity feed (virtualized items)
5. Press **/** key (forward slash)
6. Observe search input gains focus
7. Press **Escape** key
8. Observe filters are cleared
9. Press **?** key (question mark)
10. Observe keyboard shortcuts help modal appears

### Expected Results
✅ **Pass Criteria**:
- Tab order is logical (top-to-bottom, left-to-right)
- All interactive elements show visible focus indicator (blue outline)
- Keyboard shortcuts work:
  - `/` focuses search input
  - `Esc` clears all filters
  - `?` shows help modal
- DateRangePicker calendar navigable with arrow keys
- Dropdown menus open/close with Enter/Space keys
- No focus traps (Tab always progresses)

❌ **Fail Criteria**:
- Focus indicators invisible or low-contrast
- Tab skips interactive elements
- Keyboard shortcuts do not work
- Date picker not keyboard-accessible
- Screen reader announces incorrect labels

### Cleanup
- Close help modal if opened

---

## Test Scenario 7: File Upload Security Validation

### Objective
Verify file upload rejects invalid files

### Steps
1. Prepare test files:
   - Valid: `SendGrid Stats.xlsx` (real Excel file)
   - Invalid MIME: Rename `.txt` file to `.xlsx`
   - Oversized: Create Excel file >10MB
   - Wrong format: Upload `.csv` or `.json` file
2. Attempt to upload invalid MIME file
3. Observe error message: "Invalid file type"
4. Attempt to upload oversized file
5. Observe error message: "File too large (max 10MB)"
6. Attempt to upload wrong format
7. Observe error message: "Only .xlsx Excel files are supported"
8. Upload valid file
9. Observe success

### Expected Results
✅ **Pass Criteria**:
- MIME type validation rejects non-Excel files
- Size validation rejects files >10MB
- File signature check catches renamed files
- Clear error messages displayed
- Valid file uploads successfully

❌ **Fail Criteria**:
- Invalid files accepted
- No error messages shown
- Console errors instead of user-friendly messages
- App crashes on invalid file

### Cleanup
- Clear uploaded data

---

## Test Scenario 8: Loading State Feedback

### Objective
Verify loading indicators appear during heavy operations

### Steps
1. Open dashboard (empty state)
2. Drag large Excel file (500+ events) to upload area
3. Observe progress indicators
4. Once uploaded, apply complex filters (multiple categories)
5. Observe skeleton loaders
6. Click "Export CSV" button
7. Observe button spinner

### Expected Results
✅ **Pass Criteria**:
- Upload shows progress bar 0% → 100%
- "Processing Excel file..." text displays during parsing
- Skeleton loaders appear for:
  - MetricsPanel (4 shimmer cards)
  - FiguresTable (3 shimmer rows)
  - StatsCharts (shimmer chart area)
- Skeleton loaders disappear when data ready (<500ms)
- Export button shows spinner during CSV generation
- UI remains responsive (not frozen)

❌ **Fail Criteria**:
- No loading indicators during upload
- UI appears frozen (no feedback)
- Skeleton loaders persist after data loads
- Export button does not show feedback

### Cleanup
- Wait for operations to complete

---

## Test Scenario 9: CI/CD Pipeline Validation

### Objective
Verify automated checks run on pull requests

### Steps
1. Create feature branch: `git checkout -b test/ci-pipeline`
2. Make trivial change (add comment to file)
3. Commit and push: `git push origin test/ci-pipeline`
4. Open pull request on GitHub
5. Observe GitHub Actions workflow triggers
6. Wait for checks to complete

### Expected Results
✅ **Pass Criteria**:
- CI workflow runs automatically on PR
- Checks include:
  - `npm run lint` (ESLint)
  - `npm run build` (TypeScript + Next.js)
  - `tsc --noEmit` (Type checking)
- All checks pass with green status
- PR merge button enabled only after checks pass
- Failed checks block merge

❌ **Fail Criteria**:
- No CI workflow triggers
- Checks do not run automatically
- Failed checks do not block merge
- Missing required checks (lint, build, types)

### Cleanup
- Delete feature branch after testing
- Close PR without merging

---

## Test Scenario 10: TypeScript Strict Mode Compliance

### Objective
Verify strict TypeScript mode is enabled and enforced

### Steps
1. Open `tsconfig.json`
2. Verify `"strict": true` is present
3. Verify `"noUncheckedIndexedAccess": true` is present
4. Run: `npx tsc --noEmit`
5. Observe no type errors reported

### Expected Results
✅ **Pass Criteria**:
- `strict: true` enabled in tsconfig.json
- `noUncheckedIndexedAccess: true` enabled
- `tsc --noEmit` exits with code 0 (no errors)
- No `any` types in new code (except explicitly documented)
- All functions have explicit return types

❌ **Fail Criteria**:
- Strict mode disabled
- Type errors reported by tsc
- Unsafe `any` types present
- Missing return type annotations

### Cleanup
- None required

---

## Performance Benchmarks

### Acceptance Criteria
| Operation | Target | Measurement |
|-----------|--------|-------------|
| Filter change (10k events) | <500ms | React DevTools Profiler |
| Page load with localStorage | <1s | Network tab (DOMContentLoaded) |
| Skeleton loader appearance | <100ms | Manual observation |
| Excel parsing start | <100ms | Progress bar first update |
| URL update on filter change | Debounced 500ms | Browser address bar |
| localStorage save | Debounced 1s | DevTools Application tab |

### How to Measure
1. Open Chrome DevTools → Performance
2. Start recording
3. Perform operation (e.g., change filter)
4. Stop recording
5. Analyze flamegraph for time spent in React components
6. Verify operations complete within target time

---

## Rollback Procedures

### Rollback Plan for Critical Issues
1. **Data Loss**: 
   - User can re-upload Excel file
   - localStorage can be manually backed up via DevTools → Application → localStorage → Export
2. **UI Crash**:
   - Clear localStorage: `localStorage.clear()`
   - Refresh page to reset to initial state
3. **Performance Degradation**:
   - Reduce dataset size (filter in Excel before upload)
   - Clear browser cache and reload
4. **CI/CD Failure**:
   - Revert to previous commit: `git revert HEAD`
   - Re-run pipeline: `git push --force-with-lease`

### Emergency Hotfix Process
1. Identify broken commit via git bisect
2. Create hotfix branch: `git checkout -b hotfix/issue-name`
3. Apply minimal fix
4. Run all E2E tests locally: `npm run test:e2e`
5. Create PR with `[HOTFIX]` prefix
6. Fast-track review and merge
7. Monitor Vercel deployment logs

---

## Success Metrics

Implementation is successful when:
- ✅ All 10 test scenarios pass
- ✅ Performance benchmarks met
- ✅ No console errors in production build
- ✅ E2E test suite passes (6 scenarios)
- ✅ Type checking passes with strict mode
- ✅ CI/CD pipeline operational
- ✅ Accessibility audit passes (Lighthouse score >90)
- ✅ Bundle size <1MB (target: ~750KB after Luxon removal)

---

## Troubleshooting

### Common Issues

**Issue**: localStorage quota exceeded
**Solution**: Clear old data via "Clear Data" button, export to JSON for backup

**Issue**: URL too long for sharing
**Solution**: Use fewer filters or export/import JSON session file

**Issue**: Date formatting incorrect after Luxon removal
**Solution**: Verify timezone handling in `format.ts` uses `formatInTimeZone` from date-fns-tz

**Issue**: Error boundary not catching errors
**Solution**: Verify error boundaries are wrapping correct components, check React version (19+)

**Issue**: Insights not generating
**Solution**: Verify dataset has sufficient events (>100), check console for rule evaluation errors

**Issue**: Keyboard shortcuts not working
**Solution**: Verify no input fields are focused, check browser extension conflicts

---

## Next Steps

After completing all test scenarios:
1. Update README.md with new features
2. Create demo video showing: persistence, URL sharing, multi-select, insights
3. Deploy to Vercel staging environment
4. Run accessibility audit with Lighthouse
5. Conduct user acceptance testing (UAT)
6. Plan production release

---

**Last Updated**: 2025-01-05
**Test Coverage**: 10 manual scenarios + 6 E2E automated tests
**Estimated Test Time**: 60 minutes for full manual run-through
