import defineLoadableStratum from '../../lib/Models/defineLoadableStratum';
import ModelDefinition from '../../lib/Models/ModelDefinition';
import { primitiveProperty } from '../../lib/Models/ModelProperties';
import { autorun, observable, runInAction } from 'mobx';

describe('defineLoadableStratum', function() {
    class TestDefinition extends ModelDefinition {
        @primitiveProperty({
            type: 'string',
            name: 'Foo',
            description: 'A description of Foo.'
        })
        foo: string;

        @primitiveProperty({
            type: 'number',
            name: 'Bar',
            description: 'A description of Bar.'
        })
        bar: number;

        @primitiveProperty({
            type: 'string',
            name: 'Baz',
            description: 'A description of Boo.'
        })
        baz: string;
    }

    it('has isLoading and loadPromise properties', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined, 'foo', 'baz');
        const stratum = new Stratum(values => Promise.resolve());
        expect('isLoading' in stratum).toBe(true);
        expect('loadPromise' in stratum).toBe(true);
    });

    it('initially is not loading', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined, 'foo', 'baz');
        const stratum = new Stratum(values => Promise.resolve());
        expect(stratum.isLoading).toBe(false);
    });

    it('checking isLoading does not trigger load', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined, 'foo', 'baz');
        const stratum = new Stratum(values => {
            fail('load was called unexpectedly.');
            return Promise.resolve();
        });
        expect(stratum.isLoading).toBe(false);
    });

    it('has only the specified properties', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined, 'foo', 'baz');
        const stratum = new Stratum(values => Promise.resolve());
        expect('foo' in stratum).toBe(true);
        expect('baz' in stratum).toBe(true);
        expect('bar' in stratum).toBe(false);
    });

    it('has all properties if none are specified', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined);
        const stratum = new Stratum(values => Promise.resolve());
        expect('foo' in stratum).toBe(true);
        expect('baz' in stratum).toBe(true);
        expect('bar' in stratum).toBe(true);
    });

    it('checking loadPromise does not trigger load', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined);

        const stratum = new Stratum(values => {
            fail('load was called unexpectedly.');
            return Promise.resolve();
        });

        autorun(() => {
            expect(stratum.loadPromise).toBeUndefined();
        })();
    });

    it('loads when loadIfNeeded is called.', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined);

        let loadCalled = false;
        const stratum = new Stratum(values => {
            loadCalled = true;
            return Promise.resolve();
        });

        autorun(() => {
            stratum.loadIfNeeded();
        })();

        expect(loadCalled).toBe(true);
    });


    it('loads when a property is accessed.', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined);

        let loadCalled = false;
        const stratum = new Stratum(values => {
            loadCalled = true;
            return Promise.resolve();
        });

        autorun(() => {
            expect(stratum.foo).toBeUndefined();
        })();

        expect(loadCalled).toBe(true);
    });

    it('loads only once even if loadIfNeeded is called twice.', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined);

        let loads = 0;
        const stratum = new Stratum(values => {
            ++loads;
            return Promise.resolve();
        });

        autorun(() => {
            stratum.loadIfNeeded();
            stratum.loadIfNeeded();
        })();

        expect(loads).toBe(1);
    });

    it('does not call load multiple times even if loadPromise and multiple other properties are accessed.', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined);

        let loads = 0;
        const stratum = new Stratum(values => {
            ++loads;
            return Promise.resolve();
        });

        autorun(() => {
            expect(stratum.loadPromise).toBeUndefined();
            expect(stratum.foo).toBeUndefined();
            expect(stratum.bar).toBeUndefined();
            stratum.loadIfNeeded();
        })();

        expect(loads).toBe(1);
    });

    it('reloads if an observable property changes', function() {
        const Stratum = defineLoadableStratum(TestDefinition, undefined);

        const test = observable({
            url: 'first'
        });

        let loads = 0;
        const stratum = new Stratum(values => {
            ++loads;
            values.foo = test.url;
            return Promise.resolve();
        });

        autorun(() => {
            expect(stratum.foo).toBe('first');
        })();

        runInAction(() => {
            test.url = 'second';
        });

        autorun(() => {
            expect(stratum.foo).toBe('second');
        })();

        expect(loads).toBe(2);
    });

    if (process.env.NODE_ENV !== "production") {
        // In a production environment, MobX doesn't check invariants.
        it('cannot trigger load outside a reactive context', function() {
            const Stratum = defineLoadableStratum(TestDefinition, undefined);
            const stratum = new Stratum(values => Promise.resolve());
            expect(function() {
                stratum.loadIfNeeded();
            }).toThrow();
        });
    }
});
