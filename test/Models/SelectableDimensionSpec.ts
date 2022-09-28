import SelectableDimensions, {
  DEFAULT_PLACEMENT,
  Placement,
  SelectableDimension,
  SelectableDimensionCheckbox,
  SelectableDimensionEnum,
  filterSelectableDimensions,
  findSelectedValueName
} from "../../lib/Models/SelectableDimensions/SelectableDimensions";

describe("SelectableDimension", () => {
  describe("filterSelectableDimensions", () => {
    const filterDefaultPlacement =
      filterSelectableDimensions(DEFAULT_PLACEMENT);

    it("should filter out selectable dimensions with no options", () => {
      const dimWithNoOptions: SelectableDimension = {
        setDimensionValue: () => {}
      };
      expect(filterDefaultPlacement([dimWithNoOptions]).length).toBe(0);
    });

    it("should filter out selectable dimensions with only one option and disabled undefined", () => {
      const dimWithOneOption = mkSelectableSelect(DEFAULT_PLACEMENT, [
        { id: "id", name: "name" }
      ]);
      expect(filterDefaultPlacement([dimWithOneOption]).length).toBe(0);
    });
    it("will not filter out things with only one option and enabled undefined", () => {
      const dimWithOneOptionAllowUndef: SelectableDimension = {
        ...mkSelectableSelect(DEFAULT_PLACEMENT, [{ id: "id", name: "name" }]),
        allowUndefined: true
      };
      expect(filterDefaultPlacement([dimWithOneOptionAllowUndef]).length).toBe(
        1
      );
    });
    it("should gracefully handle undefined selectableDimensions", () => {
      expect(filterDefaultPlacement(undefined)).toEqual([]);
    });
  });

  describe("findSelectedValueName", () => {
    it("should return undefined if there is no selection", () => {
      const dimWithNoSelection = mkSelectableSelect(DEFAULT_PLACEMENT, [
        { id: "id", name: "name" }
      ]);
      expect(findSelectedValueName(dimWithNoSelection)).toBe(undefined);
    });
    it("should return name of selection for selects", () => {
      const dimWithNoSelection: SelectableDimension = {
        ...mkSelectableSelect(DEFAULT_PLACEMENT, [
          { id: "id", name: "name" },
          { id: "id2", name: "name2" }
        ]),
        selectedId: "id"
      };
      expect(findSelectedValueName(dimWithNoSelection)).toBe("name");
    });
  });
  it("should return disabled for checkboxes with no selection", () => {
    const checkboxWithNoSelection: SelectableDimension =
      mkSelectableCheckbox(DEFAULT_PLACEMENT);
    expect(findSelectedValueName(checkboxWithNoSelection)).toBe("Disabled");
  });
  it("should return enabled for checkboxes with true selection", () => {
    const checkboxWithSelection: SelectableDimensionCheckbox = {
      ...mkSelectableCheckbox(DEFAULT_PLACEMENT),
      selectedId: "true"
    };
    expect(findSelectedValueName(checkboxWithSelection)).toBe("Enabled");
  });
});

function mkSelectableCheckbox(
  placement: Placement,
  options: any[] = []
): SelectableDimensionCheckbox {
  return {
    type: "checkbox",
    setDimensionValue: () => undefined,
    placement,
    options
  };
}

function mkSelectableSelect(
  placement: Placement | undefined = undefined,
  options: any[] = []
): SelectableDimensionEnum {
  return {
    type: "select",
    setDimensionValue: () => undefined,
    placement,
    options
  };
}
