import { MouseEventHandler } from "react";
import Icon, { GLYPHS } from "../../Styled/Icon";

import Styles from "./mobile-menu-item.scss";
import classNames from "classnames";

type MobileMenuItemProps = {
  children: React.ReactNode;
  className?: string;
};

const MobileMenuItem = ({ children, className }: MobileMenuItemProps) => (
  <div className={classNames(Styles.root, className)}>{children}</div>
);

interface MobileMenuItemLinkProps {
  href: string;
  onClick?: MouseEventHandler<HTMLElement>;
  children: React.ReactNode;
  icon?: { id: keyof typeof GLYPHS };
}

const MobileMenuItemLink = ({
  href,
  onClick,
  icon,
  children
}: MobileMenuItemLinkProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={Styles.item}
    >
      <span className={Styles.itemContent}>
        {icon && <Icon className={Styles.icon} glyph={icon} />}
        {children}
      </span>
      {href !== "#" && <Icon glyph={Icon.GLYPHS.externalLink} />}
    </a>
  );
};

interface MobileMenuButtonProps {
  onClick: MouseEventHandler<HTMLElement>;
  children: React.ReactNode;
  icon?: { id: keyof typeof GLYPHS };
}

const MobileMenuItemButton = ({
  onClick,
  children,
  icon
}: MobileMenuButtonProps) => {
  return (
    <button onClick={onClick} className={Styles.item}>
      <span className={Styles.itemContent}>
        {icon && <Icon className={Styles.icon} glyph={icon} />}
        {children}
      </span>
    </button>
  );
};

interface MobileMenuItemTextProps {
  children: React.ReactNode;
}
const MobileMenuItemText = ({ children }: MobileMenuItemTextProps) => {
  return (
    <div className={Styles.itemSimple} onClick={(ev) => ev.stopPropagation()}>
      {children}
    </div>
  );
};

MobileMenuItem.Link = MobileMenuItemLink;
MobileMenuItem.Button = MobileMenuItemButton;
MobileMenuItem.Text = MobileMenuItemText;

export default MobileMenuItem;
