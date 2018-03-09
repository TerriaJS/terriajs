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

function createIngress(branches) {
    const dnsNameRegex = /^[-a-z0-9]+$/i;
    const branchesWithValidNames = branches.filter(branch => dnsNameRegex.test(branch.name));
    const branchesWithInvalidNames = branches.filter(branch => !dnsNameRegex.test(branch.name));

    if (branchesWithInvalidNames.length > 0) {
        console.log('The following branches have invalid names and will be ignored:');
        branchesWithInvalidNames.forEach(branch => {
            console.log('  ' + branch.name);
        });
    }

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
                        paths: branchesWithValidNames.map(branch => ({
                            path: '/' + branch.name + '/',
                            backend: {
                                serviceName: 'terriajs-' + branch.name.toLowerCase() + '-terriamap',
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
    const ingress = createIngress(branches);
    fs.writeFileSync('ingress.json', JSON.stringify(ingress, undefined, '  '), 'utf8');
    const result = childProcess.spawnSync('kubectl', ['apply', '-f', 'ingress.json'], {
        stdio: 'inherit'
    });
    console.log(result.status);
});
