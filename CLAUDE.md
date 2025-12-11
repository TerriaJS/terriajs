# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TerriaJS is a TypeScript/JavaScript library for building rich, web-based geospatial data explorers. It provides a 3D globe (using Cesium) and 2D map (using Leaflet) with support for tens of thousands of catalog layers and dozens of geospatial file and web service types.

**Key Technologies:**

- TypeScript 5.7.3 (target: ES2019, compiled to ES5 via Babel)
- React 16.14.0 with MobX 6.x for reactive state management
- Cesium (terriajs-cesium 8.0.2) for 3D rendering
- Leaflet 1.8.0 for 2D fallback
- Webpack 5 for bundling
- Jasmine/Karma for testing
- i18next for internationalization

**Node Version Required:** >= 20.0.0

## Common Commands

### Development

```bash
# Primary development workflow - starts server on port 3002 and watches for changes
yarn gulp dev

# Hot reload with webpack-dev-server
yarn hot

# Start production server only (no build)
yarn start  # runs on port 3002

# Watch mode (auto-rebuild on file changes, no server)
yarn gulp watch
```

### Building

```bash
# Full build (linting + build)
yarn gulp

# Build only (development mode with source maps)
yarn gulp build

# Production build (minified)
yarn gulp release

# Build specifications/tests
yarn gulp build-specs
```

### Testing

```bash
# Run tests in available browsers (auto-detects Chrome, Firefox, etc.)
yarn gulp test

# Run tests in Firefox only
yarn gulp test-firefox

# Lint code (lib and test directories)
yarn gulp lint
```

### Code Quality

```bash
# Format code with Prettier
yarn prettier

# Quick format staged files
yarn pretty-quick

# Check formatting without modifying
yarn prettier-check
```

### Documentation

```bash
# Build tools for doc generation
yarn build-tools

# Watch tools (for development)
yarn watch-tools

# Build complete documentation site
yarn build-docs

# Generate full docs including API reference
yarn gulp docs
```

### Utilities

```bash
# Copy Cesium assets to wwwroot (runs post-install automatically)
yarn gulp copy-cesium-assets

# Generate code attribution
yarn gulp code-attribution

# Build for Node.js environment (TypeScript compilation)
yarn build-for-node
```

## Architecture

### Core Model Architecture

TerriaJS uses a trait-based, reactive architecture centered around the **Terria** model (lib/Models/Terria.ts):

1. **Terria** - The root application model that coordinates:

   - Catalog management (loading/organizing data sources)
   - Map rendering (Cesium 3D or Leaflet 2D)
   - User interactions and state
   - Time animation
   - Feature picking and selection
   - Analytics and error handling

2. **Traits System** (lib/Traits/)

   - Type-safe, declarative property definitions using TypeScript decorators
   - Supports stratification (user overrides vs catalog defaults)
   - Enables JSON serialization/deserialization
   - Located in `lib/Traits/TraitsClasses/`

3. **Mixins** (lib/ModelMixins/)
   - Composable behaviors added to catalog items via mixins
   - Key mixins:
     - `CatalogMemberMixin` - Basic catalog item properties
     - `MappableMixin` - Items that can be displayed on map
     - `GroupMixin` - Items that contain other items
     - `TimeVarying` - Time-series data support
     - `UrlMixin` - Loading data from URLs

### Catalog System

**Location:** `lib/Models/Catalog/`

The catalog system manages all data sources:

- **Catalog.ts** - Root catalog container
- **CatalogGroup.ts** - Groups of catalog items (folders)
- **CatalogMemberFactory.ts** - Factory for creating catalog items from JSON
- **registerCatalogMembers.ts** - Registers all available catalog item types

**Catalog Item Types** include:

- WMS, WFS, WMTS (web map services)
- Esri MapServer, FeatureServer, ImageServer
- GeoJSON, KML, CSV, Shapefile, GPX
- 3D Tiles, CZML
- CKAN, CSW, Socrata, OpenDataSoft (catalog providers)

Each catalog item type is in `lib/Models/Catalog/CatalogItems/` or `lib/Models/Catalog/Ows/`.

### MobX Reactive State

TerriaJS heavily uses MobX observables for reactive updates:

- Models use `@observable` decorators for tracked properties
- Use `@computed` for derived values
- Use `@action` for state mutations
- React components use `observer()` HOC to react to observable changes
- **Important:** Always wrap state changes in `runInAction()` for async operations

### UI Components

**Location:** `lib/ReactViews/`

Key UI areas:

