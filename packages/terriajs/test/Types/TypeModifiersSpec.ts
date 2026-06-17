import { Equals } from "../../lib/Core/TypeConditionals";
import { CopyUndefined } from "../../lib/Core/TypeModifiers";
import { expectTrue } from "./TypeChecks";

expectTrue<
  Equals<CopyUndefined<number | undefined, string>, string | undefined>
>();
expectTrue<Equals<CopyUndefined<number, string>, string>>();
expectTrue<
  Equals<CopyUndefined<undefined | number, string>, undefined | string>
>();
