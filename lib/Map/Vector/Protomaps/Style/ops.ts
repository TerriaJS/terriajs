import {
  GeomType,
  exp as interpExp,
  linear as interpLinear
} from "protomaps-leaflet";
import JsonValue from "../../../../Core/Json";
import {
  Op,
  Thunk,
  evalExpr,
  logStyleError,
  mergeAllThunks,
  op0,
  op1,
  op2
} from "./expr";
import { interpColorsExp, interpColorsLinear } from "./interpColors";

// -- Types --

// TODO: this should also handle styling overrides
const format = op0((...params: any[]) => {
  return params.filter((p) => typeof p === "string").join("");
});

const literal: Op = {
  applyOp(paramExprs) {
    return () => paramExprs[0];
  }
};

// TODO: color strings must be converted to rgba() format
const toString = op0((value: JsonValue) => {
  return value === null
    ? ""
    : typeof value === "string"
    ? value
    : JSON.stringify(value);
});

// -- Feature data --
const geometryType = op2((_, f) => {
  return f.geomType === GeomType.Point
    ? "Point"
    : f.geomType === GeomType.Line
    ? "LineString"
    : f.geomType === GeomType.Polygon
    ? "Polygon"
    : null;
});

// -- Lookup --
const get = op2(
  (_, f, propName: string, obj?: any) => (obj ?? f.props)?.[propName] ?? null
);

const has = op2(
  (_, f, propName: string, obj?: any) => propName in (obj ?? f.props)
);

const notHas = op2(
  (_, f, propName: string, obj?: any) => !(propName in (obj ?? f.props))
);

const inOp = op0(
  (key: string | boolean | number, target: string | any[], ...rest: any[]) => {
    if (rest.length > 0) logStyleError(`'in' op has more than 2 args`);
    return target.includes(key as any);
  }
);

// -- Decision ops --

const not = op0((value: any) => !value);

const notEqual = op0((val1: any, val2: any) => val1 !== val2);

const lessThan = op0(
  (val1: number | string, val2: number | string) => val1 < val2
);

const lessThanOrEqual = op0(
  (val1: number | string, val2: number | string) => val1 <= val2
);

const equal = op0((a: number, b: number) => a === b);

const greaterThan = op0(
  (val1: number | string, val2: number | string) => val1 > val2
);

const greaterThanOrEqual = op0(
  (val1: number | string, val2: number | string) => val1 >= val2
);

const all: Op = {
  applyOp(paramExprs, vars) {
    return mergeAllThunks(
      paramExprs.map((e) => evalExpr(e, vars)),
      (paramThunks) => {
        return (...env) => paramThunks.every((t) => t(...env));
      }
    );
  }
};

const any: Op = {
  applyOp(paramExprs, vars) {
    return mergeAllThunks(
      paramExprs.map((e) => evalExpr(e, vars)),
      (paramThunks) => {
        return (...env) => paramThunks.some((t) => t(...env));
      }
    );
  }
};

const caseOp: Op = {
  applyOp(paramExprs, vars) {
    return mergeAllThunks(
      paramExprs.map((e) => evalExpr(e, vars)),
      (paramThunks) => {
        return (...env) => {
          let i;
          for (i = 0; i < paramThunks.length; i += 2) {
            if (paramThunks[i + 1] === undefined) break;
            const testFn = paramThunks[i];
            const valueFn = paramThunks[i + 1];
            if (testFn(...env)) {
              return valueFn(...env);
            }
          }
          const fallbackValueFn = paramThunks[i];
          const fallbackValue = fallbackValueFn(...env);
          return fallbackValue;
        };
      }
    );
  }
};

const coalesce: Op = {
  applyOp(paramExprs, vars) {
    return mergeAllThunks(
      paramExprs.map((e) => evalExpr(e, vars)),
      (paramThunks) => {
        return (...env) => {
          let firstValue = null;
          for (let i = 0; i < paramThunks.length; i++) {
            const value = paramThunks[i](...env);
            if (value !== undefined && value !== null) return value;
            if (i === 0) firstValue = value;
          }
          return firstValue;
        };
      }
    );
  }
};

const match: Op = {
  applyOp(paramExprs, vars) {
    const [inputExpr, ...branches] = paramExprs;

    // Eval all branches to find out max arity
    const tests: ((value: any) => boolean)[] = [];
    const outputThunks: Thunk[] = [];
    for (let i = 0; i < branches.length; i += 2) {
      if (branches[i + 1] !== undefined) {
        const labelExpr = branches[i];
        const outputExpr = branches[i + 1];
        const test = Array.isArray(labelExpr)
          ? (input: any) => labelExpr.includes(input)
          : (input: any) => labelExpr === input;
        tests.push(test);
        outputThunks.push(evalExpr(outputExpr, vars));
      } else {
        // match any value
        const fallbackExpr = branches[i];
        tests.push(() => true);
        outputThunks.push(evalExpr(fallbackExpr, vars));
      }
    }

    const inputThunk = evalExpr(inputExpr, vars);
    return mergeAllThunks([inputThunk, ...outputThunks], () => {
      return (...env) => {
        const inputValue = inputThunk(...env);
        const i = tests.findIndex((test) => test(inputValue));
        return i >= 0 ? outputThunks[i](...env) : null;
      };
    });
  }
};

