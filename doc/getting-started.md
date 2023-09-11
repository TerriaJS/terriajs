The easiest way to get started with TerriaJS is to use [TerriaMap](https://github.com/TerriaJS/TerriaMap). TerriaMap is a full-featured application built on TerriaJS, ready to be customized with your own branding and catalog. It is also a great starting point for more in-depth customization.

Use [Docker](https://www.docker.com/) to start a TerriaMap container:

```bash
docker run -d -p 3001:3001 ghcr.io/terriajs/terriamap
```

You should now be able to access TerriaMap at [`http://localhost:3001/`](http://localhost:3001/).

To clean up and delete the container, you can run:

```bash
docker rm -f [id given by docker run command]
```

### Customizing TerriaMap

Learn about many customization options in [Customizing TerriaMap](customizing/README.md).

For customisations that don't require rebuilding TerriaMap, you can apply changes by mounting your own files into the docker container. E.g. to mount a custom `config.json` file, custom catalog file `my-catalog.json` and a custom `serverconfig.json` file, run the following instead of the above `docker run` command:

```bash
docker run -d -p 3001:3001 \
--mount type=bind,source=$(pwd)/config.json,destination=/app/wwwroot/config.json \
--mount type=bind,source=$(pwd)/my-catalog.json,destination=/app/wwwroot/init/simple.json \
--mount type=bind,source=$(pwd)/serverconfig.json,destination=/app/serverconfig.json \
ghcr.io/terriajs/terriamap
```

Some more advanced customizations will require rebuilding TerriaMap. To do these you will have to follow the [Cloning and Building](customizing/cloning-and-building.md) guide.

### Deploying TerriaMap

You can deploy the container you've made using a container service from a cloud provider or Kubernetes. See [Deploying TerriaMap](deploying/README.md) for more information.

### Without Docker

Follow the [Cloning and Building](customizing/cloning-and-building.md) guide to get started with TerriaMap without docker.
