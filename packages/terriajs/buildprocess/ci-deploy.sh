#!/bin/sh

set -e

# Invoked from the monorepo root by .github/workflows/deploy.yml. terriamap now
# lives in this repo at apps/terriamap and consumes the in-repo terriajs via
# the pnpm workspace, so there is NO TerriaMap clone and NO sync-dependencies step
# — it builds directly against packages/terriajs.

GITHUB_BRANCH=${GITHUB_REF_NAME}

# Don't run for greenkeeper branches; there are too many!
if [[ $GITHUB_BRANCH =~ ^greenkeeper/ ]]; then
  exit 0
fi

# A version of the branch name that can be used as a DNS name once we prepend and append some stuff.
SAFE_BRANCH_NAME=$(printf '%s' "${GITHUB_BRANCH:0:32}" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^-a-z0-9]/-/g' -e 's/-*$//')

[[ $SAFE_BRANCH_NAME != $GITHUB_BRANCH ]] && echo "::warning file=packages/terriajs/buildprocess/ci-deploy.sh::Branch name sanitised to '${SAFE_BRANCH_NAME}' for kubernetes resources. This may work, however using branch names less than 32 characters long with [a-z0-9] and hyphen separators are preferred"

gh api /repos/${GITHUB_REPOSITORY}/statuses/${GITHUB_SHA} -f state=pending -f context=deployment -f target_url=${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}

# Build and push the image straight from the pnpm-workspace Dockerfile. It installs the
# workspace, runs `gulp release` with this branch's baseHref, and `pnpm deploy`s a portable,
# real node_modules — all inside the build.
IMAGE="asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
gcloud auth configure-docker asia.gcr.io --quiet
DOCKER_BUILDKIT=1 docker build \
  --build-arg BASE_HREF="/${SAFE_BRANCH_NAME}/" \
  -f apps/terriamap/Dockerfile \
  -t "$IMAGE" .
docker push "$IMAGE"

helm upgrade --install --recreate-pods -f packages/terriajs/buildprocess/ci-values.yml --set global.exposeNodePorts=true --set "terriamap.image.full=$IMAGE" --set "terriamap.serverConfig.shareUrlPrefixes.s.accessKeyId=$SHARE_S3_ACCESS_KEY_ID" --set "terriamap.serverConfig.shareUrlPrefixes.s.secretAccessKey=$SHARE_S3_SECRET_ACCESS_KEY" --set "terriamap.serverConfig.feedback.accessToken=$FEEDBACK_GITHUB_TOKEN" "terriajs-$SAFE_BRANCH_NAME" apps/terriamap/deploy/helm/terria

node packages/terriajs/buildprocess/ci-cleanup.js

gh api /repos/${GITHUB_REPOSITORY}/statuses/${GITHUB_SHA} -f state=success -f context=deployment -f target_url=http://ci.terria.io/${SAFE_BRANCH_NAME}/
