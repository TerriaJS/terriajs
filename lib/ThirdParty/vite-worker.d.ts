declare module "*?worker" {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}
