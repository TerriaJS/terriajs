/**
 * Default visibility for statically known workbench controls
 */
const defaultControls = {
  // When true, disable all controls
  disableAll: false,

  // Viewing control flags
  viewingControlsGroup: true, // when false, disable all viewing controls
  compare: true, // Flag for compare tool also known as splitter
  difference: true, // Flag for difference tool
  idealZoom: true,
  aboutData: true,
  exportData: true,
  search: true, // Flag for item search tool

  opacity: true,
  scaleWorkbench: true,
  timer: true,
  chartItems: true,
  filter: true,
  dateTime: true,
  timeFilter: true,
  selectableDimensions: true,
  colorScaleRange: true,
  shortReport: true,
  legend: true
};

/**
 * WorkbenchControls can be any of the static flags defined in defaultControls
 * or the ID of any dynamic control.
 */
export type WorkbenchControls = Partial<
  typeof defaultControls & {
    [dynamicControlId: string]: boolean;
  }
>;

/**
 *  A complete set of WorkbenchControls
 */
export type WorkbenchControlSet = Required<WorkbenchControls>;

/**
 * Derives a complete flag set from partial flags
 *
 * @param controls Optional partial flag set to override the defaults. If
 * `disableAll` is `true` then all flags except group flags will be turned off.
 */
export function buildControlSet(
  controls?: WorkbenchControls
): WorkbenchControlSet {
  const { disableAll = false, ...overrides } = controls ?? {};
  const defaultValue = disableAll ? false : true;

  // Use a Proxy to handle undefined flags and dynamic flags
  return new Proxy<WorkbenchControlSet>(
    {
      // Enable group controls by default even if disableAll is set so that we
      // render the child controls if they are individually enabled. To fully
      // disable the group, explicitly set it to false (through the `overrides`
      // below).
      viewingControlsGroup: true,
      ...overrides,
      disableAll
    } as WorkbenchControlSet,
    {
      get(target, prop) {
        if (typeof prop === "string") {
          return !!(target[prop] ?? defaultValue);
        }
      }
    }
  );
}
