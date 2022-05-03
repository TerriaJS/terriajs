import { computed } from "mobx";
import TableColumn from "./TableColumn";
import TableColumnType from "./TableColumnType";

export interface BinStyle {
  maxValue?: number | null;
}
export interface EnumStyle {
  value?: string | null;
}

export type StyleMapType = "enum" | "bin" | "constant";

export interface EnumStyleMap<T> {
  type: "enum";
  mapValueToStyle: (rowId: number) => T;
}

export interface BinStyleMap<T> {
  type: "bin";
  mapValueToStyle: (rowId: number) => T;
}

export interface ConstantStyleMap<T> {
  type: "constant";
  style: T;
}

export default class TableStyleMap<T> {
  constructor(
    readonly column: TableColumn | undefined,
    readonly traits: {
      enum: Readonly<(EnumStyle & T)[]>;
      bin: Readonly<(BinStyle & T)[]>;
      null: T;
    }
  ) {}

  /**
   *
   */
  @computed
  get styleMap(): EnumStyleMap<T> | BinStyleMap<T> | ConstantStyleMap<T> {
    // If column type is `scalar` and binStyles
    if (
      this.column?.type === TableColumnType.scalar &&
      this.traits.bin &&
      this.traits.bin.length > 0
    ) {
      return {
        type: "bin",
        mapValueToStyle: rowId => {
          const value = this.column?.valuesForType[rowId];
          if (typeof value !== "number") {
            return this.traits.null;
          }

          const binStyles = this.traits.bin ?? [];
          let i;
          for (
            i = 0;
            i < binStyles.length - 1 &&
            value > (binStyles[i].maxValue ?? Infinity);
            ++i
          ) {}

          return this.traits.bin?.[i] ?? this.traits.null;
        }
      };
    } else if (this.column && this.traits.enum && this.traits.enum.length > 0) {
      return {
        type: "enum",
        mapValueToStyle: rowId =>
          this.traits.enum!.find(
            enumStyle =>
              enumStyle.value !== null &&
              enumStyle.value === this.column?.values[rowId]
          ) ?? this.traits.null
      };
    }

    // Return default settings
    return {
      type: "constant",
      style: this.traits.null
    };
  }
}

export function isConstantStyleMap<T>(
  map: EnumStyleMap<T> | BinStyleMap<T> | ConstantStyleMap<T>
): map is ConstantStyleMap<T> {
  return map.type === "constant";
}
