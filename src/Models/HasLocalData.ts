interface HasLocalData {
  hasLocalData: boolean;
  setFileInput(file: File): void;
}

namespace HasLocalData {
  export function is(model: any): model is HasLocalData {
    return "hasLocalData" in model;
  }
}

export default HasLocalData;
