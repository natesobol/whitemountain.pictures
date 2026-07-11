# Homepage Gallery Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every visitor facing technical phrase on the homepage with the approved calm gallery wording, remove the homepage Metadata control, publish the result to GitHub `main`, and deploy it to Cloudflare.

**Architecture:** Keep the existing static generator, catalog data, routes, and client controller. Express the public contract as assertions against `dist/index.html`, then update only the homepage template and document description in `scripts/build.mjs`. The client already treats an absent `status` form field as `all`, so Year and Season filtering continue without a homepage specific controller branch.

**Tech Stack:** Node.js static generator, Vitest, TypeScript, Cloudflare Workers Static Assets, Wrangler, GitHub CLI and Git.

## Global Constraints

- The homepage voice is a patient mountain guide: warm, plainspoken, and lightly reflective.
- Homepage visitors must not see publishing systems, review workflows, camera equipment, indexing, search infrastructure, records, or archival machinery.
- Keep Year and Season controls and remove the homepage Metadata control and both review options.
- Do not change routes, catalog membership, keyboard support, announcements, progressive loading, error recovery, dependencies, animation, or visual assets.
- Work directly on `main` because the user explicitly requested it.
- Publish only after the full release check passes.

---

### Task 1: Lock the Homepage Copy Contract

**Files:**
- Modify: `scripts/verify-dist.mjs`
- Test: `scripts/verify-dist.mjs`

**Interfaces:**
- Consumes: generated homepage HTML at `dist/index.html`
- Produces: a release gate that requires the approved copy and rejects the old visitor facing language

- [ ] **Step 1: Add required and forbidden copy assertions**

Read `dist/index.html` as the existing `home` string. Add these exact collections after the homepage structural assertions:

```js
const requiredHomepageCopy = [
  "Photographs by Nathan Sobol · New Hampshire",
  "Walk slowly through trails, summits, forest light, and changing weather across New Hampshire’s White Mountains.",
  "Begin with 2026",
  "Begin with 2025",
  "Clear filters",
  "Show more photographs",
  "No photographs match these choices.",
  "The gallery could not open the full selection. The photographs already here are still available.",
  "Try again",
  "A quiet way through",
  "There is no right order here.",
  "Choose a year or season, or begin with the photograph that holds your attention.",
  "Keep walking",
  "One photograph leads to another.",
  "Open any image for a closer view, then continue by place, outing, year, or the neighboring frame.",
  "View the full gallery",
];
for (const phrase of requiredHomepageCopy) {
  assert(home.includes(phrase), `Homepage is missing approved gallery copy: ${phrase}`);
}

const forbiddenHomepageCopy = [
  "field archive",
  "metadata-rich",
  ">Metadata<",
  "All records",
  "Review pending",
  "safe location context",
  "camera and lens data",
  "awaiting review",
  "search-engine sitemaps",
  "Reviewed work",
  "Ready for search and sharing",
  "editorial metadata gate",
  "View archive",
];
for (const phrase of forbiddenHomepageCopy) {
  assert(!home.includes(phrase), `Homepage retains technical visitor copy: ${phrase}`);
}
```

Also assert that the homepage form has no `name="status"` control while retaining `name="year"` and `name="season"`.

- [ ] **Step 2: Run the distribution verifier and confirm the contract fails**

Run:

```powershell
npm run verify:dist
```

Expected: exit code 1 with missing approved gallery copy and retained technical visitor copy. This proves the assertions detect the current homepage.

---

### Task 2: Replace the Homepage Presentation Copy

**Files:**
- Modify: `scripts/build.mjs:208-217`
- Test: `scripts/verify-dist.mjs`

**Interfaces:**
- Consumes: the existing `photos`, `homePhotos`, `featured`, and catalog asset values
- Produces: `dist/index.html` with the exact copy from `docs/superpowers/specs/2026-07-11-homepage-gallery-copy-design.md`

