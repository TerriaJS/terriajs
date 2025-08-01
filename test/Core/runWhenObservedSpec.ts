import {
  IReactionDisposer,
  makeAutoObservable,
  reaction,
  runInAction,
  when
} from "mobx";
import runWhenObserved from "../../lib/Core/runWhenObserved";

describe("runWhenObserved", function () {
  let testObj: { value: string; items: unknown[] };
  let valueCopy: string | undefined;
  let disposeObserver: IReactionDisposer;

  beforeEach(function () {
    testObj = new (class {
      value = "first";
      items = [];

      constructor() {
        makeAutoObservable(this);
      }
    })();

    runWhenObserved(testObj, "items", () =>
      // this reaction will be started when items is observed
      reaction(
        () => testObj.value,
        (newValue) => {
          // If this reaction is active then valueCopy will be same as value
          valueCopy = newValue;
        },
        { fireImmediately: true }
      )
    );

    // Observer that hangs for ever
    disposeObserver = when(
      () => testObj.items.length === Infinity,
      () => {}
    );
  });

  afterEach(function () {
    disposeObserver();
  });

  it("starts the given reaction when observableValue becomes observed", function () {
    expect(valueCopy).toBe("first");
    runInAction(() => {
      // This change should trigger the runWhenObserved reaction which sets valueCopy to "second"
      testObj.value = "second";
    });
    expect(valueCopy).toBe("second");
  });

  it("stops the reaction when the observableValue becomes unobserved", function () {
    runInAction(() => {
      // This change should trigger runWhenObserved reaction which sets valueCopy to "hundred"
      testObj.value = "hundred";
    });
    expect(valueCopy).toBe("hundred");

    runInAction(() => {
      // destroy observer
      disposeObserver();
    });

    runInAction(() => {
      // This change should not trigger the runWhenObserved reaction
      testObj.value = "hundred and one";
    });

    // valueCopy stays "hundred" as the observer has been destroyed
    expect(valueCopy).toBe("hundred");
  });
});
