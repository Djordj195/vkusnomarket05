# vkusnomarket05 — working in this repo

Food/grocery delivery PWA for Кизляр. Next.js 16 (App Router) + React 19 + Tailwind v4 + Zustand + Supabase. Hosted on Vercel.

- **Repo:** `Djordj195/vkusnomarket05`
- **Production:** https://vkusnomarket05.vercel.app/
- **Default branch:** `main` (Vercel auto-deploys to prod on merge)
- **Owner / language:** ВКУСНОМАРКЕТ owner uses Russian, has limited English. All user-facing copy and PR/chat communication is in Russian.

## Tech stack quick reference
- `next@16.2.4` (App Router; **breaking changes from older Next** — read `node_modules/next/dist/docs/` before guessing APIs).
- `tailwindcss@^4` with `@theme` block in `src/app/globals.css` (no `tailwind.config`). Brand tokens:
  - `--color-brand-*` = OneTwoTrip purple (`brand-500` = `#6f46ff`)
  - `--color-accent-*` = yellow pill (`accent-300` = `#ffe53a`, `accent-500` = `#f5b800`)
  - `--color-ink-*` = slate-cool grays
- Server actions everywhere (admin CRUD, weekly toggle, photo upload). Catalog data in Supabase, cart/favorites in `localStorage` via Zustand.
- Mobile-first, hard-capped at `max-w-md` (~448 px). Bottom nav has 5 tabs (`Главная / Скидки / Заказы / Помощь / Профиль`); cart is a floating purple FAB, **not** a nav item.

## Commands
- `npm install`
- `npm run dev` — local dev server (port 3000)
- `npm run lint`
- `npm run build` — also catches type errors. **Always run before pushing.**
- No test runner is configured. Verification is done by lint+build + end-to-end testing on the Vercel deploy.

## Required env vars (already set in Vercel and locally as Devin secrets)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_LOGIN` (default `admin`), `ADMIN_PASSWORD` (real value in `VKUSNOMARKET_ADMIN_PASSWORD` secret)
- Optional: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `SMSRU_API_ID`, `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`

When the app runs without Supabase env vars, it silently falls back to **in-memory data** that resets on cold start. If admin changes mysteriously disappear, check that all 3 Supabase vars are present in the environment you're testing.

## Branch & PR workflow

1. Branch from `main` using `devin/$(date +%s)-<slug>`.
2. Make changes; ALWAYS run `npm run lint && npm run build` before pushing.
3. Push, fetch the PR template, and open the PR.
4. Wait for CI green (3 Vercel checks), then ping the user with the PR + preview URL.
5. **Vercel preview URLs are SSO-protected** — only the repo owner can open them. Do not rely on previews for visual verification; test on **production** after merge.

### Pushing — git proxy may 403, use the PAT fallback

The Devin git proxy intermittently returns `403` when pushing to this repo (fetch usually still works). If that happens:

```bash
# token is in the VKUSNOMARKET_GITHUB_PAT secret (or the older GITHUB_PAT_VKUSNOMARKET alias)
git push "https://Djordj195:${VKUSNOMARKET_GITHUB_PAT}@github.com/Djordj195/vkusnomarket05.git" HEAD:<branch>
```

Do **not** use this URL for `clone` / `fetch` if the proxy is healthy — the proxy is preferred. Only fall back when push fails.

### Opening a PR — `git_pr` may also fail with the PAT

The PAT scope works for git push but not always for the `git_pr` create action (`Resource not accessible by personal access token`). Workaround — call the GitHub REST API directly:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer ${VKUSNOMARKET_GITHUB_PAT}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{"title":"...","body":"...","head":"<branch>","base":"main"}' \
  https://api.github.com/repos/Djordj195/vkusnomarket05/pulls
```

Same goes for posting PR comments (`git_comment` rejects with the same error). Use:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer ${VKUSNOMARKET_GITHUB_PAT}" \
  -H "Accept: application/vnd.github+json" \
  --data-binary @/tmp/comment.json \
  https://api.github.com/repos/Djordj195/vkusnomarket05/issues/<PR_NUMBER>/comments
```

(write the body to `/tmp/comment.json` first; embedded backticks/newlines break inline shell quoting).

The PAT is also limited for branch protection / admin operations. Do not try to merge PRs programmatically — the owner merges manually from his phone.

## Database access for testing/cleanup

The Supabase project is `gjniarjocovurblasvml`. SQL editor: https://supabase.com/dashboard/project/gjniarjocovurblasvml/sql/new

For non-interactive read/write from scripts (cleanup test data, sanity-check counts), hit the REST API with the service-role key:

```bash
# count weekly products
curl -sG "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?is_weekly=eq.true&select=id,slug,name" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

# remove a slug from weekly
curl -sX PATCH "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?slug=eq.<slug>" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"is_weekly": false}'
```

After mutations the Vercel page may still show old data because of `revalidatePath`-cached pages. Either trigger a real admin server action (which calls `revalidatePath` for you) or wait ~60 s for ISR.

Tables of interest: `products`, `categories`, `shops`, `couriers`, `orders`. Migrations live in `supabase/migrations/` — `0003_media_and_category_image.sql` (the public `media` storage bucket + `categories.image` column) **must be applied** before testing photo upload.

## Admin panel access

