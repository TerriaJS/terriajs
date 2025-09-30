import { Feature, JsonValue } from "protomaps-leaflet";
import { isJsonNumber, isJsonString } from "../../../../Core/Json";
import { builtinOps } from "./ops";

export type Expr = JsonValue;
export type Thunk<T = JsonValue> = (zoom?: number, f?: Feature) => T;

type Vars = Record<string, Thunk>;

export function evalExpr(expr: Expr, vars: Vars): Thunk {
  if (!Array.isArray(expr)) {
    return () => expr; // An atomic value
  }

  const [opCode, ...params] = expr;
  const op = isJsonString(opCode) ? getOp(opCode) : undefined;
  if (!op) {
    throw new Error(`Unsupported style function '${opCode}'`);
  }
  return op.applyOp(params, vars);
}

function evaluator<T>(mapValue: (value: JsonValue) => T) {
  function evalWithDefault(expr: Expr): Thunk<T>;
  function evalWithDefault(
    expr: Expr,
    defaultValue: NonNullable<T>
  ): Thunk<NonNullable<T>>;
  function evalWithDefault(expr: Expr, defaultValue?: T): Thunk<T | undefined> {
    try {
      const t = evalExpr(expr, {});
      return thunk(t.length, (...env) => {
        try {
          const value = mapValue(t(...env));
          return value ?? defaultValue;
        } catch (error) {
          logStyleError(error);
          throw error;
        }
      });
    } catch (error) {
      logStyleError(error);
      return () => defaultValue;
    }
  }
  return evalWithDefault;
}

export const evalString = evaluator((value) =>
  typeof value === "string" ? value : undefined
);

export const evalNumber = evaluator((value) =>
  typeof value === "number" && !isNaN(value) ? value : undefined
);

export const evalBool = evaluator((value) =>
  typeof value === "boolean" ? value : undefined
);

export const evalStringArray = evaluator((value) =>
  Array.isArray(value) && value.every(isJsonString) ? value : undefined
);

export const evalNumberArray = evaluator((value) =>
  Array.isArray(value) && value.every(isJsonNumber) ? value : undefined
);

export const evalColor = evaluator((value) =>
  typeof value === "string" ? value : undefined
);

export const evalEnum = function <T extends readonly unknown[]>(enumValues: T) {
  return evaluator((value) =>
    enumValues.includes(value) ? (value as T[number]) : undefined
  );
};

export function thunk<T>(
  arity: number,
  fn: (zoom?: number, f?: Feature) => T
): Thunk<T> {
  if (arity === 2) {
    return (zoom, f) => {
      if (zoom === undefined) throw new Error(`Missing zoom parameter`);
      if (f === undefined) throw new Error(`Missing feature parameter`);
      return fn(zoom, f);
    };
  } else if (arity === 1) {
    return (zoom) => {
      if (zoom === undefined) throw new Error(`Missing zoom parameter`);
      return fn(zoom, undefined);
    };
  } else if (arity === 0) {
    // fn has no dependencies, so we can execute the function and return a simple thunk
    const value = fn(undefined, undefined);
    return () => value;
  } else {
    throw new Error(`Invalid arity`);
  }
}

export function mapThunk<A, B>(
  srcThunk: Thunk<A>,
  mapValue: (value: A) => B
): Thunk<B> {
  const arity = srcThunk.length;
  return thunk(arity, (zoom, f) => {
    try {
      return mapValue(srcThunk(zoom, f));
    } catch (error) {
      logStyleError(error);
      throw error;
    }
  });
}

export function mapAllThunks<Tuple extends unknown[], T>(
  srcThunks: [...{ [K in keyof Tuple]: Thunk<Tuple[K]> }],
  mapValues: (values: Tuple) => T
): Thunk<T> {
  const maxArity = Math.max(...srcThunks.map((t) => t.length));
  return thunk(maxArity, (zoom, f) =>
    mapValues(srcThunks.map((t) => t(zoom, f)) as any)
  );
}

export function mergeAllThunks<Tuple extends unknown[], T>(
  srcThunks: [...{ [K in keyof Tuple]: Thunk<Tuple[K]> }],
  newThunk: (values: typeof srcThunks) => Thunk<T>
): Thunk<T> {
  const t = newThunk(srcThunks);
  const maxArity = Math.max(t.length, ...srcThunks.map((t) => t.length));
  return thunk(maxArity, t);
}

export type Op<T = unknown> = T & {
  applyOp: (paramsExpr: Expr[], vars: Vars) => Thunk;
};

// Create an operation that strictly evals its params before executing it
function createOp(opArity: 0 | 1 | 2, opImpl: (...args: any[]) => any) {
  return Object.assign(opImpl, {
    applyOp: (paramExprs: Expr[], vars: Vars) => {
      const paramThunks = paramExprs.map((e) => evalExpr(e, vars));
      const arity = Math.max(opArity, ...paramThunks.map((t) => t.length));
      return thunk(arity, function opThunk(zoom, f) {
        const params: any = paramThunks.map((t) => t(zoom, f));
        return opArity === 2
          ? opImpl(zoom, f, ...params)
          : opArity === 1
          ? opImpl(zoom, ...params)
          : opImpl(...params);
      });
    }
  });
}

// Op that takes 2 context variables - zoom and feature
export function op2<T extends JsonValue, Args extends JsonValue[]>(
  opImpl: (zoom: number, f: Feature, ...args: Args) => T
): Op<typeof opImpl> {
  return createOp(2, opImpl);
}

// Op that takes 1 context variable - zoom
export function op1<T extends JsonValue, Args extends JsonValue[]>(
  opImpl: (zoom: number, ...args: Args) => T
): Op<typeof opImpl> {
  return createOp(1, opImpl);
}

// Op that takes zero context variables
export function op0<T extends JsonValue, Args extends JsonValue[]>(
  opImpl: (...args: Args) => T
): Op<typeof opImpl> {
  return createOp(0, opImpl);
}

export function getOp(opCode: string): Op | undefined {
  return builtinOps[opCode as keyof typeof builtinOps];
}

const maxErrors = 100;
let errorsLogged = 0;

export function logStyleError(error: unknown) {
  if (errorsLogged > maxErrors) return;
  if (errorsLogged === maxErrors) {
    console.warn(
      `More than ${maxErrors} style errors reported. Supressing remaining errors.`
    );
    errorsLogged += 1;
    return;
  }

  console.warn((error as any)?.message ?? error);
  errorsLogged += 1;
}
