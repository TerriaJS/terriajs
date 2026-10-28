import type { PressEvent, useLocale } from "react-aria-components";

export type {
  AriaLandmarkProps,
  AriaLandmarkRole,
  ClipboardProps,
  ContextMenuEvent,
  ContextMenuProps,
  DateFormatterOptions,
  FocusManager,
  FocusManagerOptions,
  FocusScopeProps,
  KeyboardProps,
  MoveEndEvent,
  MoveEvents,
  MoveMoveEvent,
  MoveStartEvent,
  Orientation,
  PortalProviderProps
} from "react-aria";
export type {
  Color,
  ColorAxes,
  ColorChannel,
  ColorChannelRange,
  ColorFormat,
  ColorSpace,
  DateRange,
  DateValue,
  HoverEvent,
  Key,
  KeyboardEvent,
  PressEvent,
  RangeValue,
  RouterConfig,
  Selection,
  SortDescriptor,
  TimeValue,
  ValidationResult
} from "react-aria-components";
export type {
  AsyncListData,
  AsyncListLoadOptions,
  AsyncListOptions,
  ListData,
  ListOptions,
  OverlayTriggerProps,
  OverlayTriggerState
} from "react-stately";

// Not exported by the React Aria packages we depend on, so taken from where
// they're used
export type Direction = ReturnType<typeof useLocale>["direction"];
export type PointerType = PressEvent["pointerType"];
