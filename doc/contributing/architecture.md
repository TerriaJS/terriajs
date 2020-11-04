TerriaJS is usually used in a single-page web application to provide mapping and catalog exploration capabilities.  It is written in ECMAScript (JavaScript) 2015+ and compiled to ECMAScript 5 in order to run in any relatively modern web browser, including Internet Explorer 9 or later.  Some features, such as 3D and vector tile region mapping, require more recent browsers, but TerriaJS can be expected to degrade gracefully in older browsers by disabling unsupported features or informing the user of the limitations of their browser. 

## Layers

TerriaJS has a number of subdirectories of the `lib` directory, each of which corresponds to a conceptual layer in the design of TerriaJS.  The layers are:

| Name | Purpose |
|------|---------|
| ThirdParty | This directory contains third-party code that is not available via npm packages for whatever reason. |
| Core | Low-level utility classes and functions that don't depend on a UI toolkit (i.e. React) or a mapping library (i.e. Cesium or Leaflet). |
| Map | Classes and functions to work with or extend a mapping library (i.e. Cesium or Leaflet). This layer should not depend on a particular UI toolkit (i.e. React). |
| Charts | Similar to the `Map` layer, except for charting instead of mapping.  This depends on the charting library (D3) but not on React. |
| Models | This is heart of TerriaJS.  Classes and functions in this layer know how to interface with catalog servers, map servers, and geospatial data formats.  Most of the logic of a TerriaJS application is found in this layer.  However, it does _not_ depend on React. |
| ViewModels and ReactViewModels | Contains classes and functions that are closely associated with the UI but cannot be described as React components or views.  These two directories are separate mostly for historical reasons; there is little practical difference between them. |
| ReactViews | This is the React-based user interface of TerriaJS.  All of the React components are found in this layer. |

## User interface

