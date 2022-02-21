import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { IButtonProps, RawButton } from "../../Styled/Button";
import { GLYPHS, IconProps, StyledIcon } from "../../Styled/Icon";
import Text from "../../Styled/Text";
import { CollapseIcon } from "../Custom/Collapsible/Collapsible";
import isDefined from "../../Core/isDefined";

export type PanelProps = {
  title?: string;
  icon?: IconProps["glyph"];
  menuComponent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Collapsible will replace menuComponent */
  collapsible?: boolean;
  isOpen?: boolean;
  /** Function is called whenever Collapsible is toggled (close or open).
   * Return value is `true` if the listener has consumed the event, `false` otherwise.
   */
  onToggle?: (isOpen: boolean) => boolean | void;
};

/**
 * A generic panel component for left, right, context items etc.
 */
export const Panel: React.FC<PanelProps> = props => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  useEffect(() => {
    isDefined(props.isOpen) ? setIsOpen(props.isOpen) : null;
  }, [props.isOpen]);

  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    // Only update isOpen state if onToggle doesn't consume the event
    if (!props.onToggle || !props.onToggle(newIsOpen)) setIsOpen(newIsOpen);
  };

  return props.collapsible ? (
    <Wrapper className={props.className}>
      <CollapsibleTitleBar onClick={toggleOpen} fullWidth isOpen={isOpen}>
        {props.icon !== undefined ? (
          <Icon glyph={props.icon} styledWidth="16px" styledHeight="16px" />
        ) : null}

        <Title>{props.title}</Title>

        <CollapseIcon isOpen={isOpen} />
      </CollapsibleTitleBar>
      {isOpen ? <Content>{props.children}</Content> : null}
    </Wrapper>
  ) : (
    <Wrapper className={props.className}>
      {props.title !== undefined && (
        <TitleBar>
          {props.icon !== undefined ? (
            <Icon glyph={props.icon} styledWidth="16px" styledHeight="16px" />
          ) : null}
          <Title>{props.title}</Title>
          {props.menuComponent}
        </TitleBar>
      )}
      <Content>{props.children}</Content>
    </Wrapper>
  );
};

export const PanelBody = styled.div`
  padding: 0.4em;
`;

const Wrapper = styled.div`
  background-color: ${p => p.theme.darkWithOverlay};
  margin: 10px 5px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.15);
`;

const TitleBar = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${p => p.theme.darkLighter};
  padding-left: 0.4em;
`;

const CollapsibleTitleBar = styled(RawButton)<
  IButtonProps & { isOpen: boolean }
>`
  text-align: left;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  ${p => (p.isOpen ? `border-bottom: 1px solid ${p.theme.darkLighter}` : "")};
  padding-left: 0.4em;
  padding-right: 0.4em;
`;

const Title = styled(Text).attrs({
  textLight: true,
  bold: true
})`
  flex-grow: 1;
  padding: 1em 0.4em;
`;

const Icon = styled(StyledIcon).attrs({
  styledWidth: "18px",
  styledHeight: "18px",
  light: true
})``;

const Content = styled.div`
  color: ${p => p.theme.textLight};
`;

type PanelMenuProps = {
  options: {
    text: string;
    onSelect: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
  }[];
};

/**
 * A popup overflow menu for the panel
 */
export const PanelMenu: React.FC<PanelMenuProps> = ({ options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hideMenu = () => setIsOpen(false);

  useEffect(
    function clickAnywhereToCloseMenu() {
      if (isOpen) {
        window.addEventListener("click", hideMenu);
        return () => window.removeEventListener("click", hideMenu);
      }
    },
    [isOpen]
  );

  const handleClick = (
    onSelect: React.MouseEventHandler<HTMLButtonElement>,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    // If onSelect decides to stop event propogation,
    // clickAnywhereToCloseMenu() will not work. So we close the menu before
    // calling onSelect.
    setIsOpen(false);
    onSelect(event);
  };

  return (
    <PanelMenuContainer>
      <PanelMenuButton isOpen={isOpen} onClick={() => setIsOpen(true)}>
        <StyledIcon glyph={GLYPHS.menuDotted} />
      </PanelMenuButton>
      {isOpen && (
        <ul>
          {options.map(({ text, onSelect, disabled }) => (
            <li key={text}>
              <PanelMenuItem
                onClick={e => handleClick(onSelect, e)}
                disabled={disabled}
              >
                <Text noWrap medium textLight>
                  {text}
                </Text>
              </PanelMenuItem>
            </li>
          ))}
        </ul>
      )}
    </PanelMenuContainer>
  );
};

const PanelMenuContainer = styled.div`
  position: relative;

  ul {
    position: absolute;
    right: 2px;
    z-index: 1;
    margin: 2px 1px 0 0;
    padding: 0;
    list-style: none;
    border-radius: 3px;
    border: 1px solid ${p => p.theme.grey};
    background-color: ${p => p.theme.dark};
  }

  ul > li {
    border: 0px;
    border-bottom: 1px solid ${p => p.theme.grey};
  }

  ul > li:last-child {
    border-bottom: 0;
  }
`;

const PanelMenuItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border: 0;
  border-radius: 2px;
  background-color: ${p => p.theme.dark};

  :disabled > ${Text} {
    color: ${p => p.theme.textLightDimmed};
  }

  :hover {
    background-color: ${p => p.theme.colorPrimary};
  }
`;

const PanelMenuButton = styled.button<{ isOpen: boolean }>`
  outline: 0 !important;
  padding: 8px;
  margin: 0 3px;
  background: none;
  border: 0px;
  border-radius: 2px;

  svg {
    fill: ${props => props.theme.greyLighter};
    width: 16px;
    height: 16px;
  }

  ${p => p.isOpen && `background-color: ${p.theme.dark}`};
`;
