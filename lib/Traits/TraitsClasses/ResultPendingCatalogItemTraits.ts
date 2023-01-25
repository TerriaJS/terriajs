import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";

interface ResultPendingCatalogItemTraits {
  disableAboutData: boolean;
}

class ResultPendingCatalogItemTraits extends mixTraits(CatalogMemberTraits) {}

export default ResultPendingCatalogItemTraits;