- **StandardUserInterface/** - Main application layout
- **Map/** - Map view, navigation controls, panels
  - `MenuBar/` - Top menu (share, help, story)
  - `MapNavigation/` - Zoom, compass controls
  - `Panels/` - Share panel, tools panel
  - `BottomBar/` - Credits, location, distance legend
- **DataCatalog/** - Catalog browser tree
- **Workbench/** - Active data layers panel
- **ExplorerWindow/** - Main explorer modal
- **Search/** - Search UI components
- **FeatureInfo/** - Feature information panels
- **Preview/** - Data preview before adding to map
- **SelectableDimensions/** - UI for data dimensions (time, elevation, etc.)

Components use **styled-components** for CSS-in-JS styling.

### View Models

**Location:** `lib/ReactViewModels/` and `lib/ViewModels/`

View models bridge between core models and React views:

- **ViewState** - Top-level UI state (what panels are open, etc.)
- **MapNavigation/MapNavigationModel** - Map control state
- **TerriaViewer** - Wraps Cesium/Leaflet map instances

### Data Processing

**Location:** `lib/Table/`, `lib/Map/`

- **Table/** - Tabular data processing, CSV parsing, region mapping
- **Map/** - Map-related utilities, feature picking, imagery providers
- **Charts/** - Time series and other chart generation

### Search System

**Location:** `lib/Models/SearchProviders/`

Search providers find locations, catalog items, or features:

- BingMapsSearchProvider
- LocationSearchProvider
- CatalogSearchProvider
- Indexed search for catalog items

### Testing Structure

**Location:** `test/`

- Tests mirror the `lib/` structure
- Uses Jasmine with Karma test runner
- Test helpers in `test/SpecHelpers.ts`
- Fixtures in `wwwroot/test/` organized by data type
- Run tests with `yarn gulp test`

### Build Process

**Location:** `buildprocess/`

Key files:

- **webpack.config.make.js** - Main webpack config for building specs
- **configureWebpack.js** - Shared webpack configuration
- **createKarmaBaseConfig.js** - Karma test configuration
- **terriajsServerGulpTask.js** - Gulp task for running terriajs-server

The build:

1. Copies Cesium assets to `wwwroot/build/Cesium/`
2. Compiles TypeScript/JSX with Babel
3. Bundles with Webpack
4. Outputs to `wwwroot/build/`

### Styling System

TerriaJS uses:

- **styled-components** for component-level CSS-in-JS
- SCSS for global styles (can be overridden in TerriaMap via `lib/Styles/variables-overrides.scss`)
- Theme customization via `lib/Styled/themes.ts`

### Internationalization (i18n)

**Location:** `lib/Language/`

- Uses i18next for translations
- Translation files in `wwwroot/languages/`
- Currently supports English (default), with community translations for French, Italian, Japanese, and others
- Add new translatable strings using `t("key")` from react-i18next

## Development Workflow

### Adding a New Catalog Item Type

1. Create traits class in `lib/Traits/TraitsClasses/`
2. Create model in `lib/Models/Catalog/CatalogItems/`
3. Apply necessary mixins (MappableMixin, UrlMixin, etc.)
4. Implement `forceLoadMapItems()` to load and display data
5. Register in `lib/Models/Catalog/registerCatalogMembers.ts`
6. Add tests in `test/Models/Catalog/CatalogItems/`
7. Add test fixtures in `wwwroot/test/`

### Modifying UI Components

1. Find component in `lib/ReactViews/`
2. Components are React + TypeScript with styled-components
3. Use `observer()` HOC for components that read MobX observables
4. Access Terria via props or `useViewState()` hook
5. Follow existing patterns for theming and responsive design

### Working with MobX State

1. State changes must be wrapped in `@action` or `runInAction()`
2. Use `computed` for derived values (automatically cached)
3. Avoid direct mutation of observables outside actions
4. Use `toJS()` to get plain JavaScript objects from observables

### Testing Best Practices

1. Test files mirror source structure (e.g., `lib/Models/Foo.ts` → `test/Models/FooSpec.ts`)
2. Use descriptive `describe` and `it` blocks
3. Mock external dependencies (network requests, DOM)
4. Test both success and error paths
5. Use `jasmine-ajax` for mocking HTTP requests

## Key Concepts

### Strata System

Models support "strata" - layers of property values with different priorities:

- **definition** - From catalog JSON
- **user** - User overrides
- **underride** - Default values

Access via `item.setTrait(stratum, "propertyName", value)`

### Result Type

TerriaJS uses a `Result` type (lib/Core/Result.ts) for error handling:

```typescript
const result = await someOperation();
if (result.error) {
  // handle error
} else {
  // use result.value
}
```

### Feature Detection

The feature picking system (lib/Map/PickedFeatures/) handles:

- Click/hover on map features
- Querying multiple data sources
- Displaying feature information panels
- Time-series charts for features

### Region Mapping

CSV files can be mapped to geographic regions (Australian statistical areas, countries, etc.):

- Configuration in `wwwroot/data/regionMapping.json`
- Logic in `lib/Table/TableAutomaticStylesStratum.ts`

## Important File Locations

- **lib/Models/Terria.ts** - Main application model
- **lib/ReactViewModels/ViewState.ts** - UI state management
- **lib/Models/Catalog/registerCatalogMembers.ts** - Register all catalog types
- **lib/ReactViews/StandardUserInterface/StandardUserInterface.tsx** - Main UI
- **lib/Core/TerriaError.ts** - Error handling
- **lib/Core/loadJson.ts** - Loading JSON with caching
- **lib/Table/TableMixin.ts** - Tabular data handling
- **buildprocess/configureWebpack.js** - Webpack configuration
