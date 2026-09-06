# Hirely Frontend Agent & Developer Guide

This guide applies to human contributors and AI coding agents working in `JobPlatfrom-Frontend`.

## 1. Engineering Principles

- **Understand before changing:** Search for existing components, hooks, API modules, routes, types, and styles before adding a new pattern. Read the nearest owning code and state a short implementation hypothesis for non-trivial work.
- **KISS:** Prefer the smallest clear solution that fits the existing architecture. Avoid clever code and unnecessary architectural changes.
- **YAGNI:** Do not add speculative features, configuration, abstractions, dependencies, or compatibility layers without a current requirement.
- **DRY:** Reuse shared UI, query hooks, API clients, types, utilities, and design tokens. Extract code only when the reuse is real and the abstraction makes the code clearer.
- **SOLID in a React context:** Keep components and hooks focused, depend on stable interfaces, keep modules open to extension without modifying unrelated behavior, and avoid abstractions that force unrelated consumers to depend on each other.
- **Composition over inheritance:** Build behavior by composing components and hooks. Do not create class hierarchies for UI reuse.
- **Single source of truth:** Keep server state in TanStack Query, authentication in `AuthContext`, and local interaction state close to the component that owns it. Do not copy the same state into several layers.
- **Explicit over implicit:** Prefer descriptive names, typed contracts, predictable control flow, and small pure functions over hidden side effects.
- **Minimal production-ready changes:** Keep edits scoped to the requested behavior. Do not mix unrelated cleanup or refactoring into feature work.
- **Leave the code cleaner:** Remove dead imports and unreachable code introduced by a change. Do not leave duplicate implementations or old aliases behind.

## 2. Stack and Structure

This is a Vite application using React 19, TypeScript, React Router, Axios, and TanStack React Query.

```text
src/
├── api/                    # Axios client, endpoint modules, and API types
├── components/
│   ├── jobs/               # Job-domain components
│   ├── layout/             # App shells, navigation, and route guards
│   ├── screening/          # Resume-screening components
│   └── ui/                 # Reusable domain-agnostic UI primitives
├── context/                # Cross-cutting client state, currently auth
├── hooks/queries/          # TanStack Query hooks by domain
├── pages/                  # Route-level screens by role or feature
├── utils/                  # Small pure helpers
├── App.tsx                 # Route composition and auth loading gate
└── main.tsx                # Providers and global CSS entrypoint
```

### Dependency boundaries

- Pages compose layouts, components, query hooks, contexts, and utilities.
- Domain components may use domain hooks and types, but should not own HTTP details.
- `components/ui` stays domain-agnostic and reusable.
- Query hooks own server-state reads, mutations, query keys, and invalidation.
- `api` owns Axios transport and endpoint request/response mapping.
- `context` is for cross-cutting client state, not a replacement for React Query.
- Utilities are pure and dependency-light; they must not contain API calls or React state.
- Avoid circular dependencies, especially between pages, components, and API modules.

## 3. TypeScript and React

- Keep TypeScript strict and do not use `any`. Improve the relevant type in `src/api/types.ts` or the owning module instead.
- Type component props, API requests, API responses, and meaningful state explicitly. Use discriminated unions when states have different shapes.
- Prefer function components and hooks. Use composition rather than inheritance.
- Keep JSX declarative. Move complex calculations and business rules into named pure helpers or domain hooks.
- Use `useEffect` only to synchronize with an external system. Do not use it for derived values or ordinary event handling.
- Do not add `useMemo` or `useCallback` by default. Add memoization only for a measured performance problem or a required stable-reference contract.
- Keep imports at the top, remove unused imports, and preserve the existing `@/` import alias.
- Never hide problems with broad type assertions, empty catches, disabled checks, or ignored errors.

## 4. Routing and Authentication

- Add routes in `src/App.tsx` using the existing `AppLayout`, `GuestLayout`, `RequireAuth`, and `GuestOnly` patterns.
- Enforce role access at the route boundary. Hiding a navigation item is not authorization.
- Preserve the existing role values: `ADMIN`, `SEEKER`, and `EMPLOYER`.
- Keep token handling inside `src/api/client.ts` and `AuthContext`. Feature code must use `useAuth()` rather than reading tokens or `localStorage` directly.
- When changing protected behavior, verify unauthenticated access and access by the wrong role.

## 5. API and Server State

- Put endpoint calls in the appropriate module under `src/api` and reuse the configured Axios client.
- Do not create Axios instances or make HTTP requests directly inside pages and presentational components.
- Keep request and response shapes typed and update the API contract types when the backend changes.
- Put React Query options in the relevant module under `src/hooks/queries`.
- Use stable domain-readable query keys and invalidate related queries after successful mutations.
- Do not duplicate server data in component state unless it is an intentional draft or optimistic value.
- Treat API data as untrusted: handle loading, empty, success, partial, and error states.
- Show actionable errors without exposing tokens, credentials, or unnecessary sensitive data.

## 6. UI, Accessibility, and Styling

- Follow [design-system.md](design-system.md), `src/index.css`, and neighboring component styles before introducing new visual rules.
- Preserve the established monochrome and amber visual language, typography, spacing, radius, border, and status tokens.
- Prefer existing UI primitives and CSS modules. Avoid duplicated CSS and arbitrary one-off values.
- Use semantic HTML first. Interactive controls need accessible names, keyboard support, visible focus states, and sufficient contrast.
- Do not rely on hover alone. Keep dialogs, forms, tables, status messages, and navigation usable with keyboard and screen readers.
- Keep layouts usable on narrow and wide screens. Prevent text, controls, tables, and dialogs from overlapping or overflowing.
- Use existing `react-icons` icons when appropriate and provide labels or tooltips for unfamiliar icon-only actions.
- Keep business workflows clear: provide loading, empty, error, retry, pending mutation, and destructive-action confirmation states where relevant.

## 7. Security and Environment

- Use `VITE_API_URL` for the backend API base URL. Do not hard-code environment-specific URLs.
- Treat every `VITE_*` value as public. Never put secrets, private tokens, passwords, or credentials in client-side environment variables.
- Never commit `.env` files or log authentication tokens and sensitive user, application, resume, or message data.
- Frontend route guards improve user experience; backend authorization remains the security boundary.

## 8. Workflow and Validation

Before editing:

1. Search for an existing implementation and read the nearest owning module.
2. Identify the smallest layer that directly controls the behavior.
3. Make the smallest coherent change and preserve unrelated working-tree changes.

After editing, run the narrowest useful validation first, then build when practical:

```bash
npm run build
npm run dev
npm run preview
```

The project currently has no `lint` or `test` script. Do not claim either check passed unless it is added to `package.json` and actually run.

For UI changes, verify the affected route at mobile and desktop widths, including relevant loading, empty, error, keyboard-focus, and auth states.

## 9. Completion Checklist

- Existing patterns and the owning code path were checked.
- The change follows KISS, YAGNI, DRY, SOLID, and composition-over-inheritance principles.
- Types and API contracts are explicit; no new `any` or hidden errors were introduced.
- Server state, auth state, and local UI state remain in their proper owners.
- Loading, empty, error, and pending mutation states are handled.
- Route and role boundaries remain enforced.
- Accessibility, responsive behavior, and design-system consistency were considered.
- `npm run build` passes, or any failure is reported accurately.
