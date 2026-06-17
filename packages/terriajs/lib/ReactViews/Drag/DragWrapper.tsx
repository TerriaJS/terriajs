import React, { FC, ReactNode } from "react";
import { CSSProp } from "styled-components";
import { useDraggable } from "./useDraggable";

interface DragWrapperProps {
  handleSelector?: string;
  wrapperCSS?: CSSProp;
  style?: React.CSSProperties;
  children: ReactNode;
}

const DragWrapper: FC<DragWrapperProps> = ({
  children,
  handleSelector,
  style,
  wrapperCSS
}) => {
  const [ref] = useDraggable({
    handleSelector
  });

  return (
    <div css={wrapperCSS} style={style} ref={ref}>
      {children}
    </div>
  );
};

export default DragWrapper;
