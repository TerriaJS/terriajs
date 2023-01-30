import { computed, makeObservable } from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import ExportableTraits from "../Traits/TraitsClasses/ExportableTraits";

export type ExportData = string | { name: string; file: Blob };

function ExportableMixin<
  T extends AbstractConstructor<Model<ExportableTraits>>
>(Base: T) {
  abstract class ExportableMixin extends Base {
    protected abstract get _canExportData(): boolean;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

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
