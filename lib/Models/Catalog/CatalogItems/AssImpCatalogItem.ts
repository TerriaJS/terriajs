import { action, observable, runInAction } from "mobx";
import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import loadArrayBuffer from "../../../Core/loadArrayBuffer";
import loadBlob, { isZip, parseZipArrayBuffers } from "../../../Core/loadBlob";
import GltfMixin from "../../../ModelMixins/GltfMixin";
import AssImpCatalogItemTraits from "../../../Traits/TraitsClasses/AssImpCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import HasLocalData from "../../HasLocalData";

const FileSaver = require("file-saver");

export default class AssImpCatalogItem
  extends GltfMixin(CreateModel(AssImpCatalogItemTraits))
  implements HasLocalData {
  @observable
  protected gltfModelUrl: string | undefined;

  static readonly type = "assimp";

  get type() {
    return AssImpCatalogItem.type;
  }

  @observable hasLocalData = false;

  @action
  setFileInput(file: File | Blob) {
    const dataUrl = URL.createObjectURL(file);
    this.setTrait(CommonStrata.user, "urls", [dataUrl]);
    this.hasLocalData = true;
  }

  protected async forceLoadMapItems(): Promise<void> {
    const urls =
      this.urls.length > 0 ? this.urls : filterOutUndefined([this.url]);
    if (urls.length === 0) return;

    let baseUrl = this.baseUrl;
    // If no baseUrl provided - but we have a single URL -> construct baseUrl from that
    if (!baseUrl && urls.length === 1) {
      const uri = new URI(urls[0]);
      baseUrl = uri.origin() + uri.directory() + "/";
    }

    // TODO: revokeObjectURL() for all created objects

    /** Maps filenames to absolute URLs
     * This is used to substitute paths in GLTF (eg .bin files or image/texture paths)
     * - All local data (eg files converted through assimp - or locally uploaded zip file) use `createObjectURL` to get URL to local blob
     * - All remote data will use absolute URLs
     */
    const dataUrls: Map<string, string> = new Map();

    /** List of files to input into `assimpjs` */
    const files: {
      name: string;
      arrayBuffer: ArrayBuffer;
    }[] = [];

    await Promise.all(
      urls.map(async url => {
        // Treat all URLs as zip if they have been uploaded
        if (isZip(url) || this.hasLocalData) {
          const blob = await loadBlob(url);
          const zipFiles = await parseZipArrayBuffers(blob);
          zipFiles.forEach(zipFile => {
            files.push({
              name: zipFile.fileName,
              arrayBuffer: zipFile.data
            });

            // Because these unzipped files are local - we need to create URL to local blob
            const blob = new Blob([zipFile.data]);
            const dataUrl = URL.createObjectURL(blob);
            // Push filename -> local data blob URI
            dataUrls.set(zipFile.fileName, dataUrl);
          });
        } else {
          const arrayBuffer = await loadArrayBuffer(url);
          const uri = new URI(url);
          const name = uri.filename();
          files.push({
            name,
            arrayBuffer
          });

          // Because all these files are "remote", we want to substitute filename with absolute URL
          dataUrls.set(name, uri.absoluteTo(window.location.href).toString());
        }
      })
    );

    const assimpjs = (await import("assimpjs")).default;
    const ajs = await assimpjs();

    // Create new file list object, and add the files
    let fileList = new ajs.FileList();
    for (let i = 0; i < files.length; i++) {
      fileList.AddFile(files[i].name, new Uint8Array(files[i].arrayBuffer));
    }

    // Convert files to GLTF 2
    let result = ajs.ConvertFileList(fileList, "gltf2");

    const fileCount = result.FileCount();

    if (!result.IsSuccess() || fileCount == 0) {
      throw result.GetErrorCode();
    }

    let gltfModelUrl: string | undefined;

    // Go through files backward - as `gltf` file is first, followed by dependencies (eg .bin)
    // We may need to correct paths in GLTF file, as dependencies are stored in browser - we need to use local blob object URL
    for (let i = fileCount - 1; i >= 0; i--) {
      const file = result.GetFile(i);
      const path = file.GetPath();

      let arrayBuffer: ArrayBuffer = file.GetContent();

      // i === 0 is GLTF file
      // So we parse the file into JSON and edit paths for buffers, images, ...
      if (i === 0) {
        const file = new File([arrayBuffer], path);

        const gltfJson = JSON.parse(await file.text());

        // Replace buffer file URIs
        gltfJson.buffers?.forEach((buffer: any) => {
          const newUri = dataUrls.get(buffer.uri);
          console.log(`replacing buffer ${buffer.uri} with ${newUri}`);
          buffer.uri = newUri;
        });

        /** For some reason Cesium ignores textures if the KHR_materials_pbrSpecularGlossiness material extension is used.
         *
         * So if we have images, we go through all materials and delete the extension
         */
        if (gltfJson.images && gltfJson.images.length > 0) {
          gltfJson.materials?.forEach((material: any) => {
            if (material.extensions.KHR_materials_pbrSpecularGlossiness)
              material.extensions.KHR_materials_pbrSpecularGlossiness = undefined;
          });
        }

        // Replace buffer file URIs
        gltfJson.images?.forEach((image: any) => {
          let newUrl: string = image.uri;

          // Replace back slashes with forward slash
          newUrl = newUrl.replace(/\\/g, "/");
          // Remove start "./" or "//" from uri
          if (newUrl.startsWith("//") || newUrl.startsWith("./")) {
            newUrl = newUrl.slice(2);
          }

          // Try to replace image uri with
          // dataUrl - if image matches url
          // or absolute url to baseUrl

          if (dataUrls.has(newUrl)) {
            newUrl = dataUrls.get(newUrl)!;
          } else if (baseUrl) {
            // and resolve URI to baseUrl
            image.uri = new URI(newUrl.replace(/\\/g, "/"))
              .absoluteTo(baseUrl)
              .toString();
          }

          if (newUrl !== image.uri) {
            console.log(`replacing image ${newUrl} with ${image.uri}`);
            image.uri = newUrl;
          }
        });

        // Turn GLTF back into array buffer
        arrayBuffer = Buffer.from(JSON.stringify(gltfJson));
      }

      // Convert assimp output file to blob and create object URL
      const blob = new Blob([arrayBuffer]);
      const dataUrl = URL.createObjectURL(blob);
      dataUrls.set(path, dataUrl);

      if (i === 0) {
        gltfModelUrl = dataUrl;
      }

      // Debug - download files

      FileSaver.saveAs(blob, path);
    }

    // Debug - place in Hobart and scale up

    runInAction(() => {
      this.setTrait("user", "scale", 100);
      this.setTrait("user", "origin", {
        latitude: -42.8826,
        longitude: 147.3257,
        height: 100
      });
      this.gltfModelUrl = gltfModelUrl;
    });
  }
}
