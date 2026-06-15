declare namespace FileInputScssNamespace {
  export interface IFileInputScss {
    btn: string;
    "btn--hover": string;
    btnHover: string;
    "file-input": string;
    fileInput: string;
    input: string;
  }
}

declare const FileInputScssModule: FileInputScssNamespace.IFileInputScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: FileInputScssNamespace.IFileInputScss;
};

export = FileInputScssModule;
