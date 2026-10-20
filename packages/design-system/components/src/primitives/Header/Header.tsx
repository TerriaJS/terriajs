import {
  Header as AriaHeader,
  type HeaderProps as AriaHeaderProps
} from "react-aria-components/Header";
import "./Header.css";

export type HeaderProps = AriaHeaderProps;

// Titles a section of a collection, such as a ListBox or Menu section
export const Header = (props: HeaderProps): React.ReactElement => {
  return <AriaHeader {...props} data-tds="header" />;
};

Header.displayName = "Header";
