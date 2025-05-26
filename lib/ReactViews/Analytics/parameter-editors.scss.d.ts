declare namespace ParameterEditorsScssNamespace {
  export interface IParameterEditorsScss {
    autocomplete: string;
    "autocomplete-item": string;
    autocompleteItem: string;
    "btn-catalog": string;
    "btn-location-selector": string;
    "btn-radio": string;
    "btn-selector": string;
    btnCatalog: string;
    btnLocationSelector: string;
    btnRadio: string;
    btnSelector: string;
    data: string;
    embeddedMap: string;
    field: string;
    "field--parameter-editor": string;
    "field-date-placeholder": string;
    "field-invalid": string;
    fieldDatePlaceholder: string;
    fieldInvalid: string;
    fieldParameterEditor: string;
    "is-hidden": string;
    isHidden: string;
    label: string;
    map: string;
    "parameter-editor": string;
    "parameter-editor-important-note": string;
    parameterEditor: string;
    parameterEditorImportantNote: string;
    radio: string;
    "region-input": string;
    regionInput: string;
    tree: string;
    "warning-text": string;
    warningText: string;
  }
}

declare const ParameterEditorsScssModule: ParameterEditorsScssNamespace.IParameterEditorsScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ParameterEditorsScssNamespace.IParameterEditorsScss;
};

export = ParameterEditorsScssModule;
