import { FC, ReactNode } from "react";
import styled from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { useViewState } from "../Context/ViewStateContext";

interface PropsType {
  title?: string;
  children?: ReactNode | ReactNode[];
  onClick: (viewState: ViewState) => void;
}

/**
 * A button as link that provides common styling for custom component types
 * that open a feature.
 */
const FeatureLink: FC<PropsType> = ({ title, onClick, children }) => {
  const viewState = useViewState();
  return (
    <ButtonAsLink
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick(viewState);
      }}
    >
      {children}
    </ButtonAsLink>
  );
};

const ButtonAsLink = styled.button`
  background: none;
  border: none;
  text-decoration: underline dashed;
  color: inherit;
`;

export default FeatureLink;
