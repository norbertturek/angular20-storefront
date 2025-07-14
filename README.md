# Storefront

The project is based on **Angular 20+** – modern, modular, standalone, signals, OnPush, lazy loading, typed, DRY, and follows the best frontend practices.

## Architecture and conventions
- Modularity: layers `core/`, `features/`, `shared/`, `ui/`.
- Standalone components, signals, computed, effect, OnPush, DI via `inject`.
- Naming: PascalCase for classes, camelCase for variables, consistent suffixes (`.component.ts`, `.service.ts`, `.spec.ts`).
- Template syntax: modern Angular 20+ (`@if`, `@for`, `@switch`).
- No legacy APIs (`ngModule`, `@Input`, `@Output` – everything via signals).

## Development server

To start a local development server:

```bash
ng serve
```

The app is available at `http://localhost:4200/`. Hot reload works automatically.

## Building

To build the project (production-ready build):

```bash
ng build
```

Artifacts will be in the `dist/` directory. By default, the build is optimized for production.

## Tests

### Unit tests

```bash
ng test
```

Tests are run with [Karma](https://karma-runner.github.io) or [Jest] (if configured). Recommended coverage: at least 80% of the code.

### End-to-end (e2e) tests

The project does not include e2e by default – recommended tools: [Cypress](https://www.cypress.io/), [Playwright](https://playwright.dev/).

### Linting and formatting

Recommended tools: ESLint, Prettier. Add to CI/CD.

### Coverage

To generate a code coverage report:

```bash
ng test --code-coverage
```

## Security and production
- Input validation, error sanitization, no unsafe HTML.
- Recommended: dependency audit (`npm audit`), penetration tests, security checklists.
- Make sure the production server has CSP, HSTS, rate limiting, monitoring.
- Add monitoring, production error logging, backup policy.

## CI/CD and deployment
- Recommended: CI/CD pipeline (tests, lint, build, deploy, coverage badge).
- Document environment variables, deployment process, production checklist.
- Example: GitHub Actions, GitLab CI, Vercel, Netlify, Docker.

## Additional resources
- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Angular 20+ Standalone Components](https://angular.dev/guide/standalone-components)
- [Angular Signals](https://angular.dev/reference/signals)

---

**The project is compliant with the latest Angular 20+ standards and best frontend practices.**
