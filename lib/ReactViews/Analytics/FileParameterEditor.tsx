import { observer } from "mobx-react";
import { useState } from "react";
import TerriaError from "../../Core/TerriaError";
import CommonStrata from "../../Models/Definition/CommonStrata";
import FileParameter from "../../Models/FunctionParameters/FileParameter";
import { useViewState } from "../Context";
import BrowseFiles from "./FileParameterEditor/BrowseFiles";

const FileParameterEditor: React.FC<{
  parameter: FileParameter;
}> = observer(({ parameter }) => {
  const terria = useViewState().terria;
  const [isLoading, setIsLoading] = useState(false);
  const formats = parameter.supportedFormats.map((f) => f.mimeType).join(",");

  const handleFile = (files: FileList | null) => {
    // Currently we only support adding a single file
    const file = files?.item(0);
    if (file) {
      setIsLoading(true);
      parameter
        .setBlob(CommonStrata.user, file)
        .catch((error) => TerriaError.from(error).raiseError(terria))
        .finally(() => setIsLoading(false));
    }
  };

  const clearFile = () => parameter.clearValue(CommonStrata.user);

  const { fileName, sizeInMegabytes } = parameter.value ?? {};
  const fileTitle = parameter.value
    ? `${fileName} (${sizeInMegabytes} MB)`
    : undefined;

  return (
    <>
      {parameter.errors && (
        <div>
          {parameter.errors.unsupportedFileType && (
            <div>Unsupported file type</div>
          )}
          {parameter.errors.sizeTooLarge && (
            <div>
              Size of selected file cannot be greater than{" "}
              {parameter.maximumMegabytes}MB
            </div>
          )}
        </div>
      )}
      <BrowseFiles
        disabled={isLoading === true}
        formats={formats}
        selectedFile={fileTitle}
        onFile={handleFile}
        onClearFile={clearFile}
      />
    </>
  );
});

export default FileParameterEditor;
