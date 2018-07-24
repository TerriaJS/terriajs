import { autorun, computed, configure, observable, runInAction, action } from 'mobx';
import LoadableStratum from './LoadableStratum';

configure({
    enforceActions: true,
    computedRequiresReaction: true
});

describe('LoadableStratum', function() {
    interface LoadResult {
        fooSource: string;
    }

    class TestStratum extends LoadableStratum<LoadResult> {
        callsToLoad: number = 0;

        load(): Promise<LoadResult> {
            ++this.callsToLoad;

            const fooSource = this.fooSource;

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve({
                        fooSource
                    });
                }, 1);
            });
        }

        //@action
        applyLoad(loadResult: LoadResult) {
            this.foo = loadResult.fooSource;
            this.bar = 42;
            this.baz = 'loaded';
        }

        @observable
        foo?: string;

        @observable
        bar?: number;

        @observable
        baz?: string;

        @observable
        fooSource = 'test';

        @computed
        get test() {
            this.loadIfNeeded();
            return this.foo;
        }
    }

    it('has isLoading and loadPromise properties', function() {
        const stratum = new TestStratum();
        expect('isLoading' in stratum).toBe(true);
        expect('loadPromise' in stratum).toBe(true);
    });

    it('initially is not loading', function() {
        const stratum = new TestStratum();
        expect(stratum.isLoading).toBe(false);
    });

    it('checking isLoading does not trigger load', function() {
        const stratum = new TestStratum();
        expect(stratum.isLoading).toBe(false);
        expect(stratum.callsToLoad).toBe(0);
    });

    it('checking loadPromise does not trigger load', function() {
        const stratum = new TestStratum();

        autorun(() => {
            expect(stratum.loadPromise).toBeUndefined();
        })();

        expect(stratum.callsToLoad).toBe(0);
    });

    it('loads when loadIfNeeded is called.', function() {
        const stratum = new TestStratum();

        autorun(() => {
            stratum.loadIfNeeded();
        })();

        expect(stratum.callsToLoad).toBe(1);
    });


    it('can call loadIfNeeded inside a computed property', function() {
        const stratum = new TestStratum();

        autorun(() => {
            expect(stratum.test).toBe(stratum.foo);
        })();

        expect(stratum.callsToLoad).toBe(1);
    });

    it('loads only once even if loadIfNeeded is called twice.', function() {
        const stratum = new TestStratum();

        autorun(() => {
            stratum.loadIfNeeded();
            stratum.loadIfNeeded();
        })();

        expect(stratum.callsToLoad).toBe(1);
    });

    it('does not call load multiple times even if loadPromise and multiple other properties are accessed.', function() {
        const stratum = new TestStratum();

        autorun(() => {
            expect(stratum.loadPromise).toBeUndefined();
            expect(stratum.foo).toBeUndefined();
            expect(stratum.bar).toBeUndefined();
            stratum.loadIfNeeded();
        })();

        expect(stratum.callsToLoad).toBe(1);
    });

    it('reloads if an observable property changes', function(done) {
        const stratum = new TestStratum();

        let iteration = 0;
        autorun(reaction => {
            switch (iteration) {
                case 0:
                    expect(stratum.test).toBeUndefined();
                    break;
                case 1:
                    expect(stratum.test).toBe('test');

                    setTimeout(() => {
                        runInAction(() => {
                            stratum.fooSource = 'second';
                        });
                    });
                    break;
                case 2:
                    expect(stratum.test).toBe('second');

                    setTimeout(() => {
                        reaction.dispose();
                        expect(stratum.callsToLoad).toBe(2);
                        done();
                    });
                    break;
                default:
                    fail('Too many runs');
            }
            ++iteration;
        });
    });

    if (process.env.NODE_ENV !== "production") {
        // In a production environment, MobX doesn't check invariants.
        it('cannot trigger load outside a reactive context', function() {
            const stratum = new TestStratum();
            expect(function() {
                stratum.loadIfNeeded();
            }).toThrow();
        });
    }
});