- [ ] **Step 1: Update the homepage hero**

Use the approved kicker, lead, and year actions:

```html
<p class="section-kicker">Photographs by Nathan Sobol · New Hampshire</p>
<h1 id="home-title">White Mountains Pictures</h1>
<p>Walk slowly through trails, summits, forest light, and changing weather across New Hampshire’s White Mountains.</p>
```

The action text is `Begin with 2026` and `Begin with 2025`; destinations remain unchanged.

- [ ] **Step 2: Simplify the gallery controls and states**

Delete the complete Metadata label and select. Keep Year and Season unchanged. Replace the visitor text with:

```html
<button class="icon-button" type="reset">Clear filters</button>
<button class="button button-ghost" type="button" data-load-more>Show more photographs</button>
<p>No photographs match these choices.</p>
<button class="button button-secondary" type="button" data-wall-reset>Clear filters</button>
<p>The gallery could not open the full selection. The photographs already here are still available.</p>
<button class="button button-secondary" type="button" data-catalog-retry>Try again</button>
```

- [ ] **Step 3: Replace both explanatory sections**

Use the exact first section:

```html
<section class="intro-band"><div><p class="section-kicker">A quiet way through</p><h2>There is no right order here.</h2></div><p>Choose a year or season, or begin with the photograph that holds your attention.</p></section>
```

Use the exact second section:

```html
<section class="catalog-section"><div class="section-heading"><div><p class="section-kicker">Keep walking</p><h2>One photograph leads to another.</h2></div><a class="button button-secondary" href="/photos/">View the full gallery</a></div><div class="prose"><p>Open any image for a closer view, then continue by place, outing, year, or the neighboring frame.</p></div></section>
```

- [ ] **Step 4: Replace the homepage document description**

Use exactly:

```js
description: "White Mountains photographs by Nathan Sobol, made along the trails, forests, ridges, and summits of New Hampshire.",
```

- [ ] **Step 5: Build and verify the generated homepage**

Run:

```powershell
npm run build
npm run verify:dist
```

Expected: both commands exit 0 and the verifier reports `"status": "ok"`.

- [ ] **Step 6: Run the full release check**

Run:

```powershell
npm run check
```

Expected: typecheck passes, all Vitest tests pass, build succeeds, distribution verification succeeds, and the Wrangler dry run succeeds.

---

### Task 3: Publish and Verify Production

**Files:**
- Commit: `scripts/build.mjs`, `scripts/verify-dist.mjs`, the approved spec, and this plan
- Deploy: generated `dist` through the existing Wrangler configuration

**Interfaces:**
- Consumes: verified local `main`
- Produces: matching GitHub `main` and Cloudflare production deployment

- [ ] **Step 1: Inspect and commit only the intended release files**

Run `git diff --check`, inspect `git diff` and `git status --short`, stage the four intended files, and commit with:

```powershell
git commit -m "refine homepage gallery copy"
```

- [ ] **Step 2: Push `main` to GitHub**

Confirm `gh auth status`, then run:

```powershell
git push origin main
```

Expected: `origin/main` advances to the local commit without a force push.

- [ ] **Step 3: Deploy the verified build to Cloudflare**

Confirm `wrangler whoami`, then run:

```powershell
npm run deploy
```

Expected: Wrangler reports a new production Version ID for `whitemountains-pictures` and the existing apex and `www` routes.

- [ ] **Step 4: Verify the live homepage and routing**

Fetch a cache-busted homepage and assert HTTP 200, every approved phrase, no forbidden phrase, no homepage status control, and links to the hashed CSS and JavaScript assets. Confirm `www` returns 308 to the apex, `/healthz` returns 200, and one referenced hashed asset returns 200.

- [ ] **Step 5: Confirm repository and deployment state**

Confirm the worktree is clean, local `HEAD` equals `origin/main`, and `wrangler deployments status` reports the newly deployed version at 100 percent.
