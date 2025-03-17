declare namespace MyDataTabScssNamespace {
  export interface IMyDataTabScss {
    addedData: string;
    "btn--add-more-data": string;
    "btn--back-to-my-data": string;
    btnAddMoreData: string;
    btnBackToMyData: string;
    "data-catalog": string;
    dataCatalog: string;
    dataTypeTab: string;
    dndBox: string;
    dndBoxInfo: string;
    explanation: string;
    h3: string;
    "left-col": string;
    leftCol: string;
    oneCol: string;
    root: string;
    "tab-list": string;
    "tab-list__btn": string;
    "tab-list__item": string;
    tabCenter: string;
    tabLeft: string;
    tabList: string;
    tabListBtn: string;
    tabListItem: string;
  }
}

declare const MyDataTabScssModule: MyDataTabScssNamespace.IMyDataTabScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MyDataTabScssNamespace.IMyDataTabScss;
};

export = MyDataTabScssModule;
