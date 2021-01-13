# IndexedItemSearchProvider design notes

### Requirements

- Should be file based, not requiring any additional backends
- Should be performant enough to search datasets with as many as 500000 features
- Must be able to search numeric, text or enum properties 

### Structure of the index

### indexRoot.json

The index comprises of an `indexRoot.json` file which describes the overall structure of the index. It defines the `dataUrl`,  `idProperty` and `indexes`.

- dataUrl
  URL of the data file which is a CSV file that maps a feature ID to properties of interest. The properties in the data file is available as Mustache variables for formatting the search result. It also defines a few special properties like `latitude`, `longitude`, `height`, `radius` which are used to zoom to the result.

- idProperty
  The name of the property that is used as ID for the index.

- indexes
  A map from the property name to its index definition.
  
  
### Index types

#### Numeric Index
Numeric index is used for searching numeric properties. It can be used for searching features with numeric property within a range, for eg: Buildings with height between 100m and 180m. Numeric index is represented as an array of [id, value] pairs sorted by value. This makes it easy to perform a binary search on the index.

#### Enum Index
Enum index is useful for searching fixed list of strings, eg: Roof material property can have a fixed set of values like Tile, Metal, Fiberglass, Concrete, Plastic etc. An enum index contains a sub-index for each of its value. The sub-index is simply a list of feature IDs that have that value.

#### Text Index
Text index is used for searching arbitrary text properties, for eg: street address. We use a library called [Minisearch](https://github.com/lucaong/minisearch) for generating and searching text index.
      
### Choice of format

In our testing we found that parsing CSV in javascript is significantly faster than parsing JSON (a difference of 2-3secs). So we decided to use CSV for representing numeric & enum indexes. Text index is persisted as a JSON searialization of the Minisearch instance.
