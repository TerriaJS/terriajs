# tooling/terriamap-public — public overlay

`mirror-terriamap.sh` layers `tooling/terriamap-public/` on top of
`apps/terriamap` when it publishes to the standalone public TerriaMap repo.
Overlay files win on path collision, so anything in that directory replaces the
in-monorepo version at publish time. Keep it limited to publishable content only —
anything placed there is published (an explanatory README belongs here in
`tooling/`, not inside the overlay).

The overlay currently holds **only `package.json`**: the standalone version with terriamap's
own yarn workspaces, the `terriajs/terriajs#main` git dependency, and the
`prepare: husky install` hook. Inside the monorepo those are replaced (see
`apps/terriamap/package.json`) so terriamap resolves the local `packages/terriajs`
workspace and defers husky to the repo root. Everything else in `apps/terriamap`
is published verbatim, so no other overlay files are needed.
