# Deploying a Terria Map

If you run into problems, check [TerriaJS's Problems and Solutions](https://github.com/TerriaJS/terriajs/wiki/Problems-and-Solutions).

Instructions are given for Ubuntu. Steps will be slightly different on other platforms.

Note: NodeJS version 0.10.x is **not supported**.

Command | Comment
--------|--------
`sudo apt-get install -y git-core`|Install Git, so you can get the code.
`sudo apt-get install -y gdal-bin`|(Optional) Install GDAL, a large geospatial conversion library used to provide server-side support for a wider range of files types.
`curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -` | (Required for Ubuntu) Prepare to install NodeJS, used to build Terria. The default NodeJS available with Ubuntu 14.04 is too old. On Windows, download and install the MSI from the npm web site. On Mac OS X, install it via Homebrew.
`sudo apt-get install -y nodejs npm` | Install NodeJS (run this on all versions of Linux, including Ubuntu).
`sudo npm install -g gulp`| Install Gulp, which is the actual build tool. Install it system-wide, as administrator (Windows 8+) or sudo (Ubuntu / Mac OS X). See also: [Install npm packages globally without sudo on OS X and Linux](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md).
`git clone https://github.com/TerriaJS/TerriaMap.git` | Get the code
`cd TerriaMap`|
`npm install` | Install the dependencies. This may take a while. [TerriaJS-Server](https://github.com/TerriaJS/terriajs-server) is installed to `node_modules/terriajs-server`.
`gulp` | Build it, using Gulp. This compiles all the code into just a couple of big JavaScript files and moves other assets into `wwwroot/`.
`npm start` | Start the server.

You can access your instance at [[http://localhost:3001]] in a web browser.

The condensed form of all of the above:

```
sudo apt-get install -y git-core gdal-bin nodejs-legacy npm && sudo npm install -g gulp
git clone https://github.com/TerriaJS/TerriaMap.git && cd TerriaMap && npm install
gulp
npm start
```

## Making changes

Want to start tweaking? Proceed to [Customizing Terria](/Documentation/Customizing/README.md).
