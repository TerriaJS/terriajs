// function autoUpdate(updater) {
//     return function(c, propertyName, property) {
//         const originalGet = property.get;

//         let disposeAutorun;
//         let disposeOnBecomeObserved;

//         function dispose() {
//             console.log('dispose');
//             if (disposeAutorun) {
//                 console.log('disposing autorun');
//                 disposeAutorun();
//                 disposeAutorun = undefined;
//             }
//             if (disposeOnBecomeObserved) {
//                 console.log('disposing onBecomeUnobserved');
//                 disposeOnBecomeObserved();
//                 disposeOnBecomeObserved = undefined;
//             }
//         }

//         property.get = function() {
//             dispose();
//             console.log('recreate');
//             onBecomeObserved(this, propertyName, () => {
//                 console.log('** observed');
//             });

//             const value = originalGet.call(this);
//             disposeAutorun = autorun(() => updater(value));
//             disposeOnBecomeObserved = onBecomeUnobserved(this, propertyName, () => {
//                 console.log('unobserved');
//                 dispose();
//             });
//             return value;
//         };
//     };
// }

// class Test {
//     @observable foo = {};

//     @computed
//     @autoUpdate(value => { console.log('update'); value.time = now(); })
//     get test() {
//         return this.foo;
//     }
// }

// const t = new Test();
// console.log(t.test);

// let count = 0;
// const d = autorun(() => {
//     console.log('autorun1: ' + t.test);
// });

// setTimeout(() => {
//     runInAction(() => {
//         t.foo = { new:true };
//     });
// }, 2000);
// setTimeout(d, 5000);

// setTimeout(() => {
//     autorun(() => {
//         console.log('autorun2: ' + t.test);
//     });
// }, 7000);