TerriaJS uses the [React](https://reactjs.org/) library as the basis for its user interface.  The top-level entry point is [StandardUserInterface.jsx](https://github.com/TerriaJS/terriajs/blob/master/lib/ReactViews/StandardUserInterface/StandardUserInterface.jsx).  It is expected that most applications will use this standard user interface, but a sophisticated TerriaJS application could use its own version instead in order to allow extreme customization of the interface.

For styling, we use [Sass](http://sass-lang.com/) in CSS modules loaded via the Webpack `css-loader`, meaning that each React component imports its own local CSS styles from a `.scss` file.

The user interface is meant to be a thin layer with minimal domain-specific logic.  Ideally, all domain-specific logic would reside in the `Models` layer or perhaps in the `ViewModels` layer.  This approach allows the UI to be replaced (including by a user of TerriaJS rather than its developers) without needing to re-implement large chunks of TerriaJS logic.  In fact, the entire user interface can be viewed as optional.  A TerriaJS-based application could replace it with its own custom UI.

## Observables and ObserveModelMixin

Virtually all TerriaJS state is stored in instances of classes in the `Models` and `ViewModels` layers.  Many changes to this state are initiated by actions in the user interface.  For example, the user clicks an `Add to Map` button and a number of state changes take place that eventually cause the catalog item to appear on the map.

Some changes, however, come from elsewhere.  For example, when the user drags a JSON catalog file onto the map, this may cause any number of changes to objects in the `Models` layer.  In addition, the `Models` layer itself is usable as an API for TerriaJS.  Developers can add custom user interface components or other functionality that manipulate the objects in the `Models` layer.  It's important that the user interface update to reflect the new state, whether the state change was initiated by the core TerriaJS UI or not.

To that end, most of the properties of objects in the `Models` and `ViewModels` layers are observable.  Near the bottom of the constructor of most model objects ([UrlTemplateCatalogItem](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/UrlTemplateCatalogItem.js) for example), you'll see a line like this:

```
knockout.track(this, ['minimumLevel', 'maximumLevel', 'attribution', 'subdomains', 'tileDiscardPolicy']);
```

`knockout.track` transforms each of the named properties on the given object (`this` in this case) into an observable property.  A Knockout observable property is just like a normal property; you can get and set its value as normal.  On top of that, however, an observable property raises an event when it changes.  For example, if we have a `UrlTemplateCatalogItem` instance in a variable named `urlTemplateCatalogItem`, we can subscribe to its `minimumLevel` property like this:

```
knockout.getObservable(urlTemplateCatalogItem, 'minimumLevel').subscribe(function() {
    alert('minimumLevel changed!');
});
```

Many model classes also define computed properties, which are defined using either `overrideProperty` or `knockout.defineProperty`.  Computed properties have a getter and optionally a setter.  The getter is invoked once the first time the property is accessed and the value is memoized (cached).  Further accesses of the property will get the memoized value.

However, Knockout automatically keeps track of the set of observables (including other computed observables) that were accessed during the execution of the getter.  If any of _those_ properties change, the computed observable's getter will be invoked again and the new value memoized.  This new invocation may access different observables properties than it did the first time around, and it is those new properties that will trigger any future re-evaluations of the computed property.  We can subscribe to change notification on computed properties in the same way we subscribe to regular observable properties.

It's rarely necessary to explicitly subscribe to an observable, though.  In the React components in the TerriaJS user interface, we use a React mix-in called [ObserveModelMixin](https://github.com/TerriaJS/terriajs/blob/master/lib/ReactViews/ObserveModelMixin.js).  When this mix-in is included in a component, the React `render` method acts a bit like a computed observable.  It automatically keeps track of all the observables that were read in the course of rendering the component.  If any of them change, the component will be automatically re-rendered.

With `ObserveModelMixin`, in most cases it's not necessary to think very much about the TerriaJS state when developing the UI.  Just write your `render` method as a pure function that produces virtual DOM nodes from the current state of the application, and rest assured that your `render` method will be called again if that state ever changes in a way that might affect what is shown to the user.

For more details of Knockout observables, see [Knockout-ES5](http://blog.stevensanderson.com/2013/05/20/knockout-es5-a-plugin-to-simplify-your-syntax/) as well as the main [Knockout documentation](http://knockoutjs.com/documentation/introduction.html).

It may seem a bit stange that we're using Knockout, which is itself a user interface framework, in a library that uses React for its user interface.  In fact, we're not using the UI or DOM manipulation parts of Knockout at all.  We're only using it as an observable library.  Knockout's observables are feature rich and well tested, and make a great complement to React when paired with our `ObserveModelMixin`.

## Major Components in Models

To help understand the code in Models, here is a summary of some of the major components of TerriaJS:

### [Terria](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/Terria.js)

The root of the TerriaJS application state. A TerriaJS-based application typically has only one `Terria` instance, though it is possible to have more in unusual situations.  All other objects can generally be found via this instance.

### [Catalog](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/Catalog.js)

The TerriaJS catalog, built up from JSON init files as described in the [Customizing](../customizing/README.md) section.  The `Catalog` is what you're looking at when you press the `Add data` button the UI.  It is accessible from the `catalog` property on the `Terria` instance.

### [NowViewing](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/NowViewing.js)

Also known as the Workbench, this is shown in the panel on the left side of the UI, under the Add Data button.  This is the set of all enabled catalog items.  When the `isEnabled` property is set to true on a `CatalogItem`, it will appear here.  It is accessible from the `nowViewing` property on the `Terria` instance.

### [CatalogMember](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/CatalogMember.js)

This is the base class for everything in the catalog, including `CatalogGroup`, `CatalogItem`, and `CatalogFunction`.

### [CatalogGroup](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/CatalogGroup.js)

A group of items in the catalog, shown as a folder in the UI.  The `CatalogGroup` class itself has a fixed set of items it holds, but derived classes can and do dynamically load their list of items from a remote server.  For a list of available catalog groups, see [Catalog Groups](../connecting-to-data/catalog-groups.md).

### [CatalogItem](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/CatalogItem.js)

A catalog item can be enabled by settings its `isEnabled` property to `true`, at which point it appears in the Now Viewing / Workbench.  Usually an enabled catalog item also has a representation on the map and / or on the chart panel, though this is not strictly required.  For a list of available catalog items, see [Catalog Items](../connecting-to-data/catalog-items.md).

### [CatalogFunction](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/CatalogFunction.js)

Unlike a `CatalogItem`, a `CatalogFunction` cannot be directly enabled.  Instead, the user supplies parameters to the function and invokes it, and the result is a `CatalogItem` that is shown on the Workbench.  A Web Processing Service (WPS) is an excellent example of a `CatalogFunction`.  For a list of available catalog functions, see [Catalog Functions](../connecting-to-data/catalog-functions.md).

### [GlobeOrMap](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/GlobeOrMap.js)

The base class for a map view.  TerriaJS currently includes derived classes for a 3D view based on [Cesium](https://cesiumjs.org/) ([Cesium](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/Cesium.js) class) and a 2D view based on [Leaflet](http://leafletjs.com/) ([Leaflet](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/Leaflet.js) class).

## Mapping

All mapping in TerriaJS happens through the abstractions provided by [Cesium](https://cesiumjs.org/).  Whether you're using the 3D Cesium view or the 2D Leaflet view, raster map layers are represented using Cesium's [ImageryProvider](https://cesiumjs.org/Cesium/Build/Documentation/ImageryProvider.html) type and vector layers are represented using Cesium's [DataSource](https://cesiumjs.org/Cesium/Build/Documentation/DataSource.html) and [Entity](https://cesiumjs.org/Cesium/Build/Documentation/Entity.html) types.

Cesium's [tutorials](https://cesiumjs.org/tutorials/) are a great introduction to these topics, especially the [Imagery Layers](https://cesiumjs.org/tutorials/Imagery-Layers-Tutorial/) and [Visualizing Spatial Data](https://cesiumjs.org/tutorials/Visualizing-Spatial-Data/) tutorials.

The code that renders these Cesium types on a Leaflet map is found in the `Map` layer, particularly [CesiumTileLayer](https://github.com/TerriaJS/terriajs/blob/master/lib/Map/CesiumTileLayer.js) and [LeafletVisualizer](https://github.com/TerriaJS/terriajs/blob/master/lib/Map/LeafletVisualizer.js).

In some specialized cases, such as [CesiumTerrainCatalogItem](http://localhost:3002/doc/guide/connecting-to-data/catalog-type-details/cesium-terrain/), catalog items directly interact with an underlying mapping engine rather than using the `ImageryProvider` and `DataSource` abstractions.

## Build Architecture

TerriaJS and TerriaJS-based applications are built using [Webpack](https://webpack.js.org/).  A number of Webpack loaders are used to handle the various types of assets and transformations that TerriaJS requires.  An application that uses TerriaJS is expected to set up Webpack for its own needs and then call [configureWebpack](https://github.com/TerriaJS/terriajs/blob/master/buildprocess/configureWebpack.js) to configure Webpack for TerriaJS.  `configureWebpack` takes care to avoid impacting Webpack configuration outside of TerriaJS itself.

It may be possible to build a TerriaJS application using a tool other than Webpack, such as Browserify or Rollup, but it is unlikely to be easy.  If you decide to attempt this, consider dropping by the [TerriaJS GitHub Discussions forum](https://github.com/TerriaJS/terriajs/discussions).
