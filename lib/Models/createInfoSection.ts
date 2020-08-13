import { runInAction } from "mobx";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import createStratumInstance from "./createStratumInstance";
import StratumFromTraits from "./StratumFromTraits";

export default function createInfoSection(name: string, content?: string) {
  const traits = createStratumInstance(InfoSectionTraits);
  runInAction(() => {
    traits.name = name;
    traits.content = content;
  });
  return traits;
}
