#!/bin/sh
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod a+x kubectl
curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get | bash
git clone -b include-release-name https://github.com/TerriaJS/TerriaMap.git
cd TerriaMap
sed -i -e 's@"terriajs": ".*"@"terriajs": "'$TRAVIS_REPO_SLUG'#'$TRAVIS_BRANCH'"@g' package.json
npm install
npm run gulp release
npm run "--terriajs-map:docker_name=terriajs-$TRAVIS_BRANCH" docker-build-local
helm upgrade --install -f deploy/helm/example-prod.yml "terriajs-$TRAVIS_BRANCH" deploy/helm/terria
