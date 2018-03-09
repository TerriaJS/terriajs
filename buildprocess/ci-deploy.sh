#!/bin/sh

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

# Clone and build TerriaMap, using this version of TerriaJS
git clone -b include-release-name https://github.com/TerriaJS/TerriaMap.git
cd TerriaMap
sed -i -e 's@"terriajs": ".*"@"terriajs": "'$TRAVIS_REPO_SLUG'#'$TRAVIS_BRANCH'"@g' package.json
npm install
npm run gulp build
git describe
cat version.js


# A version of the branch name that can be used as a DNS name once we prepend and append some stuff.
SAFE_BRANCH_NAME=$(printf '%s' "${TRAVIS_BRANCH,,:0:40}" | sed 's/[^-a-z0-9]/-/g')

npm run "--terriajs-map:docker_name=terriajs-ci" docker-build-ci -- --tag "asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
gcloud docker -- push "asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
helm upgrade --install --recreate-pods --set global.exposeNodePorts=true --set "terriamap.image.full=asia.gcr.io/terriajs-automated-deployment/terria-ci$SAFE_BRANCH_NAME" "terriajs-$SAFE_BRANCH_NAME" deploy/helm/terria

cd ..
npm install request@^2.83.0
node buildprocess/cleanup-ci.js
