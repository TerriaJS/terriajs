export interface DimensionOption {
  readonly id: string;
  readonly name: string;
}

export interface SelectableDimension {
  readonly id: string;
  readonly name: string;
  readonly options: readonly DimensionOption[];
  readonly selectedId: string | undefined;
  setDimensionValue(stratumId: string, selectedId: string): void;
}