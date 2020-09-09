[Placeholder for v7 -> v8 Migration Guide]
# Migration guide
Going from a 7.x.x TerriaJS to 8.0.0 and beyond

## Deprecations

There are a few features in v7 that we are considering deprecating, we’ll have more on this in the near future — some of these include:

* ABS ITT
* Socrata(?)
* WMS region mapping

Reach out to us if you are using these.

## Upgrading to TerriaJS v8.0.0-alpha.47+

Currently TerriaJS v8.0.0 is in alpha because not all the functionality present in version 7 has been ported. However the features that have been ported are production ready and we already serve multiple maps including [The NSW Spatial Digital Twin](https://nsw.digitaltwin.terria.io) && [The QLD Spatial Digital Twin](https://qld.digitaltwin.terria.io) running on TerriaJS v8.0.0-alpha versions.

## Changes for map creators

Map creators who have forked [TerriaMap](https://github.com/TerriaJS/TerriaMap) can upgrade to version 8 by merging the `next` branch. After merging you will also have to:
* Update your catalog JSON files
* Update config.json (TODO: what needs to be changed in config.json?)
* TODO: anything for share JSON? Or will changes to terriajs/terriajs-server cover these cases?

### Updating catalog JSON files

Some properties of various item/group types have changed. We have developed a catalog converter to make it easier for you to upgrade your catalog JSON files to be version 8 compatible, and we have a simple website to run this catalog converter on your JSON files:

https://catalog-converter.terria.io/

The website runs the conversion locally in your browser and no parts of your catalog are sent to any server. 

If you want to run the catalog converter locally or contribute to it you can find the code for the converter at [TerriaJS/catalog-converter](https://github.com/TerriaJS/catalog-converter) and code for the website running the converter at [TerriaJS/catalog-converter-ui](https://github.com/TerriaJS/catalog-converter-ui).

## Changes for developers extending TerriaJS

TerriaJS version 8.0.0 is a rewrite of the model and viewmodel layers in TypeScript and some upgrades to the view layer (see [MVVM](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)).

**This section is similar to [Model Layer](./model-layer.md). Some of the info I've written here should be moved to Model and this should be fairly short, referring to Model Layer for people looking for further details**

### Mixins

A lot of functionality used in various models is written in `Mixin`s. This allows for easy reuse of functionality between models. If any functionality in a current model is needed in another model it should be pulled into a Mixin used by both if possible.

### Model layer Traits system

All `CatalogItem`s/`CatalogGroup`s/`CatalogFunction`s (generally referred to as `CatalogMember`s) now use TerriaJS' Traits system for configuration. The Traits system makes serialisation & deserialisation much easier and `CatalogMember`s use traits to define all configuration options used in catalog JSON files and all configuration serialised in a share JSON blob. The Traits system also merges configuration that comes from multiple sources together, favouring:
* User specified configuration (e.g. from selecting options on a dataset in the workbench UI), over
* Catalog JSON configuration, over
* Automatically derived configuration fetched from a service dynamically (e.g. information from WMS GetCapabilities), over
* Default values (for a limited number of traits, where appropriate)
