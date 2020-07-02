import Model from "./Model";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";

interface ExportableData extends Model<CatalogMemberTraits> {
  /**
   * @returns an async function which returns a URL (to download) or a Blob with filename
   *
   */
  exportData: () => Promise<string | { name: string; file: Blob } | undefined>;

  canExportData: boolean;
}

namespace ExportableData {
  export function is(model: ExportableData): model is ExportableData {
    return "exportData" in model;
  }
}

export default ExportableData;
