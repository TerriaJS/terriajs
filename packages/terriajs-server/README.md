## TerriaJS-Server

[![Greenkeeper badge](https://badges.greenkeeper.io/TerriaJS/terriajs-server.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/TerriaJS/terriajs-server.svg?branch=master)](https://travis-ci.org/TerriaJS/terriajs-server)

--------------------

This is a basic NodeJS Express server that serves up a (not included) static [TerriaJS](https://github.com/TerriaJS/TerriaJS)-based site with a few additional useful services:

* `/api/v1/proxy`: a proxy service which applies CORS headers for data providers that lack them. Add URLs to config.json to enable them.
* `/api/v1/proj4def`: a proj4 coordinate reference system lookup service.
* `/api/v1/ping`: returns 200 OK.
* `/api/v1/share/X-Y` (GET): uses prefix X to resolve key Y against some configured JSON storage provider (Gist and AWS S3 implemented)
* `/api/v1/share` (POST): stores a piece of JSON with a configured storage provider (Gist implemented)
* `/api/v1/serverconfig`: retrieve (safe) information about how the server is configured.
* All other requests are served from the `wwwroot` directory you provide on the command line, which defaults to `./wwwroot`
* If files `[wwwroot]/404.html` and/or `[wwwroot]/500.html` exist, they will be served for those HTTP error codes.
* Supports very simple authentication via a single username/password included in requests using HTTP basic authentication.
* Proxied services that require HTTP authentication can be proxied by adding credentials to a `proxyauth.json` file.
* It can be run in HTTPS mode, although there are better ways of doing that in production.

Generally, you don't want to manually install TerriaJS-Server. It comes installed with TerriaMap (see below).

### Requirements                                                                                                                                      
                                                                                                                                                        
  - Node.js 22.0.0 or higher

### Stand-alone installation (without serving TerriaMap)

#### Install

1. `git clone https://github.com/terriajs/terriajs-server`
2. `cd terriajs-server`
3. `npm install`

#### Configure

Copy `serverconfig.json.example` to `serverconfig.json` and configure as needed. See comments inside that file. (Comments are allowed; see json5.org).

If you want to proxy authenticated layers, do the same for `proxyauth.json.example`.

#### Run

1. `npm start -- [options] [path/to/wwwroot]`

```
terriajs-server.js [options] [path/to/wwwroot]

Options:
  --help, -h     Show this help.                                       [boolean]
  --version      Show version number                                   [boolean]
  --port         Port to listen on.                [default: 3001]      [number]
  --public       Run a public server that listens on all interfaces.
                                                       [boolean] [default: true]
  --config-file  File containing settings such as allowed domains to proxy. See
                 serverconfig.json.example
  --proxy-auth   File containing auth information for proxied domains. See
                 proxyauth.json.example
  --verbose      Produce more output and logging.     [boolean] [default: false]
```

For example, to run with port 3009:

`npm start -- --port 3009`

To run the server in the foreground, you can do this:

`node . [arguments as above]`

#### Tests

1. Run `npm test`

### Installation with TerriaMap

Just [install TerriaMap](http://terria.io/Documentation). TerriaJS-Server is installed to `node_modules/terriajs-server`, and you can run it manually as `node_modules/terriajs-server ./wwwroot`.

