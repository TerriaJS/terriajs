type DoneCallback = () => void;
type TestFunction = (done: DoneCallback) => void;

declare const describe: any;
declare const it: (name: string, f: TestFunction) => void;
declare const expect: any;
declare const fail: any;
declare const afterEach: any;
declare const beforeEach: any;
