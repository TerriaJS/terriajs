import { ReactNode, useEffect, useRef } from "react";
import interact from "interactjs";

export default function DragWrapper({ children }: { children: ReactNode }) {
  const ref = useRef(null);
  const resizeListener = useRef<(() => void) | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (node === null) return;

    const dragMoveListener: interact.Listener = (event) => {
      const target = event.target;
      // keep the dragged position in the data-x/data-y attributes
      const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
      const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

      // translate the element
      target.style.webkitTransform = target.style.transform =
        "translate(" + x + "px, " + y + "px)";

      // update the posiion attributes
      target.setAttribute("data-x", x);
      target.setAttribute("data-y", y);
    };

    interact(node).draggable({
      ignoreFrom: "button",
      allowFrom: ".drag-handle",
      inertia: true,
      onmove: dragMoveListener,
      // keep the element within the area of it's parent
      restrict: {
        restriction: "parent",
        endOnly: true,
        elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
      }
    });

    resizeListener.current = () => {
      const draggable = interact(node);
      const dragEvent = { name: "drag", axis: "xy" };
      (draggable as any).reflow(dragEvent);
    };
    window.addEventListener("resize", resizeListener.current, false);

    return () => {
      if (ref.current && interact.isSet(ref.current)) {
        interact(ref.current).unset();
      }
      resizeListener.current &&
        window.removeEventListener("resize", resizeListener.current, false);
    };
  }, [ref.current]);
  return <div ref={ref}>{children}</div>;
}
