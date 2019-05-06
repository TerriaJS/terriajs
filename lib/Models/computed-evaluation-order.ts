import { computed, autorun, observable, trace } from "mobx";

class Test {
  @observable value = "initial value";

  @computed get foo() {
    trace();
    console.log("evaluating foo");
    return computed(() => {
      trace();
      console.log("evaluating nested computed");
      return this.value;
    }).get();
  }
}

const t = new Test();

autorun(() => {
  console.log(t.foo);
});

setTimeout(() => {
  t.value = "new value";
}, 1000);
