### `npm run hot` hangs, or other crazy things happen

This is usually caused by having two copies of a package, such as a Webpack loader, in different places in your application.  For example, you might have `MyApp/node_modules/sass-loader` and also `MyApp/node_modules/terriajs/node_modules/sass_loader`.

This happens _all the time_ if you use `npm link`, so don't use `npm link`.  It is flawed model that interferes with npm's ability to de-duplicate modules, leading to problems like this and many others.  Instead, use [npmgitdev](https://github.com/TerriaJS/npmgitdev).  Instructions for installing and using `npmgitdev` are on the [Development Environment](development-environment.md) page.

It may also happen if there are version conflicts between packages, or if npm's deduplication has decided to take the day off for unknown reasons.  When in doubt, run `rm -rf node_modules/terriajs/node_modules && npmgitdev install` from your application directory.
