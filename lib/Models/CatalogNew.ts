import Terria from "./Terria";
import CatalogGroup from "./CatalogGroupNew";

export default class Catalog {
    readonly group: CatalogGroup;
    readonly terria: Terria;

    constructor(terria: Terria) {
        this.terria = terria;
        this.group = new CatalogGroup('/', this.terria);
    }
}
