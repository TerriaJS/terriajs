import DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';

/**
 * Gets the value of a named property from a superclass of an instance. If the superclass has
 * MobX decorators, they are ignored, and the property value is retrieved directly.
 * @param source The first class to search for the named property.
 * @param propertyName The name of the property to get.
 * @param instance The instance for which to get the property value.
 */
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

    throw new DeveloperError('A property named ' + propertyName + ' was not found in any superclass.');
}
