const childProcess = require('child_process');
const fs = require('fs');
const request = require('request');

function requestPromise(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}

function getAllBranches(repo) {
    const baseUrl = 'https://api.github.com/repos/' + repo + '/branches';
    const result = [];

    let page = 0;

    function getNextPage() {
        ++page;

        let url = baseUrl + '?page=' + page;
        if (process.env.GITHUB_CLIENT_ID) {
            url += '&client_id=' + process.env.GITHUB_CLIENT_ID;
        }
        if (process.env.GITHUB_CLIENT_SECRET) {
            url += '&client_secret=' + process.env.GITHUB_CLIENT_SECRET;
        }
        return requestPromise({
            url: url,
            headers: {
                'User-Agent': 'TerriaJS CI'
            }
        }).then(pageResponse => {
            const pageOfBranches = JSON.parse(pageResponse.body);
            result.push(...pageOfBranches);

            if (pageOfBranches.length > 0) {
                return getNextPage();
            }
        });
    }

    return getNextPage().then(() => result);
}

function makeSafeName(name) {
    return name.toLowerCase().replace(/[^-a-z0-9]/g, '-').substring(0, 40);
}

function createIngress(branches) {
    return {
        apiVersion: 'extensions/v1beta',
        kind: 'Ingress',
        metadata: {
            name: 'terriajs-ci',
            annotations: {
                'kubernetes.io/ingress.class': 'nginx',
                'ingress.kubernetes.io/ssl-redirect': 'false',
                'ingress.kubernetes.io/force-ssl-redirect': 'false',
                'ingress.kubernetes.io/rewrite-target': '/'
            }
        },
        spec: {
            rules: [
                {
                    http: {
                        paths: branches.map(branch => ({
                            path: '/' + branch.name + '/',
                            backend: {
                                serviceName: 'terriajs-' + makeSafeName(branch.name) + '-terriamap',
                                servicePort: 'http'
                            }
                        }))
                    }
                }
            ]
        }
    };
}

getAllBranches('TerriaJS/terriajs').then(branches => {
    // Update the ingress resource
    const ingress = createIngress(branches);
    fs.writeFileSync('ingress.json', JSON.stringify(ingress, undefined, '  '), 'utf8');
    const kubectlResult = childProcess.spawnSync('kubectl', ['apply', '-f', 'ingress.json'], {
        stdio: 'inherit'
    });
    console.log('kubectl status: ' + kubectlResult.status);

    // Delete helm releases for branches that no longer exist.
    const helmLsResult = childProcess.spawnSync('helm', ['ls', '-q', '-a']);
    console.log('helm ls status: ' + helmLsResult.status);

    const releases = helmLsResult.stdout.toString().split(/[\r\n]/).filter(l => l.indexOf('terriajs-') === 0);
    releases.forEach(release => {
        const branchName = release.substring(9);
        if (!branches.find(b => b.name === branchName)) {
            console.log('Deleting old release ' + release);
            const helmDeleteResult = childProcess.spawnSync('helm', ['delete', '--purge', release], {
                stdio: 'inherit'
            });
            console.log('helm delete status: ' + helmDeleteResult.status);
        }
    });

    // Delete old images that are no longer tagged with valid branches
    const imagesResult = childProcess.spawnSync('gcloud', [
        'container', 'images', 'list-tags',
        'asia.gcr.io/terriajs-automated-deployment/terria-ci',
        '--limit', '999',
        '--format=json'
    ]);
    console.log('images list status: ' + imagesResult.status);
    const images = JSON.parse(imagesResult.stdout.toString());

    images.forEach(image => {
        if (!image.tags.some(tag => branches.find(b => b.name === tag))) {
            console.log('Deleting old docker image ' + image.digest);
            const deleteResult = childProcess.spawnSync('gcloud', [
                'container', 'images', 'delete',
                '-q', '--force-delete-tags',
                'asia.gcr.io/terriajs-automated-deployment/terria-ci@' + image.digest
            ], { stdio: 'inherit' });
            console.log('delete status: ' + deleteResult.status);
        }
    });
    // gcloud container images list-tags asia.gcr.io/terriajs-automated-deployment/terria-ci --limit 999 --format=json


});
