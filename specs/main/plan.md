
# Implementation Plan: Dashboard Production Readiness & UX Enhancements

**Branch**: `main` | **Date**: 2025-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/main/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Comprehensive production readiness implementation addressing 10 critical issues plus strategic UX improvements:

**Critical Fixes (P1-P10)**:
1. Data Persistence - localStorage implementation for uploaded datasets
2. Error Boundaries - root and component-level error handling
3. Date Library Migration - consolidate to date-fns, remove Luxon (~50KB savings)
4. Loading States - skeleton loaders, progress indicators, debounced inputs
5. CI/CD Pipeline - automated lint, build, test checks on PRs
6. Keyboard Navigation - arrow keys, shortcuts, WCAG 2.1 AA compliance
7. Type Safety - strict mode, type guards, no unsafe any
8. Upload Security - MIME validation, file size limits, CSP headers
9. Performance Optimization - consolidated aggregations hook, single-pass computation
10. Environment Configuration - .env.example, zod validation, deployment docs

**Strategic Improvements**:
- URL-based session sharing (query params for filters)
- Multi-select filters (categories + event types with OR logic)
- Insights dashboard section (rule-based metric analysis)

**Technical Approach**: Phased implementation starting with critical stability fixes, followed by performance optimizations, then UX enhancements. All changes maintain backward compatibility with existing E2E tests.

## Technical Context
**Language/Version**: TypeScript 5.x with React 19.1.0, Next.js 15.5.4 (App Router)
**Primary Dependencies**: 
- UI: Tailwind CSS 4, Radix UI primitives, Lucide icons
- Data: ExcelJS 4.4.0, date-fns 3.6.0 (migrating from Luxon)
- Performance: @tanstack/react-virtual 3.13.12
- Validation: zod 3.22+ (new)
**Storage**: localStorage (client-side persistence, 10MB quota management)
**Testing**: Playwright E2E tests, future: Jest for unit tests
**Target Platform**: Modern browsers (Chrome 120+, Firefox 120+, Safari 17+, Edge 120+)
**Project Type**: Web (single Next.js application, client-side rendering)
**Performance Goals**: 
- Filter operations <500ms for 10k events
- Page load with restored data <1s
- Skeleton loaders visible within 100ms
- Excel parsing shows progress within 100ms
**Constraints**: 
- Bundle size <1MB (currently ~800KB, target ~750KB after Luxon removal)
- localStorage limit 10MB with warnings at 80%
- No backend API (pure client-side until future Supabase migration)
- WCAG 2.1 AA accessibility compliance
**Scale/Scope**: 
- Support 10k-50k email events per session
- 12 major components + 6 lib modules
- 3 E2E test scenarios (expanding to 6)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No constitution file defined - using industry best practices)

**Applied Principles**:
1. **Test-First Development**: All new features have E2E tests before implementation
2. **Simplicity**: Client-side only, no over-engineering, localStorage before backend
3. **Incremental Migration**: Date library migration in phases, backward compatibility maintained
4. **Code Quality**: TypeScript strict mode, ESLint enforcement, Prettier formatting
5. **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support

