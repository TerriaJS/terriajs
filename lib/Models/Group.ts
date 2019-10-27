import { BaseModel } from "./Model";
import ModelReference from "../Traits/ModelReference";

export default interface Group {
  readonly isGroup: boolean;
  readonly isLoadingMembers: boolean;
  readonly memberModels: ReadonlyArray<BaseModel>;
  readonly isOpen: boolean;
  readonly members: ReadonlyArray<ModelReference>;

  toggleOpen(stratumId: string): void;
  loadMembers(): Promise<void>;
  refreshKnownContainerUniqueIds(uniqueId: string | undefined): void;
  add(stratumId: string, member: BaseModel): void;
  remove(stratumId: string, member: BaseModel): void;
  moveMemberToIndex(
    stratumId: string,
    member: BaseModel,
    newIndex: number
  ): void;
}
