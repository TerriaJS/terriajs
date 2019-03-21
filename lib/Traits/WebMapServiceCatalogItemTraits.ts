import mixCatalogMemberTraits from './mixCatalogMemberTraits';
import primitiveTrait from './primitiveTrait';
import ModelTraits from './ModelTraits';
import mixUrlTraits from './mixUrlTraits';
import mixGetCapabilitiesTraits from './mixGetCapabilitiesTraits';
import mixRasterLayerTraits from './mixRasterLayerTraits';
import { TraitsConstructor } from '../Models/Model';
import Trait from './Trait';

export default class WebMapServiceCatalogItemTraits extends mixGetCapabilitiesTraits(mixRasterLayerTraits(mixUrlTraits(mixCatalogMemberTraits(ModelTraits)))) {
    @primitiveTrait({
        type: 'string',
        name: 'Is GeoServer',
        description: 'True if this WMS is a GeoServer; otherwise, false.'
    })
    isGeoServer: boolean = false;

    @primitiveTrait({
        type: 'string',
        name: 'Intervals',
        description: 'Intervals'
    })
    intervals?: any; // TODO

    @primitiveTrait({
        type: 'string',
        name: 'Layer(s)',
        description: 'The layer or layers to display.'
    })
    layers?: string;

    @primitiveTrait({
        type: 'string',
        name: 'Available Styles',
        description: 'The available styles.' // TODO
    })
    availableStyles?: any; // TODO
}

// interface Test {
//     foo: number;
//     bar?: number;
//     baz: number | undefined;
// }

// let x: Complete<WebMapServiceCatalogItemTraits> = <any>{};
// const q = x.opacity;
// const r = x.layers;
// console.log(q);
// console.log(r);

// let y: Complete<Test> = <any>{};
// const foo: number = y.foo;
// const bar: number | undefined = y.bar;
// const baz: number | undefined = y.baz;

// interface Test2 {
//     foo: number;
//     bar: number | undefined;
//     baz: number | undefined;
// }

// let t1: Test = <any>{};
// let t2: Test2 = <any>{};

// t1 = t2;
// t2 = t1;

// interface InterfaceWithOptional {
//     foo?: number;
//   }
  
//   interface InterfaceWithUndefined {
//     foo: number | undefined;
//   }
  
//   const x: InterfaceWithUndefined = <InterfaceWithOptional><any>{};
  