import papaparse from "papaparse";
import loadWithXhr from "../Core/loadWithXhr";

// We'd like to use `FeatureDetection.supportsWebWorkers()` here, but
// PapaParse doesn't get along with our webpack configuration. It ends up
// trying to load the entire bundle into a web worker. This is inefficient
// to begin with, but also breaks because we use `require` and `window` in
// places and these are not defined in web workers.
const useWorker = false;

export default class Csv {
  /**
   * Parses a CSV from a string.
   * @param csv The string to parse as a CSV.
   * @param columnMajor True if the returned array is an array of columns; False if the returned array is an array of rows.
   * @returns A promise that resolves to the CSV data.
   */
  static parseString(
    csv: string,
    columnMajor: boolean = false,
    filterOutComments: boolean = false,
    options: papaparse.ParseConfig = {}
  ): Promise<string[][]> {
    return new Promise<string[][]>((resolve, reject) => {
      papaparse.parse(csv, {
        ...getParseOptions(columnMajor, filterOutComments, resolve, reject),
        ...options
      });
    });
  }

  /**
   * Parses a CSV from a file.
   * @param csv The file to parse as a CSV.
   * @param columnMajor True if the returned array is an array of columns; False if the returned array is an array of rows.
   * @returns A promise that resolves to the CSV data.
   */
  static parseFile(
    file: File,
    columnMajor: boolean = false,
    filterOutComments: boolean = false,
    options: papaparse.ParseConfig = {}
  ): Promise<string[][]> {
    return new Promise<string[][]>((resolve, reject) => {
      papaparse.parse(file, {
        ...getParseOptions(columnMajor, filterOutComments, resolve, reject),
        ...options
      });
    });
  }

  /**
   * Parses a CSV from a URL.
   * @param csv The URL to parse as a CSV.
   * @param columnMajor True if the returned array is an array of columns; False if the returned array is an array of rows.
   * @returns A promise that resolves to the CSV data.
   */
  static parseUrl(
    url: string,
    columnMajor: boolean = false,
    filterOutComments: boolean = false,
    options: papaparse.ParseConfig = {}
  ): Promise<string[][]> {
    return loadWithXhr({ url }).then((csv: any) => {
      if (typeof csv === "string") {
        return Csv.parseString(csv, columnMajor, filterOutComments, options);
      } else {
        throw "Request failed";
      }
    });
    // There is currently a bug when using papaparse to fetch CSV URLs
    // See: https://github.com/mholt/PapaParse/pull/832
    // return new Promise<string[][]>((resolve, reject) => {
    //   papaparse.parse(url, {
    //     ...getParseOptions(columnMajor, resolve, reject),
    //     download: true,
    //   });
    // });
  }
}

function getParseOptions(
  columnMajor: boolean,
  filterOutComments: boolean,
  resolve: (value: string[][]) => void,
  reject: (reason?: any) => void
): papaparse.ParseConfig {
  return columnMajor
    ? getParseOptionsColumnMajor(filterOutComments, resolve, reject)
    : getParseOptionsRowMajor(filterOutComments, resolve, reject);
}

function getParseOptionsRowMajor(
  filterOutComments: boolean,
  resolve: (value: string[][]) => void,
  reject: (reason?: any) => void
): papaparse.ParseConfig {
  const result: string[][] = [];
  let parser: any = null;

  return {
    comments: filterOutComments,
    skipEmptyLines: true,
    worker: useWorker,
    chunk: function (results, p) {
      parser = p;
      const data = results.data;
      for (let i = 0; i < data.length; ++i) {
        result.push(data[i]);
      }
    },
    complete: function () {
      resolve(result);
    },
    error: function (e) {
      // If we did manage to get some data lets use what we've got
      // Perhaps there was an error because there was no Content-Length header
      if (result.length > 0) parser.abort();
      else reject(e);
    }
  };
}

function getParseOptionsColumnMajor(
  filterOutComments: boolean,
  resolve: (value: string[][]) => void,
  reject: (reason?: any) => void
): papaparse.ParseConfig {
  const result: string[][] = [];
  let parser: any = null;

  return {
    comments: filterOutComments,
    skipEmptyLines: true,
    worker: useWorker,
    chunk: function (results, p) {
      parser = p;
      const data = results.data;
      for (let i = 0; i < data.length; ++i) {
        const row = data[i];
        if (i === 0) cleanColumnNames(row);
        for (let j = 0; j < row.length; ++j) {
          let destColumn = result[j];
          if (destColumn === undefined) {
            destColumn = [];
            result.push(destColumn);
          }
          destColumn.push(row[j]);
        }
      }
    },
    complete: function () {
      resolve(result);
    },
    error: function (e) {
      // If we did manage to get some data lets use what we've got
      // Perhaps there was an error because there was no Content-Length header
      if (result.length > 0) parser.abort();
      else reject(e);
    }
  };
}

function cleanColumnNames(columnNames: string[]) {
  for (var i = 0; i < columnNames.length; ++i) {
    if (typeof columnNames[i] === "string") {
      columnNames[i] = columnNames[i].trim();
    }
  }
}
