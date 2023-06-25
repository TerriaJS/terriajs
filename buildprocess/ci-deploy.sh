#!/bin/sh -x

set -e
set -x

GITHUB_BRANCH=${GITHUB_REF##*/}

# Don't run for greenkeeper branches; there are too many!
if [[ $GITHUB_BRANCH =~ ^greenkeeper/ ]]; then
  exit 0
fi

# A version of the branch name that can be used as a DNS name once we prepend and append some stuff.
SAFE_BRANCH_NAME=$(printf '%s' "${GITHUB_BRANCH,,:0:40}" | sed 's/[^-a-z0-9]/-/g')

gh api /repos/${GITHUB_REPOSITORY}/statuses/${GITHUB_SHA} -f state=pending -f context=deployment -f target_url=${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}

# Install some tools we need from npm
npm install -g https://github.com/terriajs/sync-dependencies
npm install -g yarn@^1.19.0

# Install terriajs dependencies and build it
rm yarn.lock
yarn install
yarn build
rm -rf node_modules

# Clone and build TerriaMap, using this version of TerriaJS
TERRIAJS_COMMIT_HASH=$(git rev-parse HEAD)
cd ..
git clone -b build-just-terriajs https://github.com/TerriaJS/TerriaMap.git
cd TerriaMap

TERRIAMAP_COMMIT_HASH=$(git rev-parse HEAD)
sed -i -e 's@"terriajs": ".*"@"terriajs": "../terriajs"@g' package.json
sync-dependencies --source terriajs
git config --global user.email "info@terria.io"
git config --global user.name "GitHub Actions"
git commit -a -m 'temporary commit' # so the version doesn't indicate local modifications
git tag -a "TerriaMap-$TERRIAMAP_COMMIT_HASH--TerriaJS-$TERRIAJS_COMMIT_HASH" -m 'temporary tag'
rm yarn.lock # because TerriaMap's yarn.lock won't reflect terriajs dependencies
yarn install
yarn gulp copy-terriajs-assets render-index write-version
node buildprocess/bundle.js

pwd

yarn "--terriajs-map:docker_name=terriajs-ci" docker-build-ci -- --tag "asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
gcloud auth configure-docker asia.gcr.io --quiet
docker push "asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
helm upgrade --install --recreate-pods -f ${GITHUB_WORKSPACE}/buildprocess/ci-values.yml --set global.exposeNodePorts=true --set "terriamap.image.full=asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME" --set "terriamap.serverConfig.shareUrlPrefixes.s.accessKeyId=$SHARE_S3_ACCESS_KEY_ID" --set "terriamap.serverConfig.shareUrlPrefixes.s.secretAccessKey=$SHARE_S3_SECRET_ACCESS_KEY" --set "terriamap.serverConfig.feedback.accessToken=$FEEDBACK_GITHUB_TOKEN" "terriajs-$SAFE_BRANCH_NAME" deploy/helm/terria

cd ${GITHUB_WORKSPACE}
node buildprocess/ci-cleanup.js

gh api /repos/${GITHUB_REPOSITORY}/statuses/${GITHUB_SHA} -f state=success -f context=deployment -f target_url=http://ci.terria.io/${SAFE_BRANCH_NAME}/
