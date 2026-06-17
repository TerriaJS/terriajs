# 9. Story and catalog routes

Date: 2022-03-10

## Status

Proposed

## Context

### Previous routing approach with React Router

We have been experimenting with a React Router approach to catalog routes paired with pre-rendering in droughtmap. This was not merged because of tricky interactions between mobx state in ViewState and catalog state in React Router. We also decided that catalog app state shouldn't change the URL.

### What are catalog routes?

Catalog routes are routes in the form /catalog/:id that send a user straight to that member within the catalog and rewrite the page url back to the base href of the page when Terria loads. They act like shortcuts to each dataset in a map's catalogue. They are intended to be used in a sitemap, or to link to a specific dataset without a share url.

### What are story routes?

Story routes are routes in the form /story/:story-id that start a story when Terria loads. Story route URLs don't get rewritten back to the base href. These are intended to be used by map creators to publish nice URLs to their official stories, and don't replace share urls or stories created by end users and shared using share urls.

### Why are we adding these routes?

Catalog routes are useful for sitemaps, story routes are useful to provide nicer urls (without hashes, dashes etc.) for stories. Story URLs may be typed out by hand and should be tolerant to adding a trailing slash.

### SEO

While it's not part of this ADR, this ADR leaves future opportunity to enhance the SEO of both of these types of routes through some combination of:

- Sitemaps
- Pre-rendering each route
- Server rendering pages

## Decisions

1. We will only require a backend with SPA routing support for bonus features. The core features (browsing a catalogue, visualising datasets that support CORS in 2D & 3D) will continue to be supported when serving TerriaMap off a static http(s) server.
2. Routes /catalog/:id will load Terria, show users the member ":id" in the catalogue and rewrite the URL to the base href of the page (preserving hash parameters).
3. Routes /story/:story-id will load Terria to a story that will be playing automatically. The URL will not be rewritten and all hash parameters will work as normal.
4. For both /catalog/:id & /story/:story-id routes we will support /catalog/:id/ & /story/:story-id/ as equivalent. When SEO is added we may redirect/rewrite one to the other.

## Consequences

- Routing support added to terriajs by parsing the URL on URL change (and load) and updating the model layer appropriately.
- Apps that want to create official stories will use terriajs-server's SPA options.
