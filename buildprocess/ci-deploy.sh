#!/bin/sh
#curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
#chmod a+x kubectl
git clone https://github.com/TerriaJS/TerriaMap.git
cd TerriaMap
sed -i -e 's@"terriajs": ".*"@"terriajs": "'$TRAVIS_REPO_SLUG'#'$TRAVIS_BRANCH'"@g' package.json
npm install
npm run gulp release
#npm run docker-build-local
