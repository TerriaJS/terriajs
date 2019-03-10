import Constructor from './Constructor';
import DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';

type BaseClass<T> = T extends infer TBase ? TBase : never;

//export default function superGet<TClass, TProperty extends keyof TClass>(thisClass: Constructor<TClass>, instance: TClass, propertyName: keyof BaseClass<TClass>): TClass[TProperty] {
export default function superGet(source: any, propertyName: any, instance: any): any {
    while (source !== undefined) {
        let propertyDescriptor;
        if (source.__mobxDecorators !== undefined && source.__mobxDecorators[propertyName] !== undefined) {
            propertyDescriptor = source.__mobxDecorators[propertyName].descriptor;
        }

        if (propertyDescriptor === undefined) {
            propertyDescriptor = Object.getOwnPropertyDescriptor(source, propertyName);
        }

        if (propertyDescriptor !== undefined) {
            if (propertyDescriptor.get !== undefined) {
                return propertyDescriptor.get.call(instance);
            } else {
                return propertyDescriptor.value;
            }
        }

        source = Object.getPrototypeOf(source);
    }

    // TODO: can we fail this at compile time somehow?
    throw new DeveloperError('A property named ' + propertyName + ' was not found in any superclass.');
}
