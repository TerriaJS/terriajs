# Modifying a TerriaJS-based site
(including National Map)

First, [deploy and build your instance](Deploying a copy of National Map).

## Updating Build

The following commands are what you would normally run to pull changes from GitHub and build them:

```
git pull --rebase
npm install
gulp
npm start
```

## Building National Map against a modified TerriaJS

What if you need to make changes to [TerriaJS](https://github.com/TerriaJS/terriajs) while working on National Map?

In the process above, the [TerriaJS package](https://www.npmjs.com/package/terriajs) is installed to the `node_modules` directory by `npm install`.  Please do not edit TerriaJS directly in the `node_modules` directory, because changes will be clobbered the next time you run `npm install`.  Instead, follow these instructions.

First, set up a TerriaJS dev environment on your system by following the [instructions](https://github.com/TerriaJS/terriajs/wiki/Developers%27-Handbook).  Then, checkout an appropriate version of TerriaJS.  To use the exact version that National Map is expecting, do:

```bash
cd nationalmap
grep terriajs package.json
# will print something like: "terriajs": "0.0.23"
cd ../terriajs
git checkout 0.0.23 # version from above

# Create a new branch to hold your changes.
git checkout -b someBranchName
```

If you're planning to upgrade National Map's version of TerriaJS, you may choose to use `master` instead of the precise version listed in `package.json`.

Next, link your local version of TerriaJS into the global npm package repository:

```
cd terriajs
npm link
```

Then, link the now global `terriajs` package into National Map:

```
cd nationalmap
npm link terriajs
```

This process essentially makes National Map's `node_modules/terriajs` into a symlink to your `terriajs` directory cloned from git.  Any changes you make to TerriaJS will be automatically picked up by National Map.  Don't forget to run `npm install` in TerriaJS after pulling new changes or modifying `package.json`.  You will also need to build TerriaJS (by running `gulp`) if you modify any Cesium shaders or make changes to Cesium code that could affect Cesium's WebWorkers.

To switch National Map back to using the npm version of TerriaJS, do:

```
npm unlink terriajs
npm install
```

## Committing modifications

If you make changes to TerriaJS and National Map together, here's the process for getting them to production.

First, commit your TerriaJS changes to a branch and open a pull request to merge that branch to master. Simultaneously, you may want to make a branch of National Map that uses your modified version of TerriaJS.  To do that, modify National Map's `package.json`.  Where it has a line like:

```
"terriajs": "^0.0.27",
```

Change it to:

```
"terriajs": "git://github.com/TerriaJS/terriajs.git#branchName",
```

Replace `branchName` with the name of the TerriaJS branch you want to use.  You may even use a repository other than `TerriaJS/terriajs` if your branch is in a fork of TerriaJS instead of in the official repository.

Once your TerriaJS pull request has been merged and a new version of the `terriajs` npm module has been published, please remember to update `package.json` to point to an official `terriajs` version instead of a branch in a GitHub repo.

When at all possible, the `package.json` in the `master` branch should point to official releases of `terriajs` on npm, NOT GitHub branches.

## Release Build

If you want to make a minified release build use the commands:

```
npm install
gulp release
npm start
```

## Docker

If you intend to deploy using docker, Dockerfiles have been provided for nationalmap and varnish. There are currently no hosted builds of these images. To build and deploy these docker images locally:

```bash
npm install
gulp release

# Build the application server image.
sudo docker build -t nationalmap/backend .

# Build the varnish image.
sudo docker build -t nationalmap/varnish varnish/

# Start the backend image you built.
sudo docker run -d -p 3001 --name nationalmap nationalmap/backend

# Start the varnish image you built.
sudo docker run -d -p 80:80 --name varnish --link nationalmap:nm nationalmap/varnish
```

This exposes varnish on port 80. Port 3001 for nationalmap remains behind docker's NAT. If you wish to interact with it directly change
```
-p <internal port>
```

with

```
-p <external port>:<internal port>
```

for this component.

There is also a docker_release.sh bash script available that will carry out these commands and post to an AWS instance.  If you are not deploying on AWS you can use the script as a starting point for creating your own script.

```
    Syntax: deploy_release pem_file host_name_or_ip
    example: deploy_release login.pem 54.79.62.244
```

Some handy commands:


```bash
# If you want to avoid using sudo on every docker command (log out and log in after)
sudo groupadd docker
sudo gpasswd -a ${USER} docker

# If you want to open a shell into the running docker container, you can use this command:
sudo docker run -ti nationalmap/backend /bin/bash

# To remove all containers
sudo docker rm $(sudo docker ps -a -q)

# To remove all images
sudo docker rmi $(sudo docker images -a -q)

# To save created images to a tar file
sudo docker save nationalmap/backend > nm_backend.tar
sudo docker save nationalmap/varnish > nm_varnish.tar

# And to load them back in
sudo docker load < nm_backend.tar
sudo docker load < nm_varnish.tar
```

If you're deploying varnish to an environment with less than 25GB on the root file system, or for whatever reason you want to specify the location of the cache file e.g. using an EBS volume, you can set the path for that:

```
docker run -d -p 80:80 --name varnish -v <cache-dir>:/mnt/cache/varnish --link nationalmap:nm nationalmap/varnish
```

The current release with ubuntu 14.04 is rather old and is missing some useful commands.  To update to the most recent of release of Docker, use the commands below from [here](http://www.ubuntuupdates.org/ppa/docker?dist=docker).

```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
sudo sh -c "echo deb https://get.docker.io/ubuntu docker main > /etc/apt/sources.list.d/docker.list"
sudo apt-get update
sudo apt-get install lxc-docker
```

## Documentation

Documentation is automatically generated from the source via jdocs.  It will be place in the public/doc folder.  

It is still very early stages, so the documentation is rather minimal and referencing the source code is probably a better way to determine the best way to use the existing functionality.

You can click [here](http://nationalmap.nicta.com.au/doc/) to reference the documentation on the National Map site.

## Tests / Specs

The test suite is run by opening a web browser on [http://localhost:3001/SpecRunner.html](http://localhost:3001/SpecRunner.html).  The specs themselves are found in the `test/` directory.

## Contributing

All code modifications should be made via GitHub pull requests.  Please do not commit code directly to `master`, even if GitHub allows you to do so.  Pull requests may be merged by anyone with commit access to the repo and who feels qualified to review the changes.  Developers should not merge their own pull requests.

Before merging a pull request:
* Verify the code builds successfully and there are no jshint warnings (run `gulp`).
* Check basic functionality of the map, such as enabling data sources in both 2D and 3D.
* Verify that all specs pass.  If anything you did might be browser-dependent, you should run the specs in all the major supported browsers.
* Review the code itself for quality of implementation and consistency with coding conventions.  Until we have our own coding conventions, we can [use Cesium's](https://github.com/AnalyticalGraphicsInc/cesium/wiki/JavaScript-Coding-Conventions).

Reviewers are welcome to make minor edits to a pull request (e.g. fixing typos) before merging it.  If a reviewer makes larger changes, someone else - maybe the original author of the pull request - should take a look at the changes before the entire pull request is merged.

After you merge a pull request, delete the associated branch if you can.  You will see an option for this on the GitHub pull request page.

## Gulp Tasks

* default - Invoked by running gulp without any arguments, this task invokes the `build` and `lint` tasks.
* `build` - Builds a non-minified version of National Map AND Cesium, together in one JS file (called `public/build/ausglobe.js`). Only the parts of Cesium that we use (directly or indirectly) are pulled in. This task builds both the application and the specs.  This task may take 10 seconds or more, which is the main reason for the next task.
* `watch` - Starts the same as `build` but then it stays running and watches for changes to any National Map, spec, or Cesium source file that was pulled in to `ausglobe.js`. When a change to any of these files is detected, a fast incremental build is automatically kicked off.  The incremental build is much faster than the full rebuild because dependencies between source files are cached.
* `release` - The same as `build` except that it also minifies `ausglobe.js`.  This task should be used when building for production.
* `build-app` - The same as `build`, except it builds just the app, not the specs.
* `build-specs` - The same as `build`, except it builds just the specs, not the app.  Note that the specs do not actually depending on the app, so there is no need to `build-app` if you're just iterating on the specs, even if you change app source files.
* `watch-app` - Watches just the app for changes.
* `watch-specs` - Watches just the specs for changes.
* `release-app` - Does a release build of just the app.
* `release-specs` - Does a release build of just the specs.
* `lint` - Runs jshint on the files in the `src` folder and reports any problems.  Our [.jshintrc](https://github.com/NICTA/nationalmap/blob/master/src/.jshintrc) file is mostly just copied from Cesium at the moment, so suggested changes are welcome.
* `docs` - Generates reference documentation for the files in the `src` folder.