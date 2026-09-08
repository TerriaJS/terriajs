# This Dockerfile builds the terriajs-map workspace out of the whole monorepo,
# so it must be built with the repo root as the build context, e.g.:
#   docker build -f apps/terriamap/Dockerfile .

# develop container
FROM node:24 AS develop

# build container
FROM node:24 AS build
USER node

WORKDIR /app

COPY --chown=node:node . /app

RUN yarn install --frozen-lockfile --network-timeout 1000000
RUN yarn workspace terriajs-map gulp release

# node_modules above still includes devDependencies (webpack, gulp, typescript, terriajs
# itself, etc.) - yarn classic's --production flag is a known no-op in workspaces
# projects, so it can't prune those out. Instead, reuse deploy/docker/create-docker-context.js
# (the same tool the "real" CI build uses) to walk the production `dependencies` closure
# only and write it out as a dereferenced tarball - "dereferenced" meaning the yarn
# workspaces symlinks (e.g. node_modules/terriajs-server -> ../packages/terriajs-server)
# are resolved to real copies, so the result is self-contained and safe to COPY into the
# deploy stage below without dragging packages/ along too.
RUN cd apps/terriamap && node deploy/docker/create-docker-context.js --output /tmp/terriamap-context.tar.gz
# create-docker-context.js always writes its own (unused, --dockerfile-flavoured)
# Dockerfile into the extracted context alongside the actual app files - drop it so a
# single COPY below can take the whole directory as-is.
RUN mkdir -p /tmp/terriamap-context \
  && tar -xzf /tmp/terriamap-context.tar.gz -C /tmp/terriamap-context \
  && rm /tmp/terriamap-context/component/Dockerfile

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

# Without the chown when copying directories, files are owned by root:root.
COPY --from=build --chown=node:node /tmp/terriamap-context/component/ .

EXPOSE 3001
ENV NODE_ENV=production
ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD [ "node", "./node_modules/terriajs-server/lib/app.js", "--config-file", "serverconfig.json" ]
