import { expectTrue, expectFalse } from "./TypeChecks";
import { AllowsNull, Equals } from "../../lib/Core/TypeConditionals";
import { CopyNull } from "../../lib/Core/TypeModifiers";

expectTrue<AllowsNull<number | null>>();
expectFalse<AllowsNull<number | undefined>>();
expectTrue<AllowsNull<number | null | undefined>>();

expectTrue<Equals<CopyNull<number | null, string>, string | null>>();
