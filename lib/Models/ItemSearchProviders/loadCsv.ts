import Papa from "papaparse";
import loadText from "../../Core/loadText";
import makeRealPromise from "../../Core/makeRealPromise";

export default function loadCsv(
  url: string,
  options?: Papa.ParseConfig
): Promise<any[]> {
  return makeRealPromise<string>(loadText(url)).then(
    (text: string) =>
      new Promise((resolve, reject) =>
        Papa.parse(text, {
          worker: true,
          complete: result => resolve(result.data),
          error: error => reject(error),
          ...options
        })
      )
  );
}
