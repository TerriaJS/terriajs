import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import loadArrayBuffer from "../../../Core/loadArrayBuffer";
import GltfMixin from "../../../ModelMixins/GltfMixin";
import AssImpCatalogItemTraits from "../../../Traits/TraitsClasses/AssImpCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";

const FileSaver = require("file-saver");
const assimpjs = require("assimpjs");

export default class AssImpCatalogItem extends GltfMixin(
  CreateModel(AssImpCatalogItemTraits)
) {
  static readonly type = "assimp";

  get type() {
    return AssImpCatalogItem.type;
  }

  protected async forceLoadMapItems(): Promise<void> {
    const urls =
      this.urls.length > 0 ? this.urls : filterOutUndefined([this.url]);
    if (urls.length === 0) return;

    const files = await Promise.all(
      urls.map(async url => {
        const arrayBuffer = await loadArrayBuffer(url);
        const uri = new URI(url);
        return {
          url: uri.absoluteTo(window.location.href).toString(),
          name: uri.filename(),
          arrayBuffer
        };
      })
    );

    const ajs = await assimpjs();
    // create new file list object, and add the files
    let fileList = new ajs.FileList();
    for (let i = 0; i < files.length; i++) {
      fileList.AddFile(files[i].name, new Uint8Array(files[i].arrayBuffer));
    }

    // convert file list to assimp json
    let result = ajs.ConvertFileList(fileList, "gltf2");

    console.log(result);

    const fileCount = result.FileCount();

    // check if the conversion succeeded
    if (!result.IsSuccess() || fileCount == 0) {
      throw result.GetErrorCode();
    }

    let dataUris: Map<string, string> = new Map();
    files.forEach(file => dataUris.set(file.name, file.url));

    // Go through files backward - as `gltf` file is first, followed by dependencies (eg glbs)
    // We need to correct all these paths
    for (let i = fileCount - 1; i >= 0; i--) {
      console.log(`getting file ${i}`);
      const file = result.GetFile(i);
      const path = file.GetPath();

      console.log(`result file ${path}`);

      let arrayBuffer: ArrayBuffer = file.GetContent();

      if (i === 0) {
        const file = new File([arrayBuffer], path);

        const gltfJson = JSON.parse(await file.text());

        console.log(gltfJson);

        gltfJson.buffers.forEach((buffer: any) => {
          const newUri = dataUris.get(buffer.uri);
          console.log(`replacing ${buffer.uri} with ${newUri}`);
          buffer.uri = newUri;
        });

        gltfJson.images.forEach((image: any) => {
          const newUri = dataUris.get(image.uri);
          console.log(`replacing ${image.uri} with ${newUri}`);
          image.uri = newUri;
        });

        arrayBuffer = Buffer.from(JSON.stringify(gltfJson));
      }

      const blob = new Blob([arrayBuffer]);
      const dataUrl = URL.createObjectURL(blob);
      console.log(dataUrl);
      dataUris.set(path, dataUrl);

      if (i === 0) {
        this.setTrait(CommonStrata.user, "url", dataUrl);
        console.log(`replaced url with ${dataUrl}`);
        this.hasLocalData = true;
      }

      FileSaver.saveAs(blob, path);
    }

    this.setTrait("user", "scale", 100);
    this.setTrait("user", "origin", { latitude: 0, longitude: 0, height: 0 });
  }
}
