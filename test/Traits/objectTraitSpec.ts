import { configure, runInAction, autorun } from 'mobx';
import primitiveTrait from '../../lib/Traits/primitiveTrait';
import objectTrait from '../../lib/Traits/objectTrait';
import ModelTraits from '../../lib/Traits/ModelTraits';
import Model from '../../lib/Models/Model';
import Terria from '../../lib/Models/Terria';
import createStratumInstance from '../../lib/Models/createStratumInstance';

configure({
    enforceActions: true,
    computedRequiresReaction: true
});

class InnerTraits extends ModelTraits {
    @primitiveTrait({
        type: 'string',
        name: 'Foo',
        description: 'Foo'
    })
    foo?: string;

    @primitiveTrait({
        type: 'number',
        name: 'Bar',
        description: 'Bar'
    })
    bar?: number;

    @primitiveTrait({
        type: 'boolean',
        name: 'Baz',
        description: 'Baz'
    })
    baz?: boolean;
}

class OuterTraits extends ModelTraits {
    @objectTrait({
        type: InnerTraits,
        name: 'Inner',
        description: 'Inner'
    })
    inner?: InnerTraits;
}

class TestModel extends Model(OuterTraits) {

}

describe('objectTrait', function() {
    it('returns undefined if all strata are undefined', function() {
        const terria = new Terria();
        const model = new TestModel('test', terria);
        model.strata.set('definition', createStratumInstance(OuterTraits));
        model.strata.set('user', createStratumInstance(OuterTraits));
        expect(model.inner).toBeUndefined();
    });

    it('combines values from different strata', function() {
        const terria = new Terria();
        const model = new TestModel('test', terria);

        const definition = createStratumInstance(OuterTraits);
        const user = createStratumInstance(OuterTraits);
        model.strata.set('definition', definition);
        model.strata.set('user', user);

        definition.inner = createStratumInstance(InnerTraits);
        definition.inner.foo = 'a';
        definition.inner.bar = 1;

        user.inner = createStratumInstance(InnerTraits);
        user.inner.bar = 2;
        user.inner.baz = true;

        expect(model.inner).toBeDefined();

        if (model.inner !== undefined) {
            expect(model.inner.foo).toEqual('a');
            expect(model.inner.bar).toEqual(2);
            expect(model.inner.baz).toEqual(true);
        }
    });

    it('updates to reflect properties added after evaluation', function() {
        const terria = new Terria();
        const model = new TestModel('test', terria);

        const definition = createStratumInstance(OuterTraits);
        const user = createStratumInstance(OuterTraits);
        model.strata.set('definition', definition);
        model.strata.set('user', user);

        definition.inner = createStratumInstance(InnerTraits);
        definition.inner.foo = 'a';
        definition.inner.bar = 1;

        user.inner = createStratumInstance(InnerTraits);

        expect(model.inner).toBeDefined();

        if (model.inner !== undefined) {
            expect(model.inner.foo).toEqual('a');
            expect(model.inner.bar).toEqual(1);
            expect(model.inner.baz).toBeUndefined();

            runInAction(() => {
                expect(user.inner).toBeDefined();
                if (user.inner !== undefined) {
                    user.inner.bar = 2;
                }
            });

            expect(model.inner.bar).toEqual(2);
        }
    });
});
