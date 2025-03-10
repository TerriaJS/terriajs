import interact from "interactjs";
import { FC, ReactNode, useEffect, useRef } from "react";

interface DragWrapperProps {
  children: ReactNode;
}

const DragWrapper: FC<DragWrapperProps> = ({ children }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const dragMoveListener = (event: any) => {
      const target = event.target;
      // keep the dragged position in the data-x/data-y attributes
      const x = parseFloat(target.getAttribute("data-x") || "0") + event.dx;
      const y = parseFloat(target.getAttribute("data-y") || "0") + event.dy;

      // translate the element
      target.style.transform = `translate(${x}px, ${y}px)`;
      target.style.webkitTransform = target.style.transform;

      // update the position attributes
      target.setAttribute("data-x", x.toString());
      target.setAttribute("data-y", y.toString());
    };

    const interactable = interact(node).draggable({
      ignoreFrom: "button",
      allowFrom: ".drag-handle",
      inertia: true,
      onmove: dragMoveListener,
      // keep the element within the area of it's parent
      modifiers: [
        interact.modifiers.restrict({
          restriction: "parent",
          endOnly: true,
          elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
        })
      ]
    });

    const resizeListener = async () => {
      await interactable.reflow({ name: "drag", axis: "xy" });
    };

    window.addEventListener("resize", resizeListener, false);

    // Cleanup
    return () => {
      if (interact.isSet(node)) {
        interact(node).unset();
      }

      window.removeEventListener("resize", resizeListener, false);
    };
  }, []); // Empty dependency array as we only want to run this once on mount

  return <div ref={nodeRef}>{children}</div>;
};

export default DragWrapper;
