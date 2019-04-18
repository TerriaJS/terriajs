import { computed, observable, runInAction } from 'mobx';
import Constructor from '../Core/Constructor';
import Model from '../Models/Model';
import CatalogMemberTraits from '../Traits/CatalogMemberTraits';
import { createTransformer } from 'mobx-utils';

type CatalogMember = Model<CatalogMemberTraits>;

function CatalogMemberMixin<T extends Constructor<CatalogMember>>(Base: T) {
    abstract class CatalogMemberMixin extends Base {
        abstract get type(): string;

        /**
         * Gets a value indicating whether metadata is currently loading.
         */
        get isLoadingMetadata(): boolean {
            return this._isLoadingMetadata;
        }

        @observable
        private _isLoadingMetadata = false;

        private _metadataPromise: Promise<void> | undefined = undefined;

        /**
         * Asynchronously loads metadata.
         */
        loadMetadata(): Promise<void> {
            const newPromise = this.loadMetadataKeepAlive;
            if (newPromise !== this._metadataPromise) {
                if (this._metadataPromise) {
                    // TODO - cancel old promise
                    //this._metadataPromise.cancel();
                }

                this._metadataPromise = newPromise;

                runInAction(() => {
                    this._isLoadingMetadata = true;
                });
                newPromise.then((result) => {
                    runInAction(() => {
                        this._isLoadingMetadata = false;
                    });
                    return result;
                }).catch((e) => {
                    runInAction(() => {
                        this._isLoadingMetadata = false;
                    });
                    throw e;
                });
            }

            return newPromise;
        }

        /**
         * Gets a promise for loaded metadata. This method does _not_ need to consider
         * whether the metadata is already loaded.
         */
        protected abstract get loadMetadataPromise(): Promise<void>;

        @computed({ keepAlive: true })
        private get loadMetadataKeepAlive(): Promise<void> {
            return this.loadMetadataPromise;
        }

        get hasCatalogMemberMixin() {
            return true;
        }

        @computed
        get nameInCatalog(): string | undefined {
            return super.nameInCatalog || this.name;
        }

        @computed
        get nameSortKey() {
            var parts = (this.nameInCatalog || '').split(/(\d+)/);
            return parts.map(function(part) {
                var parsed = parseInt(part, 10);
                if (parsed === parsed) {
                    return parsed;
                } else {
                    return part.trim().toLowerCase();
                }
            });
        }
    }

    return CatalogMemberMixin;
}

namespace CatalogMemberMixin {
    export interface CatalogMemberMixin extends InstanceType<ReturnType<typeof CatalogMemberMixin>> {}
    export function isMixedInto(model: any): model is CatalogMemberMixin {
        return model && model.hasCatalogMemberMixin;
    }
}

export default CatalogMemberMixin;
