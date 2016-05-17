## Cannot find module 'terriajs-cesium/wwwroot'

> My app depends on a custom build of TerriaJS via a GitHub URL, but when I `npm install` it fails with something like:
> 
> `Error: Cannot find module 'terriajs-cesium/wwwroot' from '/home/kevin/github/nationalmap/node_modules/terriajs'`

This is caused by an npm bug / quirk where it doesn't necessarily finish installing all of a package's dependencies before invoking the package's `postinstall` script.  See [npm/npm#6926](https://github.com/npm/npm/issues/6926).  The workaround is easy: run `npm install` again.

### `EMFILE` error

If you get an `EMFILE` error while running gulp, you may need to increase the number of files that your system allows to be open simultaneously:

```
ulimit -n 2048
```

### `ENOSPC` error

If you get an ENOSPC error running gulp watch then enter the following command to increase the number of files that can be watched.

```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```





