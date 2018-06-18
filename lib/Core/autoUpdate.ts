import { autorun } from 'mobx';
import { createTransformer } from 'mobx-utils';
import * as defined from 'terriajs-cesium/Source/Core/defined';

export default function autoUpdate(updater: (...args: any[]) => void) {
    return function(target: any, propertyName: string, property: PropertyDescriptor) {
        const transformer = createTransformer(function(this: any, value) {
            return autorun(() => {
                updater.call(this, value);
            });
        }, (disposer, value) => {
            console.log('cleanup');
            if (disposer) {
                disposer();
            }
        });

        const originalGet = property.get;
        if (originalGet) {
            property.get = function() {
                const value = originalGet.call(this);
                if (defined(value)) {
                    console.log('auto-updating result of ' + propertyName);
                    transformer.call(this, value);
                }
                return value;
            };
        }
    };
}
