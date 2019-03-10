### Understand MobX

TerriaJS's model layer is based on MobX, so it is essential to understand MobX. In particular, the [MobX Concepts and Principles](https://mobx.js.org/intro/concepts.html) is a short and enlightening read.

It is also helpful to understand [what MobX reacts to](https://mobx.js.org/best/react.html). We recommend giving it a read before you start working on TerriaJS's model layer, and then read it again any time MobX isn't behaving the way you expect it to.

### Types of classes in the Model layer

* *Traits*: Define the configurable properties of a each stratum of a model object. Traits classes have no logic or behavior, only properties. Note that traits classes are often built by mixing in several sets of traits. Example: `WebMapServiceCatalogItemTraits`.
* *Models*: Concrete, usable model objects representing things like map items and groups in the catalog. They are composed of mix-ins plus some model-specific computed properties and logic. Example: `WebMapServiceCatalogItem`.
* *Mixins*: Provide computed properties and behavior intended to be mixed into model objects to add capabilities to them. Example: `GetCapabilitiesMixin`.
* *Load Strata*: (singular: Load Stratum) Strata that provide values for a subset of the properties defined on model's traits class, usually by loading them from an external source such as WMS GetCapabilities service. Example: `GetCapabilitiesStratum`.

### Reactivity

The TerriaJS model layer generally looks and feels - at least on the surface - like a traditional object-oriented design. An item or group in the catalog, for example, is an instance of a class, such as `WebMapServiceCatalogItem`. Model objects are mutable, meaning we can modify them in-place without the need to copy them first or anything of that sort. This is different from the approach used in [Redux](https://redux.js.org/), which requires that the application's state be represented with immutable objects and that transitions to new states happen in a very controlled fashion.

Unlike most OO applications, though, the TerriaJS model layer is _reactive_. Virtually all properties in the model layer are declared `@observable`. An observable property is just like a normal property; you can get and set its value as normal. On top of that, however, an observable property raises an event when it changes.

Many classes also define `@computed` properties. Computed properties have a getter and optionally a setter. The getter is invoked once the first time the property is accessed and the value is memoized (cached). Further accesses of the property will get the memoized value.

The interesting part is that MobX automatically keeps track of the set of observables (including other computed observables) that were accessed during the execution of the getter.  If any of _those_ properties change, the computed observable's getter will be invoked again and the new value memoized.  This new invocation may access different observable properties than it did the first time around, and it is those new properties that will trigger any future re-evaluations of the computed property.  We can subscribe to change notification on computed properties in the same way we subscribe to regular observable properties.

Rather than directly subscribing to property changes, MobX applications typically use _reactions_. A reaction, such as one created with the `autorun` function, is a bit of code that, when it runs, accesses some observable and computed properties and does something, such as modifying the non-reactive Cesium and Leaflet mapping layers. If any of the properties accessed change in the future, the reaction will run again.

### Avoid reactions and other side effects

A reaction, as described above, is a type of side-effect. When a property changes, "something" happens. That "something" may be surprising to whoever wrote the code that modified the property, and so this is an extremely common source of bugs.

A good rule of thumb is this: all properties should either be simple data properties (i.e. no getter or setter), or they should have only a getter and that getter should be a pure function of other properties. A pure function is one that can be called any number of times with no observable side effects, and that returns the same value for the same inputs every time it is called.

Computed properties with setters should be avoided. In our _old_ architecture, we frequently used computed properties with a setter to model properties that are configurable by the user, but that have a default value computed from other properties when there is no user-specified value. In the current architecture, this is better modeled by:

* Defining the configurable property on the `Traits` class.
* Defining a computed property on the derived Model class that accesses `super.propertyName` (if mixins should be allowed to define the property) or `this.flattened.propertyName` (if only ) and, if that is undefined, computes and returns the default value from other properties.


Scenarios:

* _Value comes from loading metadata (e.g. GetCapabilities), but users should be able to override the loaded value by specifying it explicitly in the catalog file or UI_: Create a _load stratum_ for the values loaded from metadata. Example: the `rectangle` property on `WebMapServiceCatalogItem`'s `GetCapabilitiesStratum`.
* _Value can be specified in the catalog file or UI, but if it's not, use a default_: The default can be applied by overriding the property in a mixin or model class, accessing `super.propertyName`, and returning the default value if it is undefined. The default value may be computed from other properties if desired. Example: `legendUrls` property of `WebMapServiceCatalogItem`.

### Use layers instead of settable computed properties

### Don't share structure - setters should make a copy of mutable data structures

### Single source of truth

### Put as much logic as possible in the model layer


### All settable properties should be _traits_.

