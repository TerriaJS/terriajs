#!/bin/sh

# Don't run for greenkeeper branches; there are too many!
if [[ $TRAVIS_BRANCH =~ ^greenkeeper/ ]]; then
    exit 0
fi

set -e
sudo apt-get update
sudo apt-get install -y httpie

# A version of the branch name that can be used as a DNS name once we prepend and append some stuff.
SAFE_BRANCH_NAME=$(printf '%s' "${TRAVIS_BRANCH,,:0:40}" | sed 's/[^-a-z0-9]/-/g')

http POST "https://api.github.com/repos/${TRAVIS_REPO_SLUG}/statuses/${TRAVIS_COMMIT}" "Authorization:token ${GITHUB_TOKEN}" state=pending context=deployment "target_url=${TRAVIS_JOB_WEB_URL}"

# Install gcloud, kubectl, and helm
mkdir bin
cd bin

curl -LO https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-191.0.0-linux-x86_64.tar.gz
tar xzf google-cloud-sdk-191.0.0-linux-x86_64.tar.gz
source ./google-cloud-sdk/path.bash.inc

curl -LO https://storage.googleapis.com/kubernetes-helm/helm-v2.8.1-linux-amd64.tar.gz
tar xzf helm-v2.8.1-linux-amd64.tar.gz
mv linux-amd64/helm helm

export PATH=$PATH:$PWD
cd ..

# Authorize use of gcloud and our cluster
openssl aes-256-cbc -K $encrypted_2ae4d6eff2fd_key -iv $encrypted_2ae4d6eff2fd_iv -in buildprocess/ci-google-cloud-key.json.enc -out buildprocess/ci-google-cloud-key.json -d
gcloud auth activate-service-account --key-file buildprocess/ci-google-cloud-key.json
gcloud components install kubectl --quiet
gcloud container clusters get-credentials terriajs-ci --zone australia-southeast1-a --project terriajs-automated-deployment

# Install some tools we need from npm
npm install -g https://github.com/terriajs/sync-dependencies
npm install request@^2.83.0

# Clone and build TerriaMap, using this version of TerriaJS
TERRIAJS_COMMIT_HASH=$(git rev-parse HEAD)
# !!! REMOVE -b BRANCH AFTER audit-fix IS MERGED INTO TERRIAMAP
git clone https://github.com/TerriaJS/TerriaMap.git
cd TerriaMap
TERRIAMAP_COMMIT_HASH=$(git rev-parse HEAD)
sed -i -e 's@"terriajs": ".*"@"terriajs": "'$TRAVIS_REPO_SLUG'#'$TRAVIS_BRANCH'"@g' package.json
sync-dependencies --source terriajs
git commit -a -m 'temporary commit' # so the version doesn't indicate local modifications
git tag -a "TerriaMap-$TERRIAMAP_COMMIT_HASH--TerriaJS-$TERRIAJS_COMMIT_HASH" -m 'temporary tag'
npm install
npm run gulp build

npm run "--terriajs-map:docker_name=terriajs-ci" docker-build-ci -- --tag "asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
gcloud docker -- push "asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
helm upgrade --install --recreate-pods -f ../buildprocess/ci-values.yml --set global.exposeNodePorts=true --set "terriamap.image.full=asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME" --set "terriamap.serverConfig.shareUrlPrefixes.s.accessKeyId=$SHARE_S3_ACCESS_KEY_ID" --set "terriamap.serverConfig.shareUrlPrefixes.s.secretAccessKey=$SHARE_S3_SECRET_ACCESS_KEY" --set "terriamap.serverConfig.feedback.accessToken=$FEEDBACK_GITHUB_TOKEN" "terriajs-$SAFE_BRANCH_NAME" deploy/helm/terria

cd ..
node buildprocess/ci-cleanup.js

http POST "https://api.github.com/repos/${TRAVIS_REPO_SLUG}/statuses/${TRAVIS_COMMIT}" "Authorization:token ${GITHUB_TOKEN}" state=success context=deployment "target_url=http://ci.terria.io/${SAFE_BRANCH_NAME}/"
