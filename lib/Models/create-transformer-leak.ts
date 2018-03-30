import { createTransformer } from 'mobx-utils';

const f = createTransformer((a: number) => a);

let sum = 0;
for (let i = 0; i < 10000000; ++i) {
    sum += f(i);
}

console.log(sum);
