declare namespace InvokeFunctionScssNamespace {
  export interface IInvokeFunctionScss {
    btn: string;
    content: string;
    description: string;
    footer: string;
    "invoke-function": string;
    invokeFunction: string;
  }
}

declare const InvokeFunctionScssModule: InvokeFunctionScssNamespace.IInvokeFunctionScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: InvokeFunctionScssNamespace.IInvokeFunctionScss;
};

export = InvokeFunctionScssModule;
