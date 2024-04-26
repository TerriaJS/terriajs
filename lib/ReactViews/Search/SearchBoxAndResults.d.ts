import { TFunction } from "i18next";
import React from "react";
import { ViewState } from "terriajs-plugin-api";
import Terria from "../../Models/Terria";

interface SearchInDataCatalogPropsType {
  viewState: ViewState;
  handleClick: () => void;
}

export declare const SearchInDataCatalog: React.FC<SearchInDataCatalogPropsType>;

interface PropsType {
  viewState: ViewState;
  terria: Terria;
  t?: TFunction;
  placeholder?: string;
}

declare class SearchBoxAndResults extends React.Component<PropsType> {}

export default SearchBoxAndResults;
