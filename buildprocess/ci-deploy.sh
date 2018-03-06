git clone https://github.com/TerriaJS/TerriaMap.git
cd TerriaMap
sed -i -e 's/"terriajs": ".*"/"terriajs": "$TRAVIS_REPO_SLUG#$TRAVIS_BRANCH"/g' package.json
npm install
npm run gulp release
