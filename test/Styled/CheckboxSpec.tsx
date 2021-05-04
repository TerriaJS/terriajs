import Checkbox from "./../../lib/Styled/Checkbox/Checkbox";
import { mount } from "enzyme";
import { ICheckboxProps } from "../../lib/Styled/Checkbox/types";
import CheckboxIcon from "./../../lib/Styled/Checkbox/Elements/CheckboxIcon";
import jasmineEnzyme from "jasmine-enzyme";
import React from "react";

describe("Checkbox", function() {
  beforeEach(() => {
    jasmineEnzyme();
  });
  const mountCheckbox = (overridingProps: ICheckboxProps) =>
    mount(
      <Checkbox label="" onChange={() => {}} name="stub" {...overridingProps} />
    );

  describe("basic", () => {
    it("keeps isChecked as false when passing it as prop and calling onChange", () => {
      const cb = mountCheckbox({ isChecked: false, onChange: undefined });
      cb.find("input").simulate("change", { target: { checked: true } });
      expect(cb.find("input").prop("checked")).toBe(false);
    });

    it("keeps isChecked as true when passing it as prop and calling onChange", () => {
      const cb = mountCheckbox({ isChecked: true, onChange: undefined });
      cb.find("input").simulate("change", { target: { checked: false } });
      expect(cb.find("input").prop("checked")).toBe(true);
    });

    it("should be unchecked by default", () => {
      const cb = mountCheckbox({ defaultChecked: false });
      expect(cb.find("input[checked]").length === 1).toBe(true);
    });

    it("should call onchange on change", () => {
      const spy = jasmine.createSpy();
      const cb = mountCheckbox({ isChecked: false, onChange: spy });
      cb.find("input").simulate("change", { target: { checked: true } });
      expect(cb.find(Checkbox).prop("isChecked")).toBe(false);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should call onchange once", () => {
      const spy = jasmine.createSpy();
      const cb = mountCheckbox({ onChange: spy });
      cb.find("input").simulate("change");
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("defaultChecked", () => {
    it("should render defaultChecked", () => {
      const cb = mountCheckbox({ defaultChecked: true });

      const element = cb.find("input");
      expect(element.prop("checked")).toBe(true);
    });
    it("should render defaultChecked={undefined}", () => {
      const cb = mountCheckbox({});

      const element = cb.find("input");
      expect(element.prop("checked")).toBe(false);
    });
  });

  describe("disabled", () => {
    it("should show a not-allowed cursor", () => {
      const cb = mountCheckbox({ isDisabled: true });
      expect(cb.find("input")).toBeDisabled();
    });
  });
});