- URL: `https://vkusnomarket05.vercel.app/admin/login`
- Credentials are configurable via `ADMIN_LOGIN` / `ADMIN_PASSWORD` env vars; the owner's real password is stored as `VKUSNOMARKET_ADMIN_PASSWORD`. The placeholder default in the repo is `admin / vkusno2025` (treat that as a default-only fallback, not a current value).
- After login, admin features:
  - `/admin` — dashboard (orders summary, etc.)
  - `/admin/products` — CRUD (with photo upload — see "File upload" below)
  - `/admin/categories` — CRUD with optional image (overrides emoji)
  - `/admin/shops` — CRUD (cover image)
  - `/admin/couriers` — new-courier form **horizontal at top**, list below
  - `/admin/orders/[id]` — assign courier (top, horizontal), then status (bottom, horizontal). Each block has its own "Сохранить изменения" button which is disabled when no change is pending.
  - `/admin/weekly` — manage "Товары недели" (current items on top with red "Убрать", candidates below with green "Добавить" + search). The public surface is `/weekly` and the deals banner.

## End-to-end testing on production

The standard verification flow after the user merges a PR:

1. Confirm the PR was actually merged: `git(action="view_pr")`. Confirm prod is up: `curl -I https://vkusnomarket05.vercel.app/` → expect HTTP 200.
2. **Resize Chrome to mobile width** before recording so the design renders the way the owner will see it on his phone:
   ```bash
   xdotool search --name "Chrome" | tail -1   # find the Chrome window id
   xdotool windowsize <ID> 412 1000
   ```
   Note: on some WMs the window stays maximized regardless. The app uses `max-w-md` so even at desktop width it renders correctly inside a centered ~448 px column with gray side margins — explain this caveat to the owner if you record at desktop width.
3. Start a recording (`recording_start`) before any visible action.
4. Annotate as you go. Use `It should ...` (Jest-style) test names. Group related checks into a single consolidated assertion ("Sidebar collapsed to icon-only rail"), not granular ones.
5. **Reset the cart at the end** of any test that clicks "В корзину" — go to `/cart` and tap "Очистить". Cart lives in localStorage, so the owner won't see your phantom items, but it's good hygiene if you're recording for them.
6. After stop, write `/home/ubuntu/test-reports/<topic>.md` with inline screenshots (uploaded via `upload_attachment`), post **one** PR comment via the curl fallback above, and message the user with the PR comment link + report file + recording attached.

### Test-data cleanup checklist
After admin testing, restore the world to its pre-test state:
- If you toggled a product weekly → toggle it back.
- If you added a courier → delete it.
- If you uploaded a test photo → set the product image back to its original URL (look it up in git or in the Unsplash CDN URL pattern).
- If you created a test shop → delete it; the public `/shop/[slug]` should 404 again.
- If you changed an order's status/courier → revert.

## File upload testing — Playwright via CDP

The "Загрузить фото" button in admin opens the OS-native file picker, which is **not interactable** from `computer` actions in this VM. Instead, attach Playwright to the running Chrome via its CDP endpoint at `http://localhost:29229` and call `setInputFiles` on the hidden `<input type="file">` that the button proxies to.

Skeleton (Node, run with `node --experimental-default-type=module`):

```js
import { chromium } from "playwright";
const browser = await chromium.connectOverCDP("http://localhost:29229");
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes("/admin/products")) ?? ctx.pages()[0];
const fileInput = await page.$('input[type="file"]');
await fileInput.setInputFiles("/tmp/test.jpg");
// the form's onChange handler fires the upload server action
```

After upload, the page shows a preview from `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/...`. Click "Сохранить изменения" to persist; verify with a hard refresh that the new URL stuck.

On the **owner's phone** the native file picker works correctly — he gets "Сделать фото / Выбрать из галереи / Выбрать файл". The CDP detour is only needed because of the headless desktop browser.

## Theme & layout invariants — do not regress

- Every page is wrapped in a `max-w-md` container; do not introduce full-width layouts.
- Bottom nav (`src/components/layout/BottomNav.tsx`) is exactly 5 tabs in the order `Главная / Скидки / Заказы / Помощь / Профиль`. Active state is `text-brand-600` with a thicker icon stroke.
- The cart **must not** be a nav tab. It's a floating purple pill (`bg-brand-600`) with the basket icon + count, fixed bottom-right, only visible when `cartCount > 0 && pathname !== "/cart"`.
- Hearts (favorite icons) use `rose-500`, not yellow — yellow is reserved for the BrandPill and accents.
- City is hardcoded to "Кизляр" via `CITY_NAME` in `src/lib/constants.ts`.
- The yellow `BrandPill` reads "ВКУСНОМАРКЕТ" — if you find yourself writing the brand name as plain text anywhere, prefer `<BrandPill />` from `src/components/layout/Logo.tsx`.

## Forbidden / be careful

- **Don't push to `main` directly** — always go through a PR.
- **Don't merge PRs** — the owner does that himself.
- **Don't strip or modify user data** in Supabase that wasn't created by your test run. If unsure, list rows first, mutate only the slug/id you just created.
- **Don't delete his Telegram bot config / SMS.ru creds** — even when refactoring related code.
- **Don't add demo / placeholder copy** in user-facing pages. Hints like "Демо-режим", "Подсказка для администратора", "В каталоге уже N товаров…" were explicitly removed in PR #8 and must not come back. The owner will treat any tip-style amber/yellow note as a regression.
- **Don't change the heart icon color back to yellow.** It was deliberately moved to rose for affordance.

## Communication style

- All messages to the user are in Russian.
- The owner works from his phone. He prefers:
  - Short, action-oriented messages.
  - Step-by-step instructions when something requires his action (Vercel/Supabase/GitHub).
  - PR link + preview link + one-line summary; he will click through.
- Always tell him what to do *now* (e.g., "Слейте PR → напишите 'готово' → я протестирую"), not just what's been done.
- After every prod test cycle, post **one** consolidated PR comment, attach the recording, and link the Devin session.
