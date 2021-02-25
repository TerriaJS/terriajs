// 'use strict';

// // var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
// var renderAndSubscribe = require('../../lib/ReactViews/renderAndSubscribe');

// describe('renderAndSubscribe', function() {
//     var spy;
//     var someObject;

//     beforeEach(function() {
//         spy = jasmine.createSpyObj('component', ['forceUpdate']);

//         someObject = {
//             foo: 5,
//             bar: 'hello'
//         };

//         knockout.track(someObject, ['foo', 'bar']);
//     });

//     it('calls forceUpdate when observables used in the render change', function() {
//         var result = renderAndSubscribe(spy, function() {
//             return someObject.foo;
//         });

//         expect(result).toBe(5);
//         expect(spy.forceUpdate).not.toHaveBeenCalled();

//         someObject.foo = 6;
//         expect(spy.forceUpdate).toHaveBeenCalled();
//     });

//     it('does not call forceUpdate for observables accessed in a nested call to renderAndSubscribe', function() {
//         var secondSpy = jasmine.createSpyObj('nested component', ['forceUpdate']);

//         var result = renderAndSubscribe(spy, function() {
//             renderAndSubscribe(secondSpy, function() {
//                 return someObject.bar;
//             });
//             return someObject.foo;
//         });

//         expect(result).toBe(5);
//         expect(spy.forceUpdate).not.toHaveBeenCalled();
//         expect(secondSpy.forceUpdate).not.toHaveBeenCalled();

//         someObject.bar = 'goodbye';
//         expect(spy.forceUpdate).not.toHaveBeenCalled();
//         expect(secondSpy.forceUpdate).toHaveBeenCalled();
//     });

//     it('unsubscribes when the component is unmounted', function() {
//         var spy = jasmine.createSpyObj('component', ['forceUpdate', 'componentWillUnmount']);

//         var result = renderAndSubscribe(spy, function() {
//             return someObject.foo;
//         });

//         spy.componentWillUnmount();

//         expect(result).toBe(5);
//         expect(spy.componentWillUnmount).toHaveBeenCalled();

//         someObject.foo = 6;
//         expect(spy.forceUpdate).not.toHaveBeenCalled();
//     });
// });
