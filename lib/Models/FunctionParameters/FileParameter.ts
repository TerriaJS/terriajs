import { computed, override } from "mobx";
import { JsonObject } from "../../Core/Json";
import TerriaError from "../../Core/TerriaError";
import readBase64 from "../../Core/readBase64";
import readText from "../../Core/readText";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";

interface Options extends FunctionParameterOptions {
  supportedFormats: SupportedFormat[];
  maximumMegabytes?: number;
}

export interface SupportedFormat {
  mimeType: string;
  encoding: "base64" | "none";
}

interface FileValue extends JsonObject {
  fileName: string;
  content: string;
  mimeType: string;
  sizeInMegabytes: number;
}

export default class FileParameter extends FunctionParameter<FileValue> {
  static readonly type = "file";
  readonly type = FileParameter.type;

  readonly supportedFormats: SupportedFormat[];
  readonly maximumMegabytes: number | undefined;

  constructor(
    catalogFunction: CatalogFunctionMixin.Instance,
    options: Options
  ) {
    super(catalogFunction, options);
    this.supportedFormats = options.supportedFormats;
    this.maximumMegabytes = options.maximumMegabytes;
  }

  @override
  get isValid() {
    return super.isValid && !this.errors;
  }

  isValidMimeType(mimeType: string): boolean {
    return this.supportedFormats.some((format) => format.mimeType === mimeType);
  }

  isValidFileSize(sizeInMegabytes: number): boolean {
    return this.maximumMegabytes === undefined
      ? true
      : sizeInMegabytes <= this.maximumMegabytes;
  }

  @computed
  get errors() {
    if (!this.value) {
      return undefined;
    }

    const sizeTooLarge = !this.isValidFileSize(this.value.sizeInMegabytes);
    const unsupportedFileType = !this.isValidMimeType(this.value.mimeType);
    return sizeTooLarge || unsupportedFileType
      ? { sizeTooLarge, unsupportedFileType }
      : undefined;
  }

  private async encodeFile(
    file: File,
    encoding: "base64" | "none"
  ): Promise<string> {
    const encoder = encoding === "base64" ? readBase64 : readText;
    const encodedContent = await encoder(file);
    if (encodedContent === undefined) {
      throw new TerriaError({ message: "Failed to encode file" });
    }
    return encodedContent;
  }

  async setBlob(strataId: string, file: File) {
    const fileName = file.name;
    const mimeType = file.type;
    const sizeInMegabytes = bytesToMegabytes(file.size);
    const format = this.supportedFormats.find(
      (format) => format.mimeType === mimeType
    );

    const encodeContent =
      format &&
      this.isValidFileSize(sizeInMegabytes) &&
      this.isValidMimeType(mimeType);

    this.setValue(strataId, {
      fileName,
      mimeType,
      sizeInMegabytes,
      content: encodeContent ? await this.encodeFile(file, format.encoding) : ""
    });
  }
}

const bytesToMegabytes = (bytes: number) => bytes / 1000000;

