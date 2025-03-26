import React, { FC, ReactNode } from "react";
import { CSSProp } from "styled-components";
import { useDraggable } from "./useDraggable";

interface DragWrapperProps {
  handleSelector?: string;
  css?: CSSProp;
  style?: React.CSSProperties;
  children: ReactNode;
}

const DragWrapper: FC<DragWrapperProps> = ({
  children,
  handleSelector,
  style,
  css
}) => {
  const [ref] = useDraggable({
    handleSelector
  });

  return (
    <div css={css} style={style} ref={ref}>
      {children}
    </div>
  );
};

export default DragWrapper;
