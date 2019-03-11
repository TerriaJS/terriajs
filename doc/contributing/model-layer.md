# Understand MobX

TerriaJS's model layer is based on MobX, so it is essential to understand MobX. In particular, the [MobX Concepts and Principles](https://mobx.js.org/intro/concepts.html) is a short and enlightening read.

It is also helpful to understand [what MobX reacts to](https://mobx.js.org/best/react.html). We recommend giving it a read before you start working on TerriaJS's model layer, and then read it again any time MobX isn't behaving the way you expect it to.

# Types of classes in the Model layer

* *Traits*: Define the configurable properties of a each stratum of a model object. Traits classes have no logic or behavior, only properties. Note that traits classes are often built by mixing in several sets of traits. Example: `WebMapServiceCatalogItemTraits`.
* *Models*: Concrete, usable model objects representing things like map items and groups in the catalog. They are composed of mix-ins plus some model-specific computed properties and logic. Example: `WebMapServiceCatalogItem`.
* *Mixins*: Provide computed properties and behavior intended to be mixed into model objects to add capabilities to them. Example: `GetCapabilitiesMixin`.
* *Load Strata*: (singular: Load Stratum) Strata that provide values for a subset of the properties defined on model's traits class, usually by loading them from an external source such as WMS GetCapabilities service. Example: `GetCapabilitiesStratum`.

# Reactivity

The TerriaJS model layer generally looks and feels - at least on the surface - like a traditional object-oriented design. An item or group in the catalog, for example, is an instance of a class, such as `WebMapServiceCatalogItem`. Model objects are mutable, meaning we can modify them in-place without the need to copy them first or anything of that sort. This is different from the approach used in [Redux](https://redux.js.org/), which requires that the application's state be represented with immutable objects and that transitions to new states happen in a very controlled fashion.

Unlike most OO applications, though, the TerriaJS model layer is _reactive_. Virtually all properties in the model layer are declared `@observable`. An observable property is just like a normal property; you can get and set its value as normal. On top of that, however, an observable property raises an event when it changes.

Many classes also define `@computed` properties. Computed properties have a getter and optionally a setter. The getter is invoked once the first time the property is accessed and the value is memoized (cached). Further accesses of the property will get the memoized value.

The interesting part is that MobX automatically keeps track of the set of observables (including other computed observables) that were accessed during the execution of the getter.  If any of _those_ properties change, the computed observable's getter will be invoked again and the new value memoized.  This new invocation may access different observable properties than it did the first time around, and it is those new properties that will trigger any future re-evaluations of the computed property.  We can subscribe to change notification on computed properties in the same way we subscribe to regular observable properties.

Rather than directly subscribing to property changes, MobX applications typically use _reactions_. A reaction, such as one created with the `autorun` function, is a bit of code that, when it runs, accesses some observable and computed properties and does something, such as modifying the non-reactive Cesium and Leaflet mapping layers. If any of the properties accessed change in the future, the reaction will run again.

# Avoid reactions and other side effects

A reaction, as described above, is a type of side-effect. When a property changes, "something" happens. That "something" may be surprising to whoever wrote the code that modified the property, and so this is an extremely common source of bugs.

A good rule of thumb is this: all properties should either be simple data properties (i.e. no getter or setter), or they should have only a getter and that getter should be a pure function of other properties. A pure function is one that can be called any number of times with no observable side effects, and that returns the same value for the same inputs every time it is called.

Computed properties with setters should be avoided. In our _old_ architecture, we frequently used computed properties with a setter to model properties that are configurable by the user, but that have a default value computed from other properties when there is no user-specified value. In the current architecture, this is better modeled by:

* Defining the configurable property on the `Traits` class.
* Defining a computed property on the derived Model class that accesses `super.propertyName` (if mixins should be allowed to define the property) or `this.flattened.propertyName` (if only a directly-configured property value should be used) and, if that is undefined, computes and returns the default value from other properties.

If a property does have a setter, it should obey these laws:

1. _You get back what you put in_: If you set the value of the property and then get it, you should get back the same value you set.
2. _Putting back what you got doesn't change anything_: If you get property's value, and then set it with that same value, it doesn't change anything.
3. _Setting twice is the same as setting once_: There should be no observable effect from setting a property to the same value twice.

> Note: These are the [Lens Laws](http://hackage.haskell.org/package/lens-4.17/docs/Control-Lens-Type.html#t:Lens) from functional programming.

We need to be more precise about what we mean by "same value" in the laws above. For primitive types (strings, numbers, booleans, null, and undefined), "the same" means that comparing the values with `===` returns `true`. `===` should also return `true` for references to model objects and other mutable, reactive objects. Arrays should be MobX [reactive arrays](https://mobx.js.org/refguide/array.html) where each element in the array follows the rules stated here.

For other types of objects, such as Cesium's mutable `JulianDate`, `Cartographic`, and `Cartesian3` types, "same value" means that the instances should conceptually represent the same value (e.g. using the `equals` function on the two instances should return true), but the instance may be different. In particular, properties of these types should declare their type as `Readonly<JulianDate>`, `Readonly<Cartographic>`, or `Readonly<Cartesian3>`. The objects should be copied on _set_. Returning a frozen object (e.g. `Object.freeze`) from _get_ may help to prevent bugs, particular if some clients of the property are expected to not be using TypeScript.

# Scenarios for avoiding side effects

#### Value comes from loading metadata (e.g. GetCapabilities), but users should be able to override the loaded value by specifying it explicitly in the catalog file or UI.

Create a _load stratum_ for the values loaded from metadata. Example: the `rectangle` property on `WebMapServiceCatalogItem`'s `GetCapabilitiesStratum`.

#### Value can be specified in the catalog file or UI, but if it's not, use a default.

The default can be applied by overriding the property in a mixin or model class, accessing `super.propertyName`, and returning the default value if it is undefined. The default value may be computed from other properties if desired. Example: `legendUrls` property of `WebMapServiceCatalogItem`.

# Single source of truth

Another good rule of thumb is that there should always be a single source of truth for any piece of information. We run into trouble when the same information is stored in multiple places, even if it's stored in slightly different ways. When one is updated, we'll either need to remember to update the other, or we'll need to set up a reaction or other side-effect to automatically keep the other in sync.

A much less error-prone approach is to make one of the two places the information is needed a `@computed` property, computed from the other one. This is usually pretty straightforward, but it gets more difficult when one of the two places is part of Cesium, Leaflet, D3, or some other non-reactive part of our application. The solution here is to _adapt_ it to be reactive. There are two broad approaches for this, depending on the direction of information flow:

#### MobX observable is the source of truth, a non-reactive part of the application must be kept in sync

This is perhaps the only place it is justified to use a MobX `autorun`. The `autorun` should scoop up all the information it needs from the reactive world and push it into Cesium, Leaflet, D3, etc. This should be done as close to the non-reactive world as possible, and it _must_ consider performance. For example, an easy way to keep Cesium's list of imagery layers in sync with the TerriaJS workbench is to create an `autorun` that removes all the layers and then re-adds the imagery layers for all catalog items on the workbench. This would "work", but even small changes would cause the globe's imagery layers to vanish and then reload.

Instead, Cesium's current state should be modified to match the desired state derived from the workbench. A useful illustration of an extreme version of this principle can be found in how React interacts with the browser DOM. React components produce a desired state of the DOM each time their `render` method is called. The magic of React is that it efficiently updates the DOM to match that desired state. Fortunately, we are rarely trying to update state that is as complicated as the browser DOM, so we don't need to use techniques as sophisticated as React's. The result, though, should be similar.

#### Non-reactive property is the source of truth, reactive (MobX) world must be kept in sync

MobX provides [Atoms](https://mobx.js.org/refguide/extending.html), which can be used to create a reactive view of non-reactive properties. With this we could, for example, create a property that retrieves the current Cesium clock time and that will notify any interested parties when that time changes. Behind the scenes, we use an Atom and a subscription to Cesium's clock tick event to trigger reactions when the clock time changes.

In this scenario, consider whether you could instead let the reactive world take ownership of this property and be the source of truth. Events in the non-reactive world may still trigger changes in this property's value, but all clients - including the non-reactive ones - would query the reactive property whenever they need this piece of information.

# Put as much logic as possible in the model layer

We want to keep the UI as small and simple as possible, because:

* The UI is the hardest part of TerriaJS to test with automated tests. If it has lots of complicated logic, we will need to spend a lot of time writing tests for it to ensure that it behaves correctly. A very simple UI is easier to test, and is perhaps so simple that automated tests for it are not needed at all.
* We would like everything that can be done by a user interacting with the UI to be doable programmatically as well. If the UI encodes complex rules or has its own states, this may not be possible, or doing so may require duplicating complicated "business logic" that already exists in the UI.

Therefore, whenever possible, TerriaJS logic should be in the Model layer instead of in the UI. The UI should be a pure function from Model state to React components, and actions that simply execute functions or change a small number of properties in the Model layer.

# All settable properties should be Traits

All settable properties of a Model should be in its Traits. Because Traits are the only properties that are serialized/deserialized for catalog configuration and for sharing, settable properties that are not part of Traits prevent us from being able to completely recover application state. The only exception to this rule is for highly transient properties, such as whether a load from a remote source is currently in progress.
