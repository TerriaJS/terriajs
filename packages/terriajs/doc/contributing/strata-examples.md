# Strata Examples

## `MagdaReference` which resolves to WMS item

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

### Example Magda record

```json
{
  "aspects": {
    "terria": {
      "definition": {
        "url": "some-wms-server.com/layer"
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

### Defaults `default`

Will contain values in `Trait` definitions. It may also contain values copied from the Magda record's Terria aspect (property) - if `default` stratum has been defined

### Defaults `magda-record`

Will contain `name` property defined in the Magda record. In provided example `"name": "WMS layer name in Magda"`

### Loadable `getCapabilities`

Will contain properties loaded from WMS `GetCapabilities` request. For example:

```json
{
  "name": "A WMS layer name provided by WMS GetCapabilities"
}
```

### Definition `underride`

This my contain values copied from the Magda record's Terria aspect (property) - if `underride` stratum has been defined.

In provided example, this would be:

```json
{
  "name": "A WMS layer name that has been updated by Magda Minion"
}
```

### Definition `definition`

This will contain values copied from the Magda record's Terria aspect (property).

In provided example, this would be:

```json
{
  "url": "some-wms-server.com/layer"
}
```

### Resolved model

```json
{
  "name": "A WMS layer name that has been updated by Magda Minion",
  "url": "some-wms-server.com/layer"
}
```
