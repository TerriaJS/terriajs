import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DragWrapper from "../../../lib/ReactViews/Drag/DragWrapper";

describe("DragWrapper", () => {
  describe("mouse event", () => {
    it("allows dragging of entire element", async () => {
      render(
        <div style={{ position: "relative", width: "400px", height: "200px" }}>
          <DragWrapper
            handleSelector={undefined}
            style={{ position: "absolute", left: "0", top: "0" }}
          >
            test element
          </DragWrapper>
        </div>
      );

      const dragElement = screen.getByText("test element");

      fireEvent.mouseDown(dragElement, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(dragElement, { clientX: 100, clientY: 50 });
      fireEvent.mouseUp(dragElement, { clientX: 100, clientY: 50 });

      await waitFor(() => {
        expect(dragElement).toHaveStyle(
          "transform: matrix(1, 0, 0, 1, 100, 50);"
        );
      });
    });

    it("allows dragging of element when drag over handleSelector", async () => {
      render(
        <div style={{ position: "relative", width: "400px", height: "200px" }}>
          <DragWrapper
            handleSelector=".handle"
            style={{ position: "absolute", left: "0", top: "0" }}
          >
            <div className="handle">draggable</div>
            <span>non-draggable</span>
          </DragWrapper>
        </div>
      );

      const dragElement = screen.getByText("draggable");
      const handleElement = screen.getByText("draggable");

      fireEvent.mouseDown(handleElement, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(handleElement, { clientX: 40, clientY: 50 });
      fireEvent.mouseUp(dragElement, { clientX: 40, clientY: 50 });

      await waitFor(() => {
        expect(dragElement.parentElement).toHaveStyle(
          "transform: matrix(1, 0, 0, 1, 40, 50);"
        );
      });
    });

    it("does not allow dragging of element when drag over outside handleSelector", async () => {
      render(
        <div style={{ position: "relative", width: "400px", height: "200px" }}>
          <DragWrapper
            handleSelector=".handle"
            style={{ position: "absolute", left: "0", top: "0" }}
          >
            <div className="handle">draggable</div>
            <span>non-draggable</span>
          </DragWrapper>
        </div>
      );

      const dragElement = screen.getByText("draggable");
      const nonDragElement = screen.getByText("non-draggable");

      fireEvent.mouseDown(nonDragElement, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(nonDragElement, { clientX: 60, clientY: 70 });
      fireEvent.mouseUp(dragElement, { clientX: 100, clientY: 50 });

      await waitFor(() => {
        expect(dragElement.parentElement).toHaveStyle(
          "transform: matrix(1, 0, 0, 1, 0, 0);"
        );
      });
    });

    it("should limit to parent bounds", async () => {
      render(
        <div style={{ position: "relative", width: "200px", height: "200px" }}>
          <DragWrapper
            handleSelector=".handle"
            style={{ position: "absolute", left: "0", top: "0" }}
          >
            <div className="handle" style={{ width: 100, height: 10 }}>
              draggable
            </div>
          </DragWrapper>
        </div>
      );

      const dragElement = screen.getByText("draggable");
      const handleElement = screen.getByText("draggable");

      fireEvent.mouseDown(handleElement, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(handleElement, { clientX: 200, clientY: 50 });
      fireEvent.mouseUp(dragElement, { clientX: 200, clientY: 50 });

      await waitFor(() => {
        expect(dragElement.parentElement).toHaveStyle(
          "transform: matrix(1, 0, 0, 1, 100, 50);"
        );
      });
    });
  });
});
