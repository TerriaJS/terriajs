import GroupMixin from "./ModelMixins/GroupMixin";
import UrlMixin from "./ModelMixins/UrlMixin";
import CreateModel from "./Models/Definition/CreateModel";
import Model from "./Models/Definition/Model";
import mixTraits from "./Traits/mixTraits";
import GroupTraits from "./Traits/TraitsClasses/GroupTraits";
import ShadowTraits from "./Traits/TraitsClasses/ShadowTraits";
import UrlTraits from "./Traits/TraitsClasses/UrlTraits";

// interface FooProps {
//   foo1: number;
//   foo2: string;
//   common: number;
// }

// interface BarProps {
//   bar1: number;
//   bar2: string;
//   common: number;
// }

// type Model<Props> = Props & {
//   getProp<P extends keyof Props>(prop: P): Props[P];
// };

// type FooThing = Model<FooProps>;

// const fooThing: FooThing = {
//   foo1: 1,
//   foo2: "foo2",
//   common: 42,
//   getProp(prop) {
//     return this[prop];
//   }
// };

// fooThing.getProp("foo1"); // ok

// type BarThing = Model<BarProps>;

// const barThing: BarThing = {
//   bar1: 1,
//   bar2: "bar2",
//   common: 42,
//   getProp(prop) {
//     return this[prop];
//   }
// };

// barThing.getProp("bar1"); // ok

// let thing: FooThing | BarThing;
// if (Math.random() > 0.5) {
//   thing = fooThing;
// } else {
//   thing = barThing;
// }

// thing.common;
// thing.getProp("thing");

class ThingGroup1Traits extends mixTraits(UrlTraits, GroupTraits) {}
class ThingGroup2Traits extends mixTraits(
  UrlTraits,
  GroupTraits,
  ShadowTraits
) {}

class ThingGroup1 extends GroupMixin(CreateModel(ThingGroup1Traits)) {
  async forceLoadMembers() {}
}

class ThingGroup2 extends GroupMixin(CreateModel(ThingGroup2Traits)) {
  async forceLoadMembers() {}
}

class UrlThing extends UrlMixin(CreateModel(ThingGroup1Traits)) {}

const thingGroup1 = new ThingGroup1(undefined, undefined as any);
const thingGroup2 = new ThingGroup2(undefined, undefined as any);
let thingGroup: ThingGroup1 | ThingGroup2;

if (Math.random() > 0.5) {
  thingGroup = thingGroup1;
} else {
  thingGroup = thingGroup2;
}

thingGroup.setTrait("user", "sortMembersBy", "foo");

// const urlThing = new UrlThing(undefined, undefined as any);
(thingGroup as Model<ThingGroup1Traits>).setTrait("user", "url", "foo");
// urlThing.setTrait("user", "sortMembersBy", "foo");
