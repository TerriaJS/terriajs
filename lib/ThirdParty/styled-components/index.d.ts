// Pull in the css prop type addition to react attributes
/// <reference types="styled-components/cssprop" />

// import your custom theme
import { terriaTheme } from "../../ReactViews/StandardUserInterface/StandardTheme";

type Theme = typeof terriaTheme;

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
