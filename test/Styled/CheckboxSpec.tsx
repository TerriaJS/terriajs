import Checkbox from "./../../lib/Styled/Checkbox/Checkbox";
import { ICheckboxProps } from "../../lib/Styled/Checkbox/types";
import CheckboxIcon from "./../../lib/Styled/Checkbox/Elements/CheckboxIcon";
import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";

describe("Checkbox", function() {
  const mountCheckbox = (overridingProps: ICheckboxProps) => {
    const checkbox = render(
      <Checkbox
        label=""
        onChange={() => {
          console.log("on change");
        }}
        name="stub"
        {...overridingProps}
      />
    );
    const input = (checkbox.getByRole("checkbox", {
      hidden: true
    }) as any) as HTMLInputElement;
    return { input, checkbox };
  };

  describe("basic", () => {
    it("keeps isChecked as false when passing it as prop and calling onChange", () => {
      const { input } = mountCheckbox({
        isChecked: false,
        onChange: undefined
      });
      fireEvent.click(input);
      console.log(input);

      expect(input.checked).toBe(false);
    });

    it("keeps isChecked as true when passing it as prop and calling onChange", () => {
      const { input } = mountCheckbox({ isChecked: true, onChange: undefined });
      fireEvent.click(input);
      expect(input.checked).toBe(true);
    });

    it("should be unchecked by default", () => {
      const { input } = mountCheckbox({ defaultChecked: false });
      expect(input.checked).toBe(false);
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
      expect(input.checked).toBe(true);
    });

    it("should render defaultChecked={undefined}", () => {
      const { input } = mountCheckbox({});
      expect(input.checked).toBe(false);
    });
  });

  describe("disabled", () => {
    it("should show a not-allowed cursor", () => {
      const { input } = mountCheckbox({ isDisabled: true });
      expect(input.disabled).toBe(true);
    });
  });
});
