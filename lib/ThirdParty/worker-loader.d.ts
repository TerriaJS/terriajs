declare module "worker-loader!*" {
  type value = {
    new (): Worker;
  };
  const value: value;
  export default value;
}
