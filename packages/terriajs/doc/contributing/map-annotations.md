# Map Annotations

Map annotations let a user drop a marker at a point on the map and attach rich text
to it. The text is authored with the same TinyMCE editor used by Stories, is shown in
a floating popup anchored to the marker, works in both 2D (Leaflet) and 3D (Cesium),
and persists in share links and story scenes.

## Using the tool

1. Click the **Annotate** button in the map navigation (top toolbar).
2. Click a point on the map. A marker is placed and the rich-text editor opens.
3. Type/format the text and **Save**. A floating popup appears above the marker.
4. The tool stays active so you can keep placing annotations. Click **Done** (or the
   toolbar button again) to finish.

Once the tool is inactive:

- **Clicking a marker toggles its popup** open/closed.
- Each popup has **Edit** (reopens the editor), **Delete**, and **Close** controls.

Multiple popups can be open at once. Popups track their marker as the camera/map moves
and stay a fixed screen size regardless of zoom.

## Persistence, sharing and stories

Annotations are stored as ordinary model traits in the `user` stratum of a single
`AnnotationCatalogItem` on the workbench. Because the share/init serializer already
captures every workbench model's `user` stratum, annotations round-trip through share
links, short shares, init files and **story scenes** with no extra plumbing.

Each annotation has an `open` trait recording whether its popup is currently open.
This is persisted too, so a saved story scene restores exactly the set of readable
popups — this is what makes "several annotations readable at once in a scene" work.

## Defining annotations in an init file

Annotations are a catalog item of `type: "annotations"`. You can author them directly
in an init file / catalog JSON:

```json
{
  "type": "annotations",
  "name": "Annotations",
  "id": "my-annotations",
  "annotations": [
    {
      "id": "annotation-1",
      "longitude": 133.0,
      "latitude": -25.0,
      "text": "<p>Hello <strong>world</strong></p>",
      "open": true
    }
  ]
}
```

| Field       | Type    | Notes                                                               |
| ----------- | ------- | ------------------------------------------------------------------- |
| `id`        | string  | Unique id of the annotation.                                        |
| `longitude` | number  | Degrees.                                                            |
| `latitude`  | number  | Degrees.                                                            |
| `height`    | number  | Metres. If omitted, the marker is clamped to the ground.            |
| `title`     | string  | Optional plain-text name (used as the entity name / feature title). |
| `text`      | string  | Rich text as an HTML string. Sanitized (DOMPurify) when rendered.   |
| `open`      | boolean | Whether the popup is shown. New annotations default to `true`.      |

The full, always-current trait reference is generated under **Connecting to Data →
Catalog Type Details → annotations**.

## Architecture

The feature is deliberately built from existing TerriaJS primitives.

| Concern                | File                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| Traits                 | `lib/Traits/TraitsClasses/AnnotationTraits.ts`                              |
| Model                  | `lib/Models/Catalog/CatalogItems/AnnotationCatalogItem.ts`                  |
| Factory registration   | `lib/Models/Catalog/registerCatalogMembers.ts`                              |
| Placement/edit tool    | `lib/ReactViews/Map/MapNavigation/Items/AnnotationTool.ts`                  |
| Tool registration      | `lib/ReactViews/Map/MapNavigation/registerMapNavigations.tsx`               |
| Rich-text editor modal | `lib/ReactViews/Annotations/AnnotationEditor.tsx`                           |
| Floating popups        | `lib/ReactViews/Annotations/AnnotationPopups.tsx`                           |
| Editor modal state     | `lib/ReactViewModels/ViewState.ts` (`annotationEditorState`)                |
| World-anchored DOM API | `lib/Models/GlobeOrMap.ts`, `lib/Models/Cesium.ts`, `lib/Models/Leaflet.ts` |

### Model — `AnnotationCatalogItem`

`AnnotationCatalogItem extends MappableMixin(CatalogMemberMixin(CreateModel(...)))`.
Its `mapItems` build a `CustomDataSource` with one billboard `Entity` per annotation
(so it renders identically in Leaflet and Cesium), each carrying the annotation's HTML
as the entity `description`. It exposes helpers that mutate the `user` stratum:
`addAnnotation`, `updateAnnotation`, `removeAnnotation`, `setAnnotationOpen`,
`toggleAnnotationOpen`, `getAnnotation`.

### Tool — `AnnotationTool`

A `MapNavigationItemController` that, on activate, gets-or-creates the singleton
annotations item (fixed id `__TERRIAJS-ANNOTATIONS__`) and adds it to the workbench,
then drives a `MapInteractionMode` loop (identical in both viewers). Clicking empty
map opens the editor for a new annotation; clicking an existing marker opens the
editor pre-filled for edit/delete.

### Editor — `AnnotationEditor`

Lazily embeds the shared `ReactViews/Generic/Editor` (TinyMCE). It is driven by
`viewState.annotationEditorState`; open it with `viewState.openAnnotationEditor(...)`
and it renders from `StandardUserInterface`.

### Popups — `AnnotationPopups`

Renders a floating popup for each open annotation. Positioning is delegated to the
active viewer via [`GlobeOrMap.addScreenAnchor`](#the-addscreenanchor-api); the popup's
React content is rendered into the returned anchor `element` with `createPortal` (so
theme and i18n contexts still flow). When the annotation tool is inactive, a reaction
on `terria.selectedFeature` intercepts clicks on annotation markers and toggles their
popup instead of opening the docked feature info panel.

## The `addScreenAnchor` API

Anchoring a DOM element to a world position — so it tracks the camera/map and stays a
fixed screen size — is a reusable primitive, not annotation-specific:

```ts
interface ScreenAnchor {
  readonly element: HTMLElement;
  destroy(): void;
}

// on GlobeOrMap (and both viewers)
addScreenAnchor(position: Cartesian3): ScreenAnchor;
```

Render your own content into `element` (e.g. via a React portal) and call `destroy()`
to remove it. Positioning is delegated to each viewer so it tracks natively:

- **Leaflet** creates a zero-size, non-interactive marker at the lat/lng. Leaflet keeps
  markers glued through pan and the zoom animation, so there is no lag.
- **Cesium** appends an element to the widget container and updates its transform on
  `scene.postRender`, hiding it when the point is occluded by the globe
  (`EllipsoidalOccluder`).
- The base `GlobeOrMap` (and `NoViewer`) return a detached, untracked element.

Reuse this for any world-anchored overlay (labels, callouts, mini-charts, etc.).

## Known limitations / follow-ups

- **3D terrain height:** popups anchor at the annotation's ellipsoid height
  (`height ?? 0`), so on tall terrain in 3D a popup can be slightly offset from a
  ground-clamped marker.
- **Overlap:** nearby popups can overlap; there is no collision avoidance yet
  (offsets or leader lines would be a natural follow-up).
- **Drag to reposition** is not implemented; positions are set at creation time.
