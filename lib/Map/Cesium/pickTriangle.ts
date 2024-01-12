import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  defined,
  IntersectionTests,
  MapProjection,
  Ray,
  Scene,
  SceneMode
} from "terriajs-cesium";

type Tile = any;
type GlobeSurfaceTile = any;
type TerrainEncoding = any;

export interface PickTriangleResult
  extends PickTriangleFromGlobeSurfaceTileResult {
  tile: Tile;
}

const scratchArray: Tile[] = [];
const scratchSphereIntersectionResult = {
  start: 0.0,
  stop: 0.0
};

// This is adapted from CesiumJS's `Globe.pick` function, but extended
// to return more information.
export default function pickTriangle(
  ray: Ray,
  scene: Scene,
  cullBackFaces: boolean,
  result: PickTriangleResult
): PickTriangleResult | undefined {
  const mode = scene.mode;
  const projection = scene.mapProjection;

  const sphereIntersections = scratchArray;
  sphereIntersections.length = 0;

  const globeAny: any = scene.globe;
  const surface = globeAny._surface;

  const tilesToRender = surface._tilesToRender;
  let length = tilesToRender.length;

  let tile;
  let i;

  for (i = 0; i < length; ++i) {
    tile = tilesToRender[i];
    const surfaceTile = tile.data;

    if (!defined(surfaceTile)) {
      continue;
    }

    let boundingVolume = surfaceTile.pickBoundingSphere;
    if (mode !== SceneMode.SCENE3D) {
      surfaceTile.pickBoundingSphere = boundingVolume =
        BoundingSphere.fromRectangleWithHeights2D(
          tile.rectangle,
          projection,
          surfaceTile.tileBoundingRegion.minimumHeight,
          surfaceTile.tileBoundingRegion.maximumHeight,
          boundingVolume
        );
      Cartesian3.fromElements(
        boundingVolume.center.z,
        boundingVolume.center.x,
        boundingVolume.center.y,
        boundingVolume.center
      );
    } else if (defined(surfaceTile.renderedMesh)) {
      BoundingSphere.clone(
        surfaceTile.tileBoundingRegion.boundingSphere,
        boundingVolume
      );
    } else {
      // So wait how did we render this thing then? It shouldn't be possible to get here.
      continue;
    }

    const boundingSphereIntersection = IntersectionTests.raySphere(
      ray,
      boundingVolume,
      scratchSphereIntersectionResult
    );
    if (defined(boundingSphereIntersection)) {
      sphereIntersections.push(tile);
    }
  }

  sphereIntersections.sort(createComparePickTileFunction(ray.origin));

  let intersection;
  length = sphereIntersections.length;
  for (i = 0; i < length; ++i) {
    intersection = pickTriangleFromGlobeSurfaceTile(
      sphereIntersections[i].data,
      ray,
      scene.mode,
      scene.mapProjection,
      cullBackFaces,
      result
    );
    if (intersection !== undefined) {
      result.tile = sphereIntersections[i];
      break;
    }
  }

  return intersection === undefined ? undefined : result;
}

function createComparePickTileFunction(rayOrigin: Cartesian3) {
  return function (a: Tile, b: Tile) {
    const aDist = BoundingSphere.distanceSquaredTo(
      a.data.pickBoundingSphere,
      rayOrigin
    );
    const bDist = BoundingSphere.distanceSquaredTo(
      b.data.pickBoundingSphere,
      rayOrigin
    );

    return aDist - bDist;
  };
}

const scratchCartographic = new Cartographic();

function getPosition(
  encoding: TerrainEncoding,
  mode: SceneMode,
  projection: MapProjection,
  vertices: any,
  index: number,
  result: Cartesian3
) {
  let position = encoding.getExaggeratedPosition(vertices, index, result);

  if (defined(mode) && mode !== SceneMode.SCENE3D) {
    const ellipsoid = projection.ellipsoid;
    const positionCartographic = ellipsoid.cartesianToCartographic(
      position,
      scratchCartographic
    );
    position = projection.project(positionCartographic, result);
    position = Cartesian3.fromElements(
      position.z,
      position.x,
      position.y,
      result
    );
  }

  return position;
}

const scratchV0 = new Cartesian3();
const scratchV1 = new Cartesian3();
const scratchV2 = new Cartesian3();

export interface PickTriangleFromGlobeSurfaceTileResult {
  intersection: Cartesian3;
  v0: Cartesian3;
  v1: Cartesian3;
  v2: Cartesian3;
}

function pickTriangleFromGlobeSurfaceTile(
  globeSurfaceTile: GlobeSurfaceTile,
  ray: Ray,
  mode: SceneMode,
  projection: MapProjection,
  cullBackFaces: boolean,
  result: PickTriangleFromGlobeSurfaceTileResult
): PickTriangleFromGlobeSurfaceTileResult | undefined {
  const mesh = globeSurfaceTile.renderedMesh;
  if (!defined(mesh)) {
    return undefined;
  }

  const vertices = mesh.vertices;
  const indices = mesh.indices;
  const encoding = mesh.encoding;
  const indicesLength = indices.length;

  let minT = Number.MAX_VALUE;

  for (let i = 0; i < indicesLength; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];

    const v0 = getPosition(encoding, mode, projection, vertices, i0, scratchV0);
    const v1 = getPosition(encoding, mode, projection, vertices, i1, scratchV1);
    const v2 = getPosition(encoding, mode, projection, vertices, i2, scratchV2);

    const t = IntersectionTests.rayTriangleParametric(
      ray,
      v0,
      v1,
      v2,
      cullBackFaces
    );
    if (defined(t) && t < minT && t >= 0.0) {
      minT = t;
      Cartesian3.clone(v0, result.v0);
      Cartesian3.clone(v1, result.v1);
      Cartesian3.clone(v2, result.v2);
    }
  }

  if (minT === Number.MAX_VALUE) {
    return undefined;
  }

  Ray.getPoint(ray, minT, result.intersection);
  return result;
}
