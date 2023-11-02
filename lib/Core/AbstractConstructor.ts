type AbstractConstructor<T> = Function & { prototype: T };
export default AbstractConstructor;
