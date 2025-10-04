# Tasks: SendGrid Deliverability & Engagement Analytics Dashboard (MVP)

**Input**: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`  
**Branch**: `001-sendgrid-deliverability-engagement`

---

## Phase 3.1 – Project Setup

- [ ] **T001** Initialize Next.js 14 project in repo root (`npx create-next-app@latest sendgrid-dashboard --ts --app --tailwind`)
- [ ] **T002** Configure Tailwind + shadcn/ui theme (brand colors, typography, spacing) in `tailwind.config.ts`
- [ ] **T003** Install core libraries (`exceljs`, `recharts`, `luxon`, `@radix-ui/react-*`, `clsx`, `lucide-react`)
- [ ] **T004** Set up ESLint/Prettier scripts and CI workflow `.github/workflows/deploy.yml` (lint, build, Playwright, Vercel deploy)

## Phase 3.2 – Core Utilities & State

- [ ] **T005** Implement Excel parsing helper `src/lib/excel-parser.ts` (read `.xlsx`, map columns → `EmailEvent`, deduplicate by `sg_event_id`)
- [ ] **T006** Implement metrics/aggregation utilities `src/lib/aggregations.ts` (daily aggregates, category aggregates, KPI metrics, funnel stages)
- [ ] **T007** Implement filtering/search helpers `src/lib/filters.ts` (date range, event type, email search, category filter)
- [ ] **T008** Implement dashboard state hook `src/hooks/useDashboardState.ts` (useReducer with actions: `UPLOAD_DATA`, `SET_FILTERS`, `RESET`)

## Phase 3.3 – UI Components (shadcn/ui + Recharts)

- [ ] **T009** Build Excel upload component `src/components/upload/UploadDropzone.tsx` (drag/drop, parse via ExcelJS, error messaging)
- [ ] **T010** Build KPI metrics panel `src/components/metrics-panel/MetricsPanel.tsx` (cards with delivered %, bounced %, unique opens %)
- [ ] **T011** Build activity feed table `src/components/activity-feed/ActivityFeed.tsx` (search, filter, sortable columns, virtualized rows)
- [ ] **T012** Build figures summary table `src/components/figures-table/FiguresTable.tsx` (daily/weekly/monthly toggle, responsive layout)
- [ ] **T013** Build statistics charts `src/components/stats-charts/StatsCharts.tsx` (Recharts line/area charts with legends, tooltip, date range sync)
- [ ] **T014** Build funnel visualization `src/components/funnel/FunnelChart.tsx` (Recharts funnel with conversion percentages)
- [ ] **T015** Build categories table `src/components/categories/CategoriesTable.tsx` (sortable metrics, open/click rates, “Uncategorized” group)
- [ ] **T016** Build export controls `src/components/export/ExportButton.tsx` (download CSV using `aggregations.ts` + current filters)
- [ ] **T017** Compose main dashboard page `src/app/page.tsx` (layout, filter controls, responsive grid, empty-state messaging)

## Phase 3.4 – Polish & Validation

- [ ] **T018** Ensure WCAG 2.1 AA compliance (keyboard nav, focus states, contrast) across components
- [ ] **T019** Optimize performance for 10k row dataset (React memoization, virtualized table, measure load/render times)
- [ ] **T020** Add responsive breakpoints & mobile layout parity (≤375px, ≤768px) per specification screenshots

## Phase 3.5 – Testing & Deployment

- [ ] **T021** Write Playwright E2E tests covering the 6 quickstart scenarios + edge cases (no data, invalid email, large dataset warning)
- [ ] **T022** Create `README.md` (setup steps, commands, deployment instructions, testing instructions)
- [ ] **T023** Configure Vercel deployment (environment setup, GitHub integration, protected preview URL)

---

## Dependencies

- T001 → prerequisite for all tasks
- T005 depends on Excel file schema from spec
- T009-T016 depend on utilities (T005-T008)
- T017 depends on components T009-T016
- T018-T020 depend on T017
- T021 depends on full UI (T009-T020)
- T022-T023 depend on project being functional (T009-T021)

### Parallel Guidance

- **Setup**: T001-T004 sequential (scaffold → config → deps → CI)
- **Utilities**: T005-T008 can run in parallel after T002
- **Components**: T009-T016 mostly parallel (distinct files) once utilities ready; coordinate shared filter props
- **Polish**: T018-T020 sequential (accessibility → performance → responsive)
- **Final**: T021-T023 sequential (tests → docs → deploy)

---

## Constitutional Alignment

- **Specification-Driven**: Tasks trace to `spec.md`, `data-model.md`, `quickstart.md`
- **Modularity**: Utilities (T005-T008) separated from presentation (T009-T016)
- **Performance**: T019 enforces load <2s, charts <1s, filters <500ms
- **Accessibility**: T018 ensures WCAG 2.1 AA compliance
- **Documentation**: T022 captures setup & usage; WINDSURF.md updated during plan
- **Testing**: T021 provides end-to-end coverage of business scenarios

---

**Total Tasks**: 23  
**Next Step**: Start with Phase 3.1 (T001)
