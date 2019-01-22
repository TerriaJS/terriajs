declare module 'terriajs-cesium/Source/Core/defined';
declare module 'terriajs-cesium/Source/Core/loadXML';
declare module 'terriajs-cesium/Source/Core/DeveloperError';
declare module 'terriajs-cesium/Source/Core/RuntimeError';
declare module 'terriajs-cesium/Source/Core/Event';
declare module 'terriajs-cesium/Source/ThirdParty/when';
declare module 'terriajs-cesium/Source/Core/clone';
declare module 'terriajs-cesium/Source/Scene/WebMapServiceImageryProvider';
declare module 'terriajs-cesium/Source/Core/WebMercatorTilingScheme';
declare module 'terriajs-cesium/Source/Scene/ImageryLayer';
declare module 'terriajs-cesium/Source/Core/Rectangle' {
    export default class Rectangle {
        constructor(west: number, south: number, east: number, north: number)
        west: number
        south: number
        east: number
        height: number
        north: number

        static fromDegrees(west: number, south: number, east: number, north: number, result?: Rectangle): Rectangle

    }
}
