# 6. Dynamic groups and `shareKeys` / share link compatibility

Date: 2020-12-10  
Version: 1

## Status

Accepted

## Context

See [architecture\0005-root-group-ids-and-shareKeys.md](architecture\0005-root-group-ids-and-shareKeys.md) for background.

### Glossary

- `wms-group` is `WebMapServiceCatalogGroup` - it loads `GetCapabilities` request to create `WebMapServiceCatalogItem`...
- `wms` is `WebMapServiceCatalogItem`

### How to handle loadable (dynamic) groups with ids - for example `wms-group`

#### Using autoIDs

autoIDs are generated hierarchically - using catalog member `name`.

- v7 autoID has format `Root Group/$someContainerId/$someLowerContainerId/$catalogName`
- v8 autoID has format `//$someContainerId/$someLowerContainerId/$catalogName`

For example - a `wms-group` will have:

- v7 autoID: `Root Group/$wmsGroup.name`
- v8 autoID: `//$wmsGroup.name`

and when it is loaded - `wms` items will have:

- v7 autoID: `Root Group/$wmsGroup.name/$wmsItem.name`
- v8 autoID: `//$wmsGroup.name/$wmsItem.name`

#### Missing `shareKeys`

Even if the `wms-group` has `shareKeys`, the `wms` item ID will be incorrect for a v7 share link

- wms-group v7 autoID will be `Root Group/$wmsGroup.name`
  - which will be in `shareKeys` (this is added by `catalog-converter`) - so ID will be resolved correctly
- A wms-item v7 autoID will be `Root Group/$wmsGroup.name/$wmsItem.name`
  - the item won't have any `shareKeys`, therefore the ID will **not** be resolved

#### Using manual `id` for `wms-group`

What happens when we set an explicit `id` for a `wms-group`?

- A `wms-group` used to have no `id`, therefore it had a v8 autoID `//$wmsGroup.name`
- Now the `wms-group` has `id`:`wms-group-random-id` (and `shareKeys=["//$wmsGroup.name"]`)
  - All share links which refer to `//$wmsGroup.name` will automatically resolve to `wms-group-random-id`
- The `wms-group` is loaded and creates a bunch of `wms` items:
  - Before `wms-group` `id` change, items had v8 autoID of form `//$wmsGroup.name/$wmsItem.name`
  - After `id` change - `wms-group-random-id/$wmsItem.name`
  - Items have **no `shareKeys`**
  - Therefore, `wms` items in old share links **will not work!**

This is also relevant if moving from v8 JSON to v8 Magda catalog - or any other transformation which sets explicit `id`s for catalog members.

### Auto IDs for `CatalogGroups`

Different dynamic `CatalogGroups` may generate member autoIDs differently.

#### WMS-Group

For example - `wms-group` autoIDs for `wms` items are generated from the item `name`:

- in v8: `${layer.Name || layer.Title}`
- in v7:

```js
if (wmsGroup.titleField === "name") {
  return layer.Name;
} else if (wmsGroup.titleField === "abstract") {
  return layer.Abstract;
} else {
  return layer.Title;
}
```

#### CKAN Resource

- in v8: `parentId + "/" + ckanDataset.id + "/" + ckanResource.id`

### Summary

How do we add `shareKeys` to items created by dynamic groups?

## Decisions

### Add `shareKeys` to group items on load

- Go through each share key in `group.shareKeys` and create new `member.shareKeys`:
  - Look at current `member.uniqueId`
  - Replace instances of `group.uniqueID` in `member.uniqueId` with `shareKey`
- For example:
  - `group.uniqueId = "some-group-id"`
  - `member.uniqueId = "some-group-id/some-member-id"`
  - `group.shareKeys = ["old-group-id"]`
  - So we want to create `member.shareKeys = ["old-group-id/some-member-id"]`

To do this, we need a reverse map of `id` -> `shareKeys`.

### Revert v8 WMS-group member ids to match v7

~~This means we don't need to add manual `shareKeys` to WMS-groups.~~

WMS-group IDs will now use `Layer.Name` if is defined - otherwise `Layer.Title`.
Sharekeys will be added so both cases are covered.

## Consequences

This does not solve for the different methods of generating autoIDs across v7 and v8.

Changing `wms-group` IDs will break sharekeys for existing v8 maps.

### Known incompatible groups

- CKAN Group

If we have compatibility issues with certain `CatalogGroup`s, we can either:

- Change id generation in v8 to match v7
- Add manual `shareKey` generation to each `CatalogGroup`
