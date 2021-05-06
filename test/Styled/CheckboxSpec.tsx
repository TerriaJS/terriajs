import Checkbox from "./../../lib/Styled/Checkbox/Checkbox";
import { ICheckboxProps } from "../../lib/Styled/Checkbox/types";
import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";

describe("Checkbox", function() {
  const mountCheckbox = (overridingProps: ICheckboxProps) => {
    const utils = render(
      <Checkbox label="" onChange={() => {}} name="stub" {...overridingProps} />
    );
    utils.getByText("foo");
    const input = (screen.getByRole("checkbox", {
      hidden: true
    }) as any) as HTMLInputElement;
    return { input };
  };

  describe("basic", () => {
    it("keeps isChecked as false when passing it as prop and calling onChange", () => {
      const { input } = mountCheckbox({
        isChecked: false,
        onChange: undefined
      });
      fireEvent.click(input);

      expect(input).not.toBeChecked();
    });

    it("keeps isChecked as true when passing it as prop and calling onChange", () => {
      const { input } = mountCheckbox({ isChecked: true, onChange: undefined });
      fireEvent.click(input);
      expect(input).toBeChecked();
    });

    it("should be unchecked by default", () => {
      const { input } = mountCheckbox({ defaultChecked: false });
      expect(input).not.toBeChecked();
    });

    it("should call onchange once", () => {
      const spy = jasmine.createSpy();
      const { input } = mountCheckbox({ onChange: spy });
      fireEvent.click(input);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("defaultChecked", () => {
    it("should render defaultChecked", () => {
      const { input } = mountCheckbox({ defaultChecked: true });
      expect(input).toBeChecked();
    });

    it("should render defaultChecked={undefined}", () => {
      const { input } = mountCheckbox({});
      expect(input).not.toBeChecked();
    });
  });

  describe("disabled", () => {
    it("should show a not-allowed cursor", () => {
      const { input } = mountCheckbox({ isDisabled: true });
      expect(input).toBeDisabled();
    });
  });
});
