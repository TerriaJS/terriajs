import { configure, runInAction, autorun } from 'mobx';
import primitiveTrait from '../../lib/Traits/primitiveTrait';
import objectTrait from '../../lib/Traits/objectTrait';
import ModelTraits from '../../lib/Traits/ModelTraits';
import Model from '../../lib/Models/Model';
import Terria from '../../lib/Models/Terria';
import objectArrayTrait from '../../lib/Traits/objectArrayTrait';

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

    static isRemoval(traits: InnerTraits) {
        return traits.bar === 42;
    }
}

class OuterTraits extends ModelTraits {
    @objectArrayTrait({
        type: InnerTraits,
        name: 'Inner',
        description: 'Inner',
        idProperty: 'foo'
    })
    inner?: InnerTraits[];
}

class TestModel extends Model(OuterTraits) {

}

describe('objectArrayTrait', function() {
    it('returns undefined if all strata are undefined', function() {
        const terria = new Terria();
        const model = new TestModel('test', terria);
        model.strata.set('definition', model.createStratumInstance());
        model.strata.set('user', model.createStratumInstance());
        expect(model.inner).toBeUndefined();
    });

    it('combines values from different strata', function() {
        const terria = new Terria();
        const model = new TestModel('test', terria);

        const definition = model.createStratumInstance();
        const user = model.createStratumInstance();
        model.strata.set('definition', definition);
        model.strata.set('user', user);

        definition.inner = [ new InnerTraits(), new InnerTraits() ];
        definition.inner[0].foo = 'a';
        definition.inner[0].bar = 1;
        definition.inner[1].foo = 'b';
        definition.inner[1].bar = 2;
        definition.inner[1].baz = true;

        user.inner = [ new InnerTraits(), new InnerTraits() ];
        user.inner[0].foo = 'b';
        user.inner[0].baz = false;
        user.inner[1].foo = 'c';
        user.inner[1].bar = 3;

        expect(model.inner).toBeDefined();
        if (model.inner !== undefined) {
            expect(model.inner.length).toEqual(3);

            const a = model.inner.filter(x => x.foo === 'a')[0];
            const b = model.inner.filter(x => x.foo === 'b')[0];
            const c = model.inner.filter(x => x.foo === 'c')[0];
            expect(a).toBeDefined();
            expect(b).toBeDefined();
            expect(c).toBeDefined();

            expect(a.bar).toEqual(1);
            expect(a.baz).toBeUndefined();
            expect(b.bar).toEqual(2);
            expect(b.baz).toEqual(false);
            expect(c.bar).toEqual(3);
            expect(c.baz).toBeUndefined();
        }
    });

    it('updates to reflect array elements added after evaluation', function() {
        const terria = new Terria();
        const model = new TestModel('test', terria);

        const definition = model.createStratumInstance();
        const user = model.createStratumInstance();
        model.strata.set('definition', definition);
        model.strata.set('user', user);

        definition.inner = [ new InnerTraits(), new InnerTraits() ];
        definition.inner[0].foo = 'a';
        definition.inner[0].bar = 1;
        definition.inner[1].foo = 'b';
        definition.inner[1].bar = 2;
        definition.inner[1].baz = true;

        user.inner = [ new InnerTraits(), new InnerTraits() ];
        user.inner[0].foo = 'b';
        user.inner[0].baz = false;
        user.inner[1].foo = 'c';
        user.inner[1].bar = 3;

        expect(model.inner).toBeDefined();

        if (model.inner !== undefined) {
            expect(model.inner.length).toEqual(3);

            const newOne = new InnerTraits();
            definition.inner.push(newOne);
            newOne.foo = 'c';
            newOne.bar = 4;
            newOne.baz = true;

            expect(model.inner.length).toEqual(3);

            const c = model.inner.filter(x => x.foo === 'c')[0];
            expect(c.bar).toEqual(3);
            expect(c.baz).toEqual(true);
        }
    });

    it('allows strata to remove elements', function() {
        const terria = new Terria();
        const model = new TestModel('test', terria);

        const definition = model.createStratumInstance();
        const user = model.createStratumInstance();
        model.strata.set('definition', definition);
        model.strata.set('user', user);

        definition.inner = [ new InnerTraits(), new InnerTraits() ];
        definition.inner[0].foo = 'a';
        definition.inner[0].bar = 1;
        definition.inner[1].foo = 'b';
        definition.inner[1].bar = 2;
        definition.inner[1].baz = true;

        user.inner = [ new InnerTraits(), new InnerTraits() ];
        user.inner[0].foo = 'b';
        user.inner[0].bar = 42; // indicates removed, according to InnerTraits.isRemoval.
        user.inner[1].foo = 'c';
        user.inner[1].bar = 3;

        expect(definition.inner.length).toEqual(2);
    });
});