**Justified Deviations**: None - this is a refactoring/enhancement project, no new architectural patterns introduced

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
sendgrid-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # [MODIFY] Add root error boundary
│   │   ├── page.tsx                 # [MODIFY] Add persistence, URL sync, multi-select
│   │   └── globals.css              # [EXISTS] Styling
│   ├── components/
│   │   ├── activity-feed/
│   │   │   └── ActivityFeed.tsx     # [EXISTS] Virtual scrolling
│   │   ├── categories/
│   │   │   └── CategoriesTable.tsx  # [EXISTS] Category aggregates
│   │   ├── error/                   # [NEW] Error boundary components
│   │   │   ├── ErrorBoundary.tsx    # [NEW] Reusable error boundary
│   │   │   └── ErrorFallback.tsx    # [NEW] Error UI
│   │   ├── figures-table/
│   │   │   └── FiguresTable.tsx     # [EXISTS] Aggregates table
│   │   ├── filters/
│   │   │   └── FilterBar.tsx        # [MODIFY] Multi-select, keyboard nav
│   │   ├── funnel/
│   │   │   └── FunnelChart.tsx      # [EXISTS] Conversion funnel
│   │   ├── insights/                # [NEW] Insights section
│   │   │   └── InsightsPanel.tsx    # [NEW] Rule-based insights
│   │   ├── layout/
│   │   │   └── DashboardShell.tsx   # [EXISTS] Main layout
│   │   ├── metrics-panel/
│   │   │   └── MetricsPanel.tsx     # [EXISTS] KPI cards
│   │   ├── sequence/
│   │   │   └── EmailSequenceCard.tsx # [EXISTS] Sequence analytics
│   │   ├── stats-charts/
│   │   │   └── StatsCharts.tsx      # [EXISTS] Time series charts
│   │   ├── ui/                      # [EXISTS] Shared UI primitives
│   │   └── upload/
│   │       └── UploadDropzone.tsx   # [MODIFY] Security validation
│   ├── hooks/
│   │   ├── useDashboardState.ts     # [MODIFY] URL sync, localStorage
│   │   ├── useAggregations.ts       # [NEW] Consolidated aggregations
│   │   └── useLocalStorage.ts       # [NEW] Persistence hook
│   ├── lib/
│   │   ├── aggregations.ts          # [MODIFY] Remove Luxon, optimize
│   │   ├── excel-parser.ts          # [MODIFY] Remove Luxon, security
│   │   ├── export.ts                # [EXISTS] CSV export
│   │   ├── filters.ts               # [MODIFY] Remove Luxon, multi-select
│   │   ├── format.ts                # [MODIFY] Remove Luxon
│   │   ├── insights.ts              # [NEW] Rule-based insights logic
│   │   ├── sequence-analytics.ts    # [EXISTS] Sequence metrics
│   │   ├── storage.ts               # [NEW] localStorage management
│   │   └── url-state.ts             # [NEW] URL serialization
│   ├── types/
│   │   └── index.ts                 # [MODIFY] Add new types
│   └── utils/
│       └── cn.ts                    # [EXISTS] Class name utility
├── tests/
│   └── e2e/
│       └── dashboard.spec.ts        # [MODIFY] Add new test scenarios
├── .github/
│   └── workflows/
│       ├── ci.yml                   # [NEW] CI pipeline
│       └── deploy.yml               # [NEW] Deployment automation
├── .env.example                     # [NEW] Environment template
├── next.config.ts                   # [MODIFY] Add CSP headers
├── tsconfig.json                    # [MODIFY] Enable strict mode
└── package.json                     # [MODIFY] Remove Luxon, add zod
```

**Structure Decision**: Single Next.js application with client-side rendering. No backend required. All new files are co-located with existing structure. Refactoring maintains backward compatibility.

## Phase 0: Outline & Research

**Research Topics**:
1. **localStorage Best Practices**
   - Quota management strategies
   - Data versioning patterns
   - Performance implications for large datasets
   - Browser compatibility (Safari private mode)

2. **Date Library Migration**
   - date-fns vs Luxon API mapping
   - Timezone handling consistency
   - Performance benchmarks
   - Breaking change identification

3. **Error Boundary Patterns**
   - React 19 error boundary best practices
   - Granularity (root vs component-level)
   - Error logging strategies
   - User experience during errors

4. **URL State Management**
   - Query param serialization formats
   - Next.js router integration
   - URL length limits and handling
   - Browser history management

5. **File Upload Security**
   - MIME type validation methods
   - File signature checking
   - Content Security Policy headers
   - XSS prevention in Excel data

6. **Performance Optimization**
   - Single-pass aggregation algorithms
   - Web Workers for heavy computation
   - React memoization strategies
   - Virtual scrolling best practices

**Output**: research.md documenting decisions, rationales, and implementation patterns

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Data Model Updates** → `data-model.md`:
   - **StorageSchema**: localStorage data structure with versioning
   - **URLParams**: Query parameter schema for sharing
   - **InsightRule**: Rule definition for automated insights
   - **ErrorContext**: Error boundary state and logging
   - **MultiSelectFilter**: Filter state for OR-logic queries

2. **Type Definitions** (no API contracts - client-side only):
   - `StorageQuota`: quota management types
   - `LoadingState`: skeleton loader states
   - `KeyboardShortcut`: shortcut definitions
   - `InsightSeverity`: insight color coding

3. **E2E Test Scenarios** → failing tests:
   - **Persistence Recovery**: Upload → refresh → verify data restored
   - **Error Boundary**: Simulate crash → verify recovery UI
   - **URL Sharing**: Apply filters → copy URL → open in new tab → verify state
   - **Multi-Select**: Select multiple categories → verify OR logic
   - **Insights Generation**: Upload dataset → verify insights display
   - **Keyboard Navigation**: Tab through UI → verify focus indicators

4. **Quickstart Scenarios** → `quickstart.md`:
   - Manual test steps for each user story
   - Expected outcomes and validation criteria
   - Rollback procedures

5. **Update agent file**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType windsurf`
   - Add: zod, localStorage patterns, error boundaries, URL state
   - Remove: Luxon references

