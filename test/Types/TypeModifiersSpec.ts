import { Equals } from '../../lib/Core/TypeConditionals';
import { ApplyUndefined } from '../../lib/Core/TypeModifiers';
import { expectTrue } from './TypeChecks';

expectTrue<Equals<ApplyUndefined<number | undefined, string>, string | undefined>>();
expectTrue<Equals<ApplyUndefined<number, string>, string>>();
expectTrue<Equals<ApplyUndefined<undefined | number, string>, undefined | string>>();
