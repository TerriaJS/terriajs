import { autorun } from 'mobx';
import { createTransformer } from 'mobx-utils';
import * as defined from 'terriajs-cesium/Source/Core/defined';

export default function autoUpdate(updater) {
    return function(c, propertyName, property) {
        const transformer = createTransformer(value => {
            return autorun(() => {
                updater.call(this, value);
            });
        }, (disposer, value) => {
            console.log('cleanup');
            disposer();
        });

        const originalGet = property.get;
        property.get = function() {
            const value = originalGet.call(this);
            if (defined(value)) {
                console.log('auto-updating result of ' + propertyName);
                transformer.call(this, value);
            }
            return value;
        };
    };
}
