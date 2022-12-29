import * as UploadDataTypes from "../../lib/ViewModels/UploadDataTypes";

describe("UploadDataTypes", function () {
  describe("getDataTypes", function () {
    it("returns all the builtin local upload types", function () {
      expect(UploadDataTypes.getDataTypes().localDataType.length).toEqual(10);
    });

    it("returns all the builtin remote upload types", function () {
      expect(UploadDataTypes.getDataTypes().remoteDataType.length).toEqual(23);
    });
  });

  describe("addRemoteUploadType", function () {
    it("should add the given upload type to remoteDataType list", function () {
      UploadDataTypes.addRemoteUploadType({
        value: "foo42",
        name: "Foo type",
        description: "Foo data"
      });
      const fooType = UploadDataTypes.getDataTypes().remoteDataType.find(
        (type) => type.value === "foo42"
      );
      expect(fooType).toBeDefined();
      expect(fooType?.name).toEqual("Foo type");
      expect(fooType?.description).toEqual("Foo data");
    });
  });

  describe("addLocalUploadType", function () {
    it("should add the given upload type to localDataType list", function () {
      UploadDataTypes.addLocalUploadType({
        value: "foo42",
        name: "Foo type",
        description: "Foo files"
      });
      const fooType = UploadDataTypes.getDataTypes().localDataType.find(
        (type) => type.value === "foo42"
      );
      expect(fooType).toBeDefined();
      expect(fooType?.name).toEqual("Foo type");
      expect(fooType?.description).toEqual("Foo files");
    });
  });
});
