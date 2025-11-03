/**
 * Static and dynamic flags for enabling/disabling controls in the workbench
 */
export type WorkbenchControls = Partial<{
  // When true, disable all controls by default. You can then selectively
  // enable/disable flags individually to override the default.
  disableAll: boolean;

  viewingControlsGroup: boolean; // when false, disable all viewing controls
  compare: boolean; // Flag for compare tool also known as splitter
  difference: boolean; // Flag for difference tool
  idealZoom: boolean;
  aboutData: boolean;
  exportData: boolean;
  search: boolean; // Flag for item search tool
  opacity: boolean;
  scaleWorkbench: boolean;
  timer: boolean;
  chartItems: boolean;
  filter: boolean;
  dateTime: boolean;
  timeFilter: boolean;
  selectableDimensions: boolean;
  colorScaleRange: boolean;
  shortReport: boolean;
  legend: boolean;

  [dynamicControl: string]: boolean | undefined;
}>;

export const enableAllControls: WorkbenchControls = {
  disableAll: false,

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

const disableAllControls: WorkbenchControls = {
  disableAll: true,

  // Keep viewing controls group enabled so that we can render any member of
  // that group that has been selectively enabled.
  viewingControlsGroup: true,

  compare: false, // Flag for compare tool also known as splitter
  difference: false, // Flag for difference tool
  idealZoom: false,
  aboutData: false,
  exportData: false,
  search: false, // Flag for item search tool
  opacity: false,
  scaleWorkbench: false,
  timer: false,
  chartItems: false,
  filter: false,
  dateTime: false,
  timeFilter: false,
  selectableDimensions: false,
  colorScaleRange: false,
  shortReport: false,
  legend: false
};

/**
 * Merge all control flags
 * @param partialControls One or more control flags definition
 * @returns a merged object
 */
export function mergeControls(
  ...partialControls: Partial<WorkbenchControls>[]
): WorkbenchControls {
  return partialControls.reduce((acc, controls) => {
    return {
      ...acc,
      ...(controls.disableAll === true
        ? disableAllControls
        : controls.disableAll === false
        ? enableAllControls
        : {}),
      ...controls
    };
  }, enableAllControls) as WorkbenchControls;
}

/**
 * Check if a control is enabled in the given controls object
 */
export function isControlEnabled(
  controls: WorkbenchControls,
  controlName: string
): boolean {
  return controlName in controls
    ? !!controls[controlName]
    : !controls.disableAll;
}
