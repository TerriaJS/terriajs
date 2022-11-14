import Model from "../Models/Definition/Model";
import Constructor from "../Core/Constructor";
import ExportableTraits from "../Traits/TraitsClasses/ExportableTraits";
import { computed } from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";

export type ExportData = string | { name: string; file: Blob };

interface IExportableMixin {
  canExportData: boolean;
  exportData(): Promise<ExportData | undefined> | undefined;
}

function ExportableMixin<T extends Constructor<Model<ExportableTraits>>>(
  Base: T
): T & AbstractConstructor<IExportableMixin> {
  abstract class ExportableMixin extends Base implements IExportableMixin {
    protected abstract get _canExportData(): boolean;

    /**
     * Indicates if model is able to export data (will turn on/off UI elements)
     */
    @computed get canExportData() {
      return !this.disableExport && this._canExportData;
    }

    protected abstract _exportData(): Promise<ExportData | undefined>;

    /**
     * @returns an async function which returns a URL (to download) or a Blob with filename
     */
    exportData() {
      if (this.canExportData) {
        return this._exportData();
      }
    }
  }

  return ExportableMixin;
}

namespace ExportableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ExportableMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && "exportData" in model && "canExportData" in model;
  }
}

export default ExportableMixin;
