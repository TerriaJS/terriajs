declare module "*.css" {
  const content: string;
  // eslint-disable-next-line no-restricted-exports
  export default content;
}

// Story images, which Vite serves at the URL it imports as
declare module "*.jpg" {
  const src: string;
  // eslint-disable-next-line no-restricted-exports
  export default src;
}
