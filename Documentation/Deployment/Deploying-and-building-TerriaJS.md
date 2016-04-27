# Deploying and building TerriaJS

If you run into problems, don't forget to check [Problems and Solutions](Problems-and-Solutions.md).

This page explains how to deploy TerriaJS, which is the JavaScript library that powers sites like NationalMap. There are three reasons to do this:

1. You are doing development on TerriaJS itself.
2. You are working on a TerriaJS-based map, but have reached the limits of simple skinning and configuration, and now you need to make some code changes.
3. You are an expert and are building a TerriaJS-based map from scratch.

**If you just want to get your own TerriaJS-based map running on your own machine, stop now**. 

Go and [deploy a copy of National Map](https://github.com/NICTA/nationalmap/wiki/Deploying-a-copy-of-National-Map) instead. That gives you all the scaffolding you need to run a TerriaJS-based map quickly and easily.

## Deploying TerriaJS

Instructions are given for Ubuntu. Steps will be slightly different on other platforms.

### Install dependencies

#### Install Git

`sudo apt-get install -y git-core`
 
#### Install NodeJS

* On Ubuntu: `sudo apt-get install -y nodejs-legacy npm `
* On Windows, download and install the MSI from the npm web site.  
* On Mac OS X, install it via Homebrew.

#### Install Gulp
Gulp is the tool that builds TerriaJS. Install it system-wide, as administrator (Windows 8+) or sudu (Ubuntu / Mac OS X). See also: [Install npm packages globally without sudo on OS X and Linux](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md).


```
sudo npm install -g gulp
npm install
```

### Build TerriaJS

#### Get the TerriaJS code from GitHub

```
git clone https://github.com/TerriaJS/terriajs.git
cd terriajs
```

#### Install TerriaJS's dependencies using npm:

```
npm install
```

#### Build TerriaJS itself

```
gulp
```


To start the TerriaJS node.js server, run:

```
npm start &
```

You can access your TerriaJS instance at [[http://localhost:3002]] in a web browser.

The TerriaJS tests are at [[http://localhost:3002/SpecRunner.html]].

To continuously rebuild when you make changes to the code:

```gulp watch```

## Use your local modifications in your local TerriaJS-based map (`npm link`)

Presumably you want to see the changes you make in a local copy of a TerriaJS-based map such as National Map.

1. After completing the build process, run `npm link` in the TerriaJS directory (presumably called `terriajs`). This sets up a symlink in your global NPM directory. [More details](http://justjs.com/posts/npm-link-developing-your-own-npm-modules-without-tears) (including how to avoid needing sudo).
2. In your map directory (eg, `nationalmap`), run `npm link terriajs`. This replaces the generic `node_modules/terriajs` with a symlink to that symlink.

Summary:

```
cd terriajs
npm link
cd ../nationalmap
npm link terriajs
```

Ensure that the version of TerriaJS is compatible with your TerriaJS-based map (look in `package.json`).

## Updating Build

The following commands are what you would normally run to pull changes from GitHub and build them:

```
git pull --rebase
npm install
gulp
npm start
```