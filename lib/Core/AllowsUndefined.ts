type AllowsUndefined<T> = (T | undefined) extends T ? true : false;
export default AllowsUndefined;
