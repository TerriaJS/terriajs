# 11. Configuration of search providers

Date: 2021-01-19

## Status

Proposed

## Context

Ticket.
https://github.com/TerriaJS/terriajs/issues/5141.

### Intro

The existing approach to the definition of SearchProviders requires the development team's involvement and rebuild of the application, which can be undesired behavior in highly dynamic environments.
It's much better to enable the administrators to maintain the search providers.

## Proposal

- SearchProviders could greatly use the benefits of the new model system used for Catalog.
- Create a simple base Mixin (`SearchProviderMixin`) to attach SearchProviders to the Model system and enable easier creation of new search providers.
- Make SearchProviders configurable from `config.json`.
- Provide sensible defaults for everything.
- Typescript everything.
- Make everything translateable (administrator can specify i18next keys for all names)

## Benefits

- Much easier to implement new search providers.
- Much easier to update existing search providers, `urls` and `keys`.
- Offer administrators an option to decide wheter they want to load group members using `CatalogSearchProvider`.

## Consequences

This is quite a large change and should be thoroughly tested to avoid the possible bugs in the search providers migration.
