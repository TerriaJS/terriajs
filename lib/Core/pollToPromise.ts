import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import getTimestamp from "terriajs-cesium/Source/Core/getTimestamp";

interface Options {
  pollInterval?: number;
  timeout?: number;
}

const pollToPromise = function (f: () => boolean, options: Options) {
  options = defaultValue(options, (defaultValue as any).EMPTY_OBJECT);

  const pollInterval = defaultValue(options.pollInterval, 1);
  const timeout = defaultValue(options.timeout, 5000);

  return new Promise<void>((resolve, reject) => {
    const startTimestamp = getTimestamp();
    const endTimestamp = startTimestamp + timeout;

    function poller() {
      if (f()) {
        resolve();
      } else {
        if (getTimestamp() > endTimestamp) {
          reject();
        } else {
          setTimeout(poller, pollInterval);
        }
      }
    }

    poller();
  });
};

export default pollToPromise;
