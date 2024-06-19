import IElementConfig from "../../../Models/IElementConfig";

interface PropsType {
  animationDuration?: number;
  menuItems: React.ReactElement[];
  menuLeftItems: React.ReactElement[];
  elementConfig?: IElementConfig;
}

declare const MenuBar: React.FC<PropsType>;
export default MenuBar;
