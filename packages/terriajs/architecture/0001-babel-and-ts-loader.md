# 1. babel & ts-loader - use babel

Date: 2020-07-15

## Status

Accepted

## Context

Mobx build times are slow.

With the addition of our migration away from knockout to mobx, we've bloated out
the time it takes for webpack to build our project by adding ts-loader on top of
babel. That's because we now have TypeScript being compiled to ES6, and then
putting that through to babel to transpile down to the final environment target.
This works, but as we've encountered, leads to really long build times. The
development feedback loop for incremental builds is also affected by this,
further lost with the outdated hot module reloading config.

The introduction of Babel 7 included support for TypeScript. To date, the
support for it covers everything we need to use it in terriajs, including
(partial) namespace support. So we have a few options to dramatically reduce
build times.

- Using _only_ ts-loader is out of the question, as we rely on tools inside the
  babel ecosystem including ~jsx-control-statements~ (removed 2023-10-16) & styled-components to name a
  few.
- Using _only_ babel
- Using babel _with_ ts-loader in `transpileOnly` mode, if there are TypeScript
  features that babel doesn't support.

Going down the babel only route leaves us with a few options to get type
checking back:

- Run a parallel gulp task to run `tsc --noEmit` (+ `--watch` for watch builds)
- Run the typechecking within webpack with something like
  `fork-ts-checker-webpack-plugin`
  - > It's very important to be aware that this plugin uses TypeScript's, not
    > webpack's modules resolution. It means that you have to setup
    > tsconfig.json correctly. For example if you set files: ['./src/index.ts']
    > in tsconfig.json, this plugin will check only index.ts for errors.

Some other information:
https://babeljs.io/docs/en/babel-plugin-transform-typescript#caveats

## Decision

Given the TypeScript support with babel is mature enough for our codebase, using
_just_ babel seems like the best path for now.

`fork-ts-checker-webpack-plugin` essentially gets us the same outcome as running
`tsc` as another gulp task, but keeps us in the webpack space for neatly exiting
when running various build options. The caveat being tsconfig.json needs to
accurately reflect the module resolution defined in any webpack config. Given we
have two notions of `lib` and `test`, this shouldn't be too difficult.

Additionally this will mean not needing to duplicate a type check task through
the various gulp tasks we use.

Finally it doesn't exclude being able to use `ts-loader` down the track, we can
always toggle it back on with ease.

### With these changes

All builds under a I9-9980HK, so there are better single threaded processors out there which will see even greater speeds

#### Fresh build samples

`npm run gulp watch` without these changes

```
Time: 76565ms
```

`npm run gulp watch` with these changes & empty babel loader cache:

```
Time: 40781ms
```

`npm run gulp watch` with these changes & cached babel loader files:

```
Time: 19542ms
```

#### Incremental build samples

Changing a `.ts` file being watched without these changes (Generally 10~15 seconds)

```
Time: 14201ms
```

Changing a `.ts` file being watched with these changes (Generally 500~1000ms)

```
Time: 734ms
```

## Consequences

Any differences in how babel transpiles TypeScript can surface some runtime
issues. The only suspected bug observed so far was a logic error in terriajs -
an incorrect class property re-declaration resulting in a more-correct
transpiled code from babel which highlighted our error.
