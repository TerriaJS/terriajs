import ModelTraits from "./ModelTraits";

export type ModelTraitsInterface<ClassType> = {
  [Member in keyof ClassType]: Member extends ModelTraits
    ? ModelTraitsInterface<NonNullable<ClassType[Member]>>
    : ClassType[Member];
};
