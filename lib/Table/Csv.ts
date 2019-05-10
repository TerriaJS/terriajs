import papaparse from "papaparse";

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
  static parseString(csv: string, columnMajor: boolean = false): Promise<string[][]> {
    return new Promise<string[][]>((resolve, reject) => {
      papaparse.parse(csv, {
        ...getParseOptions(columnMajor, resolve, reject)
      });
    });
  }

  /**
   * Parses a CSV from a file.
   * @param csv The file to parse as a CSV.
   * @param columnMajor True if the returned array is an array of columns; False if the returned array is an array of rows.
   * @returns A promise that resolves to the CSV data.
   */
  static parseFile(file: File, columnMajor: boolean = false): Promise<string[][]> {
    return new Promise<string[][]>((resolve, reject) => {
      papaparse.parse(file, {
        ...getParseOptions(columnMajor, resolve, reject)
      });
    });
  }

  /**
   * Parses a CSV from a URL.
   * @param csv The URL to parse as a CSV.
   * @param columnMajor True if the returned array is an array of columns; False if the returned array is an array of rows.
   * @returns A promise that resolves to the CSV data.
   */
  static parseUrl(url: string, columnMajor: boolean = false): Promise<string[][]> {
    return new Promise<string[][]>((resolve, reject) => {
      papaparse.parse(url, {
        ...getParseOptions(columnMajor, resolve, reject),
        download: true
      });
    });
  }
}

function getParseOptions(columnMajor: boolean, resolve: (value: string[][]) => void, reject: (reason?: any) => void): papaparse.ParseConfig {
  return columnMajor ? getParseOptionsColumnMajor(resolve, reject): getParseOptionsRowMajor(resolve, reject);
}

function getParseOptionsRowMajor(resolve: (value: string[][]) => void, reject: (reason?: any) => void): papaparse.ParseConfig {
  const result: string[][] = [];

  return {
    skipEmptyLines: true,
    worker: useWorker,
    chunk: function(results) {
      const data = results.data;
      for (let i = 0; i < data.length; ++i) {
        result.push(data[i]);
      }
    },
    complete: function() {
      resolve(result);
    },
    error: function(e) {
      reject(e);
    }
  };
}

function getParseOptionsColumnMajor(resolve: (value: string[][]) => void, reject: (reason?: any) => void): papaparse.ParseConfig {
  const result: string[][] = [];

  return {
    skipEmptyLines: true,
    worker: useWorker,
    chunk: function(results) {
      const data = results.data;
      for (let i = 0; i < data.length; ++i) {
        const row = data[i];
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
    complete: function() {
      resolve(result);
    },
    error: function(e) {
      reject(e);
    }
  };
}
