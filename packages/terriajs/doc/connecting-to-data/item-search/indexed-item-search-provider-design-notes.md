# IndexedItemSearchProvider design notes

## Requirements

- Should be file based, not requiring any additional backends
- Should be performant enough to search datasets with as many as 500000 features
- Must be able to search numeric, text or enum properties

In the remaining section we describe the structure of the index.

## indexRoot.json

`indexRoot` captures the overall structure of the index. It has the following fields:

- `idProperty`
  - Required
  - Name of the feature property that is used as ID for indexing. This is also
    sometimes used by the catalog item to uniquely identify & highlight the
    selected feature.
- `resultsDataUrl: string`
  - Required
  - URL of the CSV [results data file](#results-data-file) mapping a feature by
    its ID to result data associated with the feature.
- `indexes: Record<string, Index>`
  - Required
  - An object whose keys are the property names and values are the
    corresponding [Index](#index-types) definition.

## Results data file

A CSV file mapping an indexed feature to result data using its ID.

eg:

```
"building_id","latitude","longitude","height","street_address"
"abc1","45.0","100.0","120","abc def"
```

It should contain a header for each column. It should also have a column for the `idProperty` specified in the `indexRoot.json` file. Terria also recongnizes a few special columns which it uses to construct a target to zoom to when the user selects the result.

- `latitude`
  - Required
  - The latitude of the feature
- `longitude`
  - Required
  - The longitude of the feature
- `height`
  - Optional
  - The height of the feature
- `radius`
  - Optional
  - The radius of the bounding sphere containing the feature

A zoom target is constructed using the `latitude`, `longitude` and `height` or the `radius` whichever is known. `height` is the height of the feature and `radius` is a radius of the bounding sphere to zoom to.

## Index types

Terria implements the following index types:

### Numeric Index

Numeric index is used for searching numeric properties. It can be used for searching features with numeric values within a range, for eg: Buildings with height between 100m and 180m. Numeric index is represented as an array of [id, value] pairs sorted by value. This makes it easy to perform a binary search on the index.

#### Definition

- `type: "numeric"`
  - Required
- `range: {min: number, max: number}`
  - Required
  - The range of values in the index.
- `url: string`
  - Required
  - URL of the [numeric index file](#numeric-index-file)

eg:

```
{
  type: "numeric",
  range: {min: 7.58, max: 92901.63},
  url: "1.csv"
}
```

#### Numeric index file

A numeric index file is a CSV file sorted by its value. The file must have two named columns `dataRowId` and `value`. The `dataRowId` is the index of the corresponding feature in the [results data file](#results-data-file).

```
"dataRowId","value"
"332600","7.58"
...
"63462","92901.63"
```

### Enum Index

Enum index is useful for searching fixed list of strings, eg: Roof material property can have a fixed set of values like Tile, Metal, Fiberglass, Concrete, Plastic etc. An enum index contains a sub-index for each of its value. The sub-index is simply a list of feature IDs that have that value.

#### Definition

- `type: "enum"`
  - Required
- `values: Record<string, EnumValue>`
  - Required
  - An object whose keys are the enum string and value defines the [enum value index](#enum-value-index).

eg:

```
"ROOF_MATERIAL": {
  "type": "enum",
  "values": {
    "Unclassified": { "count": 273889, "url": "3-0.csv" },
    "Tile": { "count": 130063, "url": "3-1.csv" },
    "Metal": { "count": 113671, "url": "3-2.csv" },
    "Fiberglass/Plastic": { "count": 5653, "url": "3-3.csv" },
    "Flat Concrete": { "count": 2476, "url": "3-4.csv" },
    "": { "count": 20454, "url": "3-5.csv" }
  }
}
```

#### Enum value index

Defines the index for a single enum member.

##### Definition

- `count: number`
  - Required
  - Number of features that have this enum value.
- `url: string`
  - Required
  - URL of the [enum value index file](#enum-value-index-file).

##### Enum value index file

The enum value index file is a CSV file with a single column named `dataRowId` which is the index of the corresponding feature in the [results data file](#results-data-file).

eg:

```
"dataRowId"
"1"
"2"
...
"546205"
```

#### Text Index

Text index is used for searching arbitrary text properties, for eg: street address. We use [Minisearch](https://github.com/lucaong/minisearch) for generating and searching text index.

##### Definition

- `type: "text"`
- Required
- `url: string`
- Required
- URL of the [text index file](#text-index-file).

eg:

```
 { "type": "text", "url": "2.json" }
```

##### Text index file

Text index file is a JSON file with the following structure:

- `index: MiniSearch`
  - Required
  - The searialized [Minisearch](https://github.com/lucaong/minisearch) index instance
- `options: MiniSearchOptions`
  - Required
  - The options used to create the MiniSearch instance.

### Why CSV and not JSON?

In our testing we found that parsing CSV in javascript is significantly faster than parsing JSON (a difference of 2-3secs). So we decided to use CSV for representing numeric & enum indexes. Text index is persisted as a JSON searialization of the Minisearch instance.
