import {
  TagGroupList,
  TagGroupRoot,
  TagRemoveButton,
  TagRoot
} from "./TagGroup";

// Compound components, assembled here so TagGroup.tsx only exports
// components
export const TagGroup = Object.assign(TagGroupRoot, {
  Root: TagGroupRoot,
  List: TagGroupList
});

export const Tag = Object.assign(TagRoot, {
  Root: TagRoot,
  RemoveButton: TagRemoveButton
});

export { TagGroupList, TagGroupRoot, TagRemoveButton, TagRoot };
export type {
  TagGroupListProps,
  TagGroupRootProps,
  TagGroupRootProps as TagGroupProps,
  TagRemoveButtonProps,
  TagRootProps,
  TagRootProps as TagProps,
  TagSize,
  TagVariant
} from "./TagGroup";