**Output**: data-model.md, quickstart.md, 6 new E2E test scenarios, updated WINDSURF.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Setup Tasks** (sequential):
   - T001: Update dependencies (remove Luxon, add zod)
   - T002: Enable TypeScript strict mode
   - T003: Create .env.example and .github/workflows

2. **Critical Fix Tasks** (prioritized by risk):
   - T004-T008: [P] Infrastructure (types, utilities, hooks)
   - T009-T013: [P] Library updates (remove Luxon from all lib files)
   - T014-T018: Component updates (error boundaries, loading states)
   - T019-T023: [P] Security & performance (upload validation, aggregations)

3. **Improvement Tasks** (after critical fixes stable):
   - T024-T027: URL state management and sharing
   - T028-T031: Multi-select filters
   - T032-T035: Insights panel

4. **Testing & Polish Tasks**:
   - T036-T041: E2E test updates (6 new scenarios)
   - T042-T044: Documentation updates
   - T045: Performance profiling and optimization

**Ordering Strategy**:
- Dependencies: Setup → Infrastructure → Libraries → Components → Features → Tests
- Parallel execution: Independent files marked [P]
- Sequential: Shared files (page.tsx, types/index.ts)
- Test-first: E2E tests written before implementation where feasible

**Estimated Output**: 45-50 numbered, dependency-ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

**Status**: No complexity violations - all changes maintain existing architecture simplicity.

**Rationale**:
- localStorage is simpler than backend API for MVP
- Error boundaries are React standard, not over-engineering
- Removing Luxon reduces complexity (one less dependency)
- URL state is native Next.js feature, no new library
- Multi-select uses existing filter patterns
- Insights are rule-based calculations, not AI/ML complexity


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [✅] Phase 0: Research complete (/plan command) - COMPLETE
- [✅] Phase 1: Design complete (/plan command) - COMPLETE
- [✅] Phase 2: Task planning approach described (/plan command) - COMPLETE
- [ ] Phase 3: Tasks generated (/tasks command) - READY
- [ ] Phase 4: Implementation complete - PENDING
- [ ] Phase 5: Validation passed - PENDING

**Gate Status**:
- [✅] Initial Constitution Check: PASS
- [✅] Post-Design Constitution Check: PASS
- [✅] All NEEDS CLARIFICATION resolved (none present)
- [✅] Complexity deviations documented (none present)

**Deliverables**:
- [✅] research.md created (6 research topics documented)
- [✅] data-model.md created (10+ new type definitions)
- [✅] quickstart.md created (10 test scenarios)
- [ ] tasks.md ready for generation via /tasks command

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
