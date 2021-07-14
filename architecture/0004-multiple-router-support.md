# 4. Multiple router support

Date: 2020-11-09

## Status

Proposed

## Context

We want to introduce the concept of routing more generally, in the ever
expanding list of things we want to do, including but not limited to:
- ["Story Highlights"](https://github.com/TerriaJS/terriajs/issues/4247)
- [SEO](https://github.com/TerriaJS/terriajs/issues/1757)

An early revision of this was implemented in v7 of terria via
https://github.com/TerriaJS/terriajs/pull/3494 and has been running in
production for over a year without issue on DroughtMap, with proven metrics on
the success of the new architecture introduced.

However.

Traditionally terriajs - and more generally, TerriaMap, has worked well in a
"static hosted" edition (in the extreme sense) - no server side routing
requirements, host it off any web server. Some concerns were raised surrounding
the impact of this new change on the ability to continue doing this long-running
"static hosting" option/feature.

### Options

So far, what I propose is varying the "`Router`" supplied to
`StandardUserInterface` so that we can introduce the notion of proper routing to
the app. The usual default is to reach for BrowserRouter, which leverages the
[HTML5 history
API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to do
routing.

There are a few options that would work for the static hosting scenario.
- `HashRouter`
  - I did an initial implementation with this, except realised that we already
    use hash state in the app to do other things

- `MemoryRouter`
  - No URL representation of the application, but means that users can still
    copy and paste their URL without hitting routing issues if they haven't
    routed a server for a "typical single page app"

## Decision
Vary `Router` by the `experimentalFeatures` config parameter.

## Consequences
* Maintenance of two different routing scenarios
* Continue "static hosting" support
