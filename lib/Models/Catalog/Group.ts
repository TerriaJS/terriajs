import Result from "../../Core/Result";
import ModelReference from "../../Traits/ModelReference";
import { BaseModel } from "../Definition/Model";

export default interface Group {
  readonly isGroup: boolean;
  readonly isLoadingMembers: boolean;
  readonly memberModels: ReadonlyArray<BaseModel>;
  readonly isOpen: boolean;
  readonly members: ReadonlyArray<ModelReference>;

  toggleOpen(stratumId: string): void;
  loadMembers(): Promise<Result<void>>;
  refreshKnownContainerUniqueIds(uniqueId: string | undefined): void;
  add(stratumId: string, member: BaseModel): void;
  addMembersFromJson(stratumId: string, members: any): Result;
  remove(stratumId: string, member: BaseModel): void;
  moveMemberToIndex(
    stratumId: string,
    member: BaseModel,
    newIndex: number
  ): void;
}
