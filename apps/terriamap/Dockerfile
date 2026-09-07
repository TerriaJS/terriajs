# pnpm-workspace-aware image for TerriaMap (terriajs-server serving the built map).
#
# Build CONTEXT must be the repo ROOT: terriamap builds the workspace `terriajs` from
# source, so it needs the root pnpm-lock.yaml / pnpm-workspace.yaml. Build with e.g.:
#   docker build -f apps/terriamap/Dockerfile .
#
# Only `node_modules` comes from `pnpm deploy`: pnpm's own node_modules are symlinks into a
# central store and can't be COPYed directly, so `pnpm deploy` materialises a portable, real
# one. Everything else (wwwroot + config) is copied explicitly, so it stays correct even if a
# `files` field is later added to package.json. If pnpm rejects `deploy`, add `--legacy`.

# develop container
FROM node:24 AS develop

# build container
FROM node:24 AS build
RUN corepack enable
WORKDIR /repo
# terriajs's `prepare` (tsc) and `gulp release` are memory-hungry; cap node's heap so it
# GCs instead of being OOM-killed (exit 137). Ensure the Docker builder has >4GB.
ENV NODE_OPTIONS=--max_old_space_size=4096
COPY . .
RUN pnpm install --filter terriajs-map... --frozen-lockfile
RUN pnpm --filter terriajs-map exec gulp release
# Materialise a portable, real (non-symlinked) node_modules for the runtime stage.
RUN pnpm --filter terriajs-map deploy --prod /prod/app

# deploy container
FROM node:24-slim AS deploy

# terriajs-server registers no SIGTERM/SIGINT handlers, and node:24-slim has no init
# system, so without tini as PID 1, `docker stop` (and Kubernetes' pod termination,
# which works the same way) has nothing to catch the signal - the container just sits
# until the grace period expires and it gets SIGKILLed. tini forwards the signal to
# node and reaps zombies, so shutdown is immediate. Installed as root, before USER
# node, since apt-get needs root.
RUN apt-get update && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

USER node

WORKDIR /app

# Real node_modules from pnpm deploy (the one thing pnpm can't COPY directly)...
COPY --from=build --chown=node:node /prod/app/node_modules node_modules
# ...plus TerriaMap's own runtime files, copied explicitly.
# Without the chown when copying directories, wwwroot is owned by root:root.
COPY --from=build --chown=node:node /repo/apps/terriamap/wwwroot wwwroot
COPY --from=build /repo/apps/terriamap/serverconfig.json serverconfig.json
COPY --from=build /repo/apps/terriamap/index.js index.js
COPY --from=build /repo/apps/terriamap/package.json package.json
COPY --from=build /repo/apps/terriamap/version.js version.js

EXPOSE 3001
ENV NODE_ENV=production
ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD [ "node", "./node_modules/terriajs-server/lib/app.js", "--config-file", "serverconfig.json" ]
