import { FC, ReactNode } from "react";
import { useDraggable } from "./Drag/use-draggable";

interface DragWrapperProps {
  children: ReactNode;
}

const DragWrapper: FC<DragWrapperProps> = ({ children }) => {
  const [ref] = useDraggable({
    handleSelector: ".drag-handle"
  });

  return <div ref={ref}>{children}</div>;
};

export default DragWrapper;
