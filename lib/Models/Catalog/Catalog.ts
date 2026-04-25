import i18next from "i18next";
import { makeObservable, observable } from "mobx";
import { USER_ADDED_CATEGORY_ID } from "../../Core/addedByUser";
import CatalogSearchProviderMixin from "../../ModelMixins/SearchProviders/CatalogSearchProviderMixin";
import CommonStrata from "../Definition/CommonStrata";
import CatalogIndex from "../SearchProviders/CatalogIndex";
import CatalogSearchProvider from "../SearchProviders/CatalogSearchProvider";
import Terria from "../Terria";
import CatalogGroup from "./CatalogGroup";

const createUserAddedDataGroup = (terria: Terria) => {
  const userAddedDataGroup = new CatalogGroup(USER_ADDED_CATEGORY_ID, terria);
  const userAddedGroupName: string = i18next.t("core.userAddedData");
  userAddedDataGroup.setTrait(
    CommonStrata.definition,
    "name",
    userAddedGroupName
  );
  const userAddedGroupDescription: string = i18next.t(
    "models.catalog.userAddedDataGroup"
  );
  userAddedDataGroup.setTrait(
    CommonStrata.definition,
    "description",
    userAddedGroupDescription
  );
  return userAddedDataGroup;
};

export default class Catalog {
  private _index: CatalogIndex | undefined;
  @observable
  group: CatalogGroup;

  _userAddedDataGroup: CatalogGroup;

  @observable
  searchProvider: CatalogSearchProviderMixin.Instance | undefined;

  readonly terria: Terria;

  get index() {
    return this._index;
  }

  constructor(
    terria: Terria,
    catalogSearchProvider?: CatalogSearchProviderMixin.Instance
  ) {
    makeObservable(this);
    this.terria = terria;
    this.group = new CatalogGroup("/", this.terria);
    this._userAddedDataGroup = createUserAddedDataGroup(this.terria);
    this.terria.addModel(this.group);
    this.terria.addModel(this._userAddedDataGroup);

    this.searchProvider =
      catalogSearchProvider ??
      new CatalogSearchProvider(
        "catalog-search-provider",
        terria,
        terria.searchBarModel.minCharacters
      );
  }

  destroy() {
    this.terria.removeModelReferences(this.group);
    this.terria.removeModelReferences(this._userAddedDataGroup);
  }

  get userAddedDataGroup(): CatalogGroup {
    return this._userAddedDataGroup;
  }

  setIndex(index: CatalogIndex) {
    this._index = index;
  }
}
