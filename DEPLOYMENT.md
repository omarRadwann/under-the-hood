# GitHub Pages deployment

## Build and publication

The workflow in `.github/workflows/pages.yml` publishes the static export from `main`. It uses Node 24 and the package-manager version pinned in `package.json`. Dependencies come from the committed pnpm lockfile. Model/runtime/content tests and the export's local-link check must pass before deployment.

Enable GitHub Actions as the Pages source in repository settings. The build job can read Pages configuration; only the deployment job receives `pages: write` and `id-token: write`. No repository secret, backend service, or execution API key is required by the application.

`scripts/build-pages.mjs` derives the project prefix from `GITHUB_REPOSITORY`. Set `NEXT_PUBLIC_BASE_PATH` explicitly to override it. Root `*.github.io` repositories use an empty prefix. Next Link prefixes route links; the runtime asset helper prefixes public requests, and bundled CSS font URLs are emitted by Next.js. Every lesson and section has a generated static route. `trailingSlash` emits directory indexes for direct deep links, and `404.html` supplies the missing-page view. `.nojekyll` preserves Next's `_next` assets.

## Local verification of the deployed form

For PowerShell:

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/under-the-hood'
pnpm build:pages
node scripts/check-export.mjs
node scripts/serve-export.mjs
```

Open `http://localhost:3001/under-the-hood/`. This preview deliberately supplies no application-specific response headers or dynamic route fallback. It exercises the same static assets and prefix as a project Pages deployment. The default `pnpm build`/`pnpm start` path continues to support a normal Next.js server.

## Runtime boundaries

The JavaScript/cache runtime runs in a dedicated blob worker created by a hidden, opaque-origin frame. The frame's inline bootstrap has a build-generated SHA-256 CSP hash; its worker inherits the document's `connect-src 'none'` policy. Removing the frame ends its worker ownership. The visible React iframe uses `sandbox="allow-scripts"`, an opaque origin, a nonce-bearing bootstrap, and a restrictive CSP. Neither frame gets same-origin permission or parent storage access. Messages are checked against their source frame, active run ID, protocol, and bounded event shape before rendering.

This preserves the learning sandbox on Pages, which does not supply custom application headers. It is intended for bounded examples, with a parent watchdog and compiler loop budgets; it is not a comprehensive hostile-code service. Do not add credentials or private application data to examples.

Learning state and edited drafts are browser-local. A deployed domain starts its own storage history. Export study data for backup and copy edited code when moving between domains; browser state does not sync automatically.

## Updating and recovery

Push a new commit to `main` to run verification and publish. A failed build leaves the previous deployed version in place. Restore a prior source commit through a new commit and let the same pipeline redeploy; no force push is required. Review the Actions run and `github-pages` deployment environment to identify the published source revision.
The v1.3 workflow also verifies the published release manifest against the exact source revision, requests every published application route/asset, and checks unknown-lesson 404 behavior. Run `APP_URL=<site-base-url> node scripts/check-live.mjs` in a POSIX shell, or set `$env:APP_URL` first in PowerShell. A bounded propagation wait allows the new artifact to become visible; a failed smoke check marks the workflow failed without claiming a successful verification.
