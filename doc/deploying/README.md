This section explains how to deploy and maintain production (and production-ish) versions of TerriaJS applications like TerriaMap. Before tackling this section, read [Getting Started](../getting-started.md) to learn how to build and run TerriaMap locally.

Deploying TerriaMap itself:

- [Deploying TerriaMap](deploying-terriamap.md): General instructions for deploying TerriaMap in almost any environment.
- [Deploying to AWS](deploying-to-aws.md): Deploy TerriaMap to [Amazon Web Services (AWS)](https://aws.amazon.com/).
- [Deploying with Kubernetes](deploying-with-kubernetes.md): Deploy TerriaMap using [Docker](https://www.docker.com/) and [Kubernetes](https://kubernetes.io/).

Deploying other services for use with TerriaJS:

- [Setting Up a Region Mapping Server](setting-up-a-region-mapping-server.md): Set up a server for use with TerriaJS's region mapping feature.
- [Setting Up Geoserver](setting-up-geoserver.md): Configure [GeoServer](http://geoserver.org/) for effective use with TerriaJS.

Using a TerriaMap in other applications:

- [Using as a CKAN Previewer](using-as-a-ckan-previewer.md): Use TerriaJS as a previewer for geospatial data in a [CKAN](http://ckan.org/) site.
- [Controlling with URL Parameters](controlling-with-url-parameters.md): Control a TerriaJS application by passing it URL parameters. This is powerful because it enables another site to launch or embed a customized map with little or no code to write.
- [Controlling in an &lt;iframe&gt; or Popup](controlling-in-an-iframe-or-popup.md): Embed a TerriaJS application in iframe or pop it up in a separate window, and control it by posting it cross-window messages.

Special deployment configurations:

- [Running TerriaMap through a reverse proxy](running-through-reverse-proxy.md): How to configure Terria to work correctly when running through a reverse proxy that performs path rewriting to prefix a path to URLs. E.g. hosting a map to be accessed at http://example.com/my/terriamap/
