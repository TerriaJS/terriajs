# Strata

## Strata types

- Defaults
- Loadable
- Definition
- User

Each type can have multiple strata

## Common strata

These strata exist for every model

- Defaults
  - `default`
- Definition
  - `underride`
  - `definition`
  - `override`
- User
  - `user`

### Defaults `defaults`

Default values in trait definitions. For example `opacity`

```ts
@primitiveTrait({
  type: "number",
  name: "Opacity",
  description: "The opacity of the map layers."
})
opacity: number = 0.8;
```

### Definition `underride`



### Definition `definition`

Values from [initialization files](https://github.com/TerriaJS/terriajs/blob/main/doc/customizing/initialization-files.md). For example a WMS item with `opacity = 1`.

```json
{
"catalog": [
    {
      "type": "wms",
      "name": "A WMS layer",
      "url": "some-wms-server.com/layer",
      "opacity": 1
    },
    ...
  ],
  ...
}
```

### Definition `override`

### User `user`

User-driven values. This strata should only be used for values changed by user-interaction (for example the `opacity` slider)

## Loadable strata

Values which are loaded from external sources. For example WMS `GetCapabilities`

## More complicated examples

### CkanReference which resolves to WMS item

**Bold** items are not `CommonStrata`

- Defaults
  - `default`
  - **`magda-record`**
- Loadable
  - **`getCapabilities`**
- Definition
  - `underride`
  - `definition`
  - `override`
- User
  - `user`

#### Example Magda record

```json
{
  "aspects": {
    "terria": {
      "definition": {
        "url": "some-wms-server.com/layer",
      },
      "underride": {
        "name": "A WMS layer name that has been updated by Magda Minion"
      },
      "id": "wms-layer-id",
      "type": "wms"
    }
  },
  "id": "wms-layer-id",
  "name": "WMS layer name in Magda"
}
```

#### Defaults `default`

Will contain values in `Trait` definitions. It may also contain values copied from the Magda record's Terria aspect (property) - if `default` stratum has been defined

#### Defaults `magda-record`

Will contain `name` property defined in the Magda record. In provided example `"name": "WMS layer name in Magda"`

#### Loadable `getCapabilities`

Will contain properties loaded from WMS `GetCapabilities` request. For example: 

```json
{
  "name": "A WMS layer name provided by WMS GetCapabilities"
}
```

#### Definition `underride`

This my contain values copied from the Magda record's Terria aspect (property) - if `underride` stratum has been defined.

In provided example, this would be:

```json
{
  "name": "A WMS layer name that has been updated by Magda Minion"
}
```

#### Definition `definition`

This will contain values copied from the Magda record's Terria aspect (property).


In provided example, this would be:

```json
{
  "url": "some-wms-server.com/layer",
}
```


### MagdaReference which resolves to WMS item

**Bold** items are not `CommonStrata`

- Defaults
  - `default`
  - **`magda-record`**
- Loadable
  - **`getCapabilities`**
- Definition
  - `underride`
  - `definition`
  - `override`
- User
  - `user`

#### Example Magda record

```json
{
  "aspects": {
    "terria": {
      "definition": {
        "url": "some-wms-server.com/layer",
      },
      "underride": {
        "name": "A WMS layer name that has been updated by Magda Minion"
      },
      "id": "wms-layer-id",
      "type": "wms"
    }
  },
  "id": "wms-layer-id",
  "name": "WMS layer name in Magda"
}
```

#### Defaults `default`

Will contain values in `Trait` definitions. It may also contain values copied from the Magda record's Terria aspect (property) - if `default` stratum has been defined

#### Defaults `magda-record`

Will contain `name` property defined in the Magda record. In provided example `"name": "WMS layer name in Magda"`

#### Loadable `getCapabilities`

Will contain properties loaded from WMS `GetCapabilities` request. For example: 

```json
{
  "name": "A WMS layer name provided by WMS GetCapabilities"
}
```

#### Definition `underride`

This my contain values copied from the Magda record's Terria aspect (property) - if `underride` stratum has been defined.

In provided example, this would be:

```json
{
  "name": "A WMS layer name that has been updated by Magda Minion"
}
```

#### Definition `definition`

This will contain values copied from the Magda record's Terria aspect (property).


In provided example, this would be:

```json
{
  "url": "some-wms-server.com/layer",
}
```
