export interface ExportableData {
  exportData: () => Promise<string | { name: string; file: Blob }>;
}

namespace ExportableData {
  export function is(model: ExportableData): model is ExportableData {
    return "exportData" in model;
  }
}

export default ExportableData;
