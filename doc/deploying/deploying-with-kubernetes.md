This has been tested on Google Kubernetes Engine - it should work with other cluster types, but if you run into problems open an issue.

# Deploy a Basic TerriaMap Instance

From within TerriaMap...

```bash
kubectl create serviceaccount tiller --namespace kube-system
kubectl apply -f deploy/kubernetes/rbac-config.yaml
helm init --service-account tiller
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
    tag: "0.0.1"
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

You can build your own TerriaMap image by changing the `config.docker.name` key in `package.json`, then running `yarn docker-build-prod`.

# Working Locally

If you want to run a local version of TerriaMap then you can use [minikube](https://kubernetes.io/docs/getting-started-guides/minikube/).

```bash
minikube start
eval $(minikube docker-env)

helm init
helm repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator
helm repo update
helm install --name docker-registry -f deploy/helm/docker-registry.yml stable/docker-registry
helm install --name kube-registry-proxy -f deploy/helm/kube-registry-proxy.yml incubator/kube-registry-proxy

yarn docker-build-local

helm upgrade --install -f deploy/helm/example-prod.yml terria deploy/helm/terria
```

This will set you up with helm on your local minikube instance, install a local docker registry that will be pushed to with `yarn docker-build-local` and then installs a chart for terria that will use that docker image. You can keep running `yarn docker-build-local` and deleting the terria-server pod to update it. Keep in mind that you have to run `yarn gulp` to rebuild each time you redeploy. You can modify or copy `example-prod.yml` to change the config.
