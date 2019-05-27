export interface AvailableStyle {
  readonly id: string;
  readonly name: string;
}

export default interface SelectableStyle {
  readonly id: string;
  readonly name: string;
  readonly availableStyles: readonly AvailableStyle[];
  readonly activeStyleId: string | undefined;
  chooseActiveStyle(stratumId: string, styleId: string): void;
}
