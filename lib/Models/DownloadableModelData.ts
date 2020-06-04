export interface DownloadableData {
  downloadData: () => Promise<string | { name: string; file: Blob }>;
}

namespace DownloadableData {
  export function is(model: DownloadableData): model is DownloadableData {
    return "downloadData" in model;
  }
}

export default DownloadableData;
