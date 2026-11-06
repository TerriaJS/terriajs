declare module "*.DAC";
declare module "*.css";
declare module "*.scss"; // for side-effect/inline-loader scss imports (per-file css-module typings cover the rest)
declare module "*.csv";
declare module "*.xml";
declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.css";
declare module "*.geojson";
declare module "*.pbf";
declare module "*.czml";
declare module "*.kml";
// Vite (the new UI's tests) imports a file as text with ?raw
declare module "*?raw" {
  const content: string;
  export default content;
}
