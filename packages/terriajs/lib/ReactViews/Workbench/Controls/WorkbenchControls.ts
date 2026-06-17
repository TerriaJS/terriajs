/**
 * Static and dynamic flags for enabling/disabling controls in the Workbench
 */
export type WorkbenchControls = {
  // When true, disable all controls by default. You can then selectively
  // enable/disable flags individually to override the default.
  disableAll: boolean;

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
};

export const enableAllControls: WorkbenchControls = {
  disableAll: false,

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

export const disableAllControls: WorkbenchControls = {
  disableAll: true,

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
 * Check if a control is enabled in the given controls object
 *
 * @param controls WorkbenchControls object
 * @param controlName Either one of the static keys defined by @type {WorkbenchControls} or the id of a dynamic control, eg: "table-styling"
 */
export function isControlEnabled(
  controls: WorkbenchControls,
  controlName: string
): boolean {
  return controlName in controls
    ? !!controls[controlName]
    : !controls.disableAll;
}
