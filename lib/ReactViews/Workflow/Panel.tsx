import { ReactNode, FC, useEffect, useState } from "react";
import styled from "styled-components";
import isDefined from "../../Core/isDefined";
import { IButtonProps, RawButton } from "../../Styled/Button";
import { IconProps, StyledIcon } from "../../Styled/Icon";
import Text from "../../Styled/Text";
import { CollapseIcon } from "../Custom/Collapsible/Collapsible";

export type PanelProps = {
  title?: string;
  icon?: IconProps["glyph"];
  menuComponent?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Collapsible will replace menuComponent. Title must be defined */
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
export const Panel: FC<PanelProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  useEffect(() => {
    if (isDefined(props.isOpen)) {
      setIsOpen(props.isOpen);
    }
  }, [props.isOpen]);

  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    // Only update isOpen state if onToggle doesn't consume the event
    if (!props.onToggle || !props.onToggle(newIsOpen)) setIsOpen(newIsOpen);
  };

  return props.title && props.collapsible ? (
    <Wrapper className={props.className}>
      <CollapsibleTitleBar
        onClick={toggleOpen}
        fullWidth
        isOpen={isOpen}
        css={{ paddingBottom: isOpen ? "15px" : "0px" }}
      >
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

/** Simple PanelButton - this mimics style of CollapsibleTitleBar */
export const PanelButton: FC<{ onClick: () => void; title: string }> = ({
  onClick,
  title
}) => (
  <Wrapper>
    <CollapsibleTitleBar
      onClick={onClick}
      fullWidth
      isOpen={false}
      activeStyles
      css={{ paddingBottom: "0px" }}
    >
      <Title css={{ textAlign: "center" }}>{title}</Title>
    </CollapsibleTitleBar>
  </Wrapper>
);

const Wrapper = styled.div`
  background-color: ${(p) => p.theme.darkWithOverlay};
  margin: 15px 15px 0px 15px;
  padding: 15px;
  border-radius: 5px;
`;

const TitleBar = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${(p) => p.theme.darkLighter};
  padding-bottom: 15px;
  margin-bottom: 5px;
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
  padding-bottom: 15px;
  margin-bottom: 5px;
  ${(p) => (p.isOpen ? `border-bottom: 1px solid ${p.theme.darkLighter}` : "")};
`;

const Title = styled(Text).attrs({
  textLight: true,
  medium: true
})`
  flex-grow: 1;
`;

const Icon = styled(StyledIcon).attrs({
  styledWidth: "18px",
  styledHeight: "18px",
  light: true
})``;

const Content = styled.div`
  color: ${(p) => p.theme.textLight};
`;