// -- Ramps, scales, curves --

type Interpolator = { type: "linear" } | { type: "exponential"; base: number };

const interpolate = op0(
  (
    interpolator: Interpolator,
    inputValue: number,
    ...stopValues: (number | string)[]
  ) => {
    const stops: [number, any][] = [];
    for (let i = 0; i < stopValues.length; i += 2) {
      stops.push([stopValues[i] as number, stopValues[i + 1]]);
    }
    const isColorValues = stopValues.some((s) => typeof s === "string");
    if (interpolator.type === "linear") {
      return isColorValues
        ? interpColorsLinear(stops)(inputValue)
        : interpLinear(stops)(inputValue);
    } else if (interpolator.type === "exponential") {
      return isColorValues
        ? interpColorsExp(interpolator.base, stops)(inputValue)
        : interpExp(interpolator.base, stops)(inputValue);
    }
    return null;
  }
);

const linear = op0(() => ({ type: "linear" }));

const exponential = op0((base: number) => ({ type: "exponential", base }));

const step = op0((input: number, ...params: any[]) => {
  let outputValue = params[0];
  for (let i = 1; i < params.length; i += 2) {
    const stop = params[i];
    // return the previous output
    if (stop > input) break;
    outputValue = params[i + 1];
  }
  return outputValue;
});

// -- String --

const concat = op0((...values: any[]) => values.join(""));

// TODO: this should check if the given text is renderable
const isSupportedScript = op0((_someText: string) => {
  return true;
});

// -- Color

// -- Math
const plus = op0((...values: number[]) => values.reduce((a, b) => a + b, 0));

// -- Camera --
const zoom = op1((zoom) => zoom);

export const builtinOps = {
  // -- Types --
  // TODO: array
  // TODO: boolean
  // TODO: collator
  format,
  // TODO: image
  literal,
  // TODO: number
  // TODO: number-format
  // TODO: object
  // TODO: string
  // TODO: to-boolean
  // TODO: to-color
  // TODO: to-number
  "to-string": toString,
  // TODO: typeof

  // -- Feature data --
  // TODO: accumulated
  // TODO: feature-state
  "geometry-type": geometryType,
  // TODO: id
  // TODO: line-progress
  // TODO: properties

  // -- Lookup --
  // TODO: at
  // TODO: at-interpolated
  // TODO: config
  get,
  has,
  "!has": notHas,
  in: inOp,
  // TODO: index-of
  // TODO: length
  // TODO: measure-light
  // TODO: slice
  // TODO: split
  // TODO: worldview

  // -- Decision --
  "!": not,
  "!=": notEqual,
  "<": lessThan,
  "<=": lessThanOrEqual,
  "==": equal,
  ">": greaterThan,
  ">=": greaterThanOrEqual,
  all,
  any,
  case: caseOp,
  coalesce,
  match,
  // TODO within

  // -- Ramps, scales, curves --
  interpolate,
  linear,
  exponential,
  // TODO: interpolate-hcl
  // TODO: interpolate-lab
  step,

  // -- Variable binding --

  // TODO: let
  // TODO: var

  // -- String --

  concat,
  // TODO: downcase
  "is-supported-script": isSupportedScript,
  // TODO: resolved-locale
  // TODO: upcase

  // -- Color

  // TODO: hsl
  // TODO: hsla
  // TODO: rgb
  // TODO: rgba
  // TODO: to-hsla
  // TODO: to-rgba

  // -- Math

  // TODO: -
  // TODO: *
  // TODO: /
  // TODO: %
  // TODO: ^
  "+": plus,
  // TODO: abs
  // TODO: acos
  // TODO: asin
  // TODO: atan
  // TODO: ceil
  // TODO: cos
  // TODO: distance
  // TODO: e
  // TODO: floor
  // TODO: ln
  // TODO: ln2
  // TODO: log10
  // TODO: log2
  // TODO: max
  // TODO: min
  // TODO: pi
  // TODO: random
  // TODO: round
  // TODO: sin
  // TODO: sqrt
  // TODO: tan

  // -- Camera --
  // TODO: distance-from-center
  // TODO: pitch
  zoom
} satisfies Record<string, Op>;
