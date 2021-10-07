# Traits in Depth

The Traits system is Terria's way of managing a priority order for state. For example, we might have a default opacity property from a config file that should be overriden by a user provided value. This article will go through how Traits are made, how the priority system works and how updates happen in the UI.

## Making Traits
![Making Traits](./img/making_a_trait.png)

For base traits such as `BaseMapsTraits`, we extend ModelTraits. However when composing multiple traits, we use the `mixTraits` function. For example, `ArcGisTerrainCatalogItemTraits` is composed out of `UrlTraits, MappableTraits, CatalogMemberTraits`.

When creating a new property within a Traits class, we use [decorators](https://babeljs.io/docs/en/babel-plugin-proposal-decorators) to ensure that the field takes part in the Traits system.


## Stratum order model
![Stratum order model](./img/stratum.png)
Stratums are how Terria determines which value a Trait should resolve to. There are 5 categories of Stratum:

1. Defaults (lowest priority)
2. Loadable
3. Underride
4. Definition
5. Override
6. User (highest priority)

### Default Stratum
This is the lowest priority stratum best thought of as a sensible fallback value. These should only be used in Trait definitions. 

### Loadable Stratum
This is the priority level for things which require fetching from a server.

### Underride Stratum
When loading data from external sources, we might want to set values at a lower priority. For example, if a field exists both at a group level and at an individual member level. We might want to set the value to underride at the group level so that the value can be overriden at the individual member level.

### Definition Stratum
This is the priority level we should use for values loaded from JSON initialisation (catalog) files. For more details, look at [intilization-files](../customizing/initialization-files.md).

### Override Stratum
This is the priority level we use when we want to override a configuration value that isn't a result of a user interaction.

### User Stratum
This is the highest priority stratum. We use this when a user explicitly sets some value and we want that value to override the values loaded through configuration.

## What happens at runtime
![Runtime](./img/runtime.png)

To start, let's assume that we have an `opacity` trait with a value of 0.5 loaded through configuration. As it is loaded through configuration, it is placed within the `Definition` stratum.

When a user interacts with an opacity slider and sets its new value to 0.42, `setTrait(CommonStrat.user, "opacity", 0.42)` is invoked within an [action](https://www.mobxjs.com/refguide/action.html). This triggers the [computed](https://www.mobxjs.com/refguide/computed-decorator.html) value to be recalculated and the new value of `0.42` is picked up as the value in the User stratum has a higher priority than the Definition stratum.

As the computed value is updated, other parts of the UI that observe that value are automatically rendered again reflecting the updated value.
