export default function freezeInDebug<T>(o: T): Readonly<T> {
  //>>includeStart('debug', pragmas.debug);
  o = Object.freeze(o);
  //>>includeEnd('debug');
  return o;
}
