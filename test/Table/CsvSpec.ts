import Csv from "../../lib/Table/Csv";

describe("Csv", function () {
  function checkCsvParse(dataColumnMajor: string[][]) {
    expect(dataColumnMajor.length).toEqual(2);
    expect(dataColumnMajor[0][0]).toEqual("x");
    expect(dataColumnMajor[0].slice(1)).toEqual(["1", "3", "4"]);
    expect(dataColumnMajor[1][0]).toEqual("y");
    expect(dataColumnMajor[1].slice(1)).toEqual(["5", "8", "-3"]);
  }

  it("can read from csv string", async function () {
    const csvString = "x,y\r\n1,5\r\n3,8\r\n4,-3\r\n";
    const data = await Csv.parseString(csvString, true);
    checkCsvParse(data);
  });

  it("can read from csv string that includes comments", async function () {
    const csvString =
      "x,y\r\n1,5\r\n3,8\r\n4,-3\r\n# this is a comment\n// and this\n";
    const data = await Csv.parseString(csvString, true, true);
    checkCsvParse(data);
  });
});
