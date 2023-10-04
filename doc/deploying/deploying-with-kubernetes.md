This has been tested on Google Kubernetes Engine - it should work with other cluster types, but if you run into problems open an issue.

# Deploy a Basic TerriaMap Instance

From within TerriaMap...

```bash
helm upgrade --install -f deploy/helm/example-prod.yml terria deploy/helm/terria
```

# Config Customization

You can customize TerriaMap through helm by either modifying example-prod or creating your own helm config file. Server config is available at `terriamap.serverConfig`, init config at `terriamap.initConfig` and client config at `terriamap.clientConfig`. Changes that you make will be merged with the default values in `deploy/terria/charts/terriamap/values.yaml`.

E.g.

```yaml
global:
    rollingUpdate:
        maxUnavailable: 1
    image:
        tag: "0.0.6"
terriamap:
    clientConfig:
        parameters:
            disclaimer:
            text: "This is a disclaimer"
    serverConfig:
        port: 8080
    initConfig:
        camera:
            north: "1"
            east: "2"
            south: "3"
            west: "4"
```

# Building Your Own Image

You can build your own TerriaMap image. Choose your own `app-name` and `tag` (e.g. `awesome-map:1.0.0`) and put them into the command below:

```bash
docker build -t app-name:tag .
```

# Working Locally

If you want to run a local version of TerriaMap using Kubernetes then you can try one of these applications:

-   [Docker Desktop](https://www.docker.com/products/docker-desktop/): Application with embedded Kubernetes setup for fast and easy app development, [requiring a subscription licence](https://docs.docker.com/subscription/desktop-license/) in most cases for commercial use
-   [Rancher Desktop](https://rancherdesktop.io/): Apache-2.0 alternative to Docker Desktop

Or try a tool recommended in the [official Kuberntes setup documentation](https://kubernetes.io/docs/setup/).

Then, using the same `app-name` & `tag` that you chose when building the image, run:

```bash
docker build -t app-name:tag .

helm upgrade --install -f deploy/helm/example-prod.yml terria deploy/helm/terria --set terriamap.image.full=app-name:tag --set global.image.pullPolicy=Never
```

You can repeat the command `docker build -t app-name:tag .` and delete the terria-terriamap pod to update it, and you can run the above `helm upgrade` command after modifying or copying `example-prod.yml` to change the config.
