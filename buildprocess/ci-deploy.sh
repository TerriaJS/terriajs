#!/bin/sh
mkdir bin
cd bin
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod a+x kubectl
curl -LO https://storage.googleapis.com/kubernetes-helm/helm-v2.8.1-linux-amd64.tar.gz
tar xzf helm-v2.8.1-linux-amd64.tar.gz
mv linux-amd64/helm helm
export PATH=$PATH:$PWD
cd ..

git clone -b include-release-name https://github.com/TerriaJS/TerriaMap.git
cd TerriaMap
sed -i -e 's@"terriajs": ".*"@"terriajs": "'$TRAVIS_REPO_SLUG'#'$TRAVIS_BRANCH'"@g' package.json
npm install
npm run gulp
npm run "--terriajs-map:docker_name=terriajs-$TRAVIS_BRANCH" docker-build-local
helm upgrade --install --recreate-pods -f deploy/helm/example-prod.yml "terriajs-$TRAVIS_BRANCH" deploy/helm/terria
