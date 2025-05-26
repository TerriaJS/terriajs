import { i18n } from "i18next";
import { type Component } from "react";

interface PropsType {
  version?: string;
  menuLeftItems: React.ReactNode[];
  menuItems: React.ReactNode[];
  i18n?: i18n;
}

declare class MobileHeader extends Component<PropsType> {}
export default MobileHeader;
