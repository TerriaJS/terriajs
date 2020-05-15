// import your custom theme
import { terriaTheme } from "../../ReactViews/StandardUserInterface/StandardTheme";

type Theme = typeof terriaTheme;

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
