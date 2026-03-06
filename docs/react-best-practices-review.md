# React Best Practices Review

This project is set up to review React and Next.js code against Vercel's React best practices guidance.

## Sources
- Blog: [Introducing React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
- Skill: `/Users/xsolo/.codex/skills/vercel-react-best-practices`
- Skill guide: `/Users/xsolo/.codex/skills/vercel-react-best-practices/SKILL.md`

## Commands
- Full baseline: `pnpm review:react-best-practices`
- Report only: `pnpm review:react-best-practices:report`
- Existing baseline: `pnpm lint`
- Existing baseline: `pnpm build`

If `pnpm` is not on your shell `PATH`, run the same commands through `corepack`, for example:

```text
corepack pnpm review:react-best-practices
```

This repo expects `Node 24.14.0` or newer.

## How To Review With Codex
1. Restart Codex after installing the skill so it is available in fresh sessions.
2. Ask for review with the skill name explicitly.
3. Keep the request focused on findings first.

Example prompt:

```text
Review this change using $vercel-react-best-practices.
Prioritize async waterfalls, bundle size, client localStorage schema,
rerender pressure, and rendering cost. Findings first with file references
and applicable rule ids.
```

## Repo-specific focus
- `components/build-editor-page.tsx`
  - Large client component, rerender risk, and bundle split candidates.
- `hooks/use-app-data.tsx`
  - localStorage schema size, versioning, and context update fanout.
- `components/cosmic-background.tsx`
  - Per-frame canvas work and redraw cost.
- `components/export-scene.tsx`
  - Heavy client rendering and export-only code paths.

## Review order
1. `async-*`
2. `bundle-*`
3. `server-*`
4. `client-*`
5. `rerender-*`
6. `rendering-*`
7. `js-*`
8. `advanced-*`
