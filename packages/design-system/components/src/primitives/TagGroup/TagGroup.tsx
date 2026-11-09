import {
  Children,
  createContext,
  forwardRef,
  useContext,
  useMemo
} from "react";
import {
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
  type TagGroupProps as AriaTagGroupProps,
  type TagListProps as AriaTagListProps,
  type TagProps as AriaTagProps
} from "react-aria-components/TagGroup";
import { XIcon } from "@terria/design-system-icons";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import { pickChildren } from "../../utils/pickChildren";
import "./TagGroup.css";

type TagSize = "sm" | "md" | "lg";
type TagVariant = "default" | "surface";

type TagGroupContextValue = { size?: TagSize; variant?: TagVariant };

const TagGroupContext = createContext<TagGroupContextValue>({});

type TagGroupRootProps = AriaTagGroupProps & {
  size?: TagSize;
  variant?: TagVariant;
};

// A Label, TagGroup.List holding the Tags, and a Description or FieldError.
// Tags select when selectionMode allows, and show a remove button when
// onRemove is given
const TagGroupRoot = forwardRef<HTMLDivElement, TagGroupRootProps>(
  ({ size, variant, ...props }, ref) => {
    const context = useMemo(() => ({ size, variant }), [size, variant]);

    return (
      <TagGroupContext.Provider value={context}>
        <AriaTagGroup {...props} ref={ref} data-tds="tag-group" />
      </TagGroupContext.Provider>
    );
  }
);

TagGroupRoot.displayName = "TagGroup";

type TagGroupListProps<T extends object> = AriaTagListProps<T>;

const TagGroupList = <T extends object>(
  props: TagGroupListProps<T>
): React.ReactElement => {
  return <AriaTagList<T> {...props} data-tds="tag-group-list" />;
};

TagGroupList.displayName = "TagGroup.List";

type TagRemoveButtonProps = AriaButtonProps;

// Removes its tag; React Aria names it "Remove" with the tag's text. Placed
// in a Tag's children to replace the default cross
const TagRemoveButton = forwardRef<HTMLButtonElement, TagRemoveButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <AriaButton
        {...props}
        ref={ref}
        slot="remove"
        data-tds="tag-remove-button"
      >
        {children ?? <XIcon aria-hidden />}
      </AriaButton>
    );
  }
);

TagRemoveButton.displayName = "Tag.RemoveButton";

type TagRootProps = AriaTagProps;

// The tag's text, for typing to find it, when it also holds an icon
const firstText = (children: TagRootProps["children"]): string | undefined => {
  if (typeof children === "string") return children;
  if (typeof children === "function") return undefined;
  // eslint-disable-next-line @eslint-react/no-children-to-array -- Only reads the children, to find their text
  return Children.toArray(children).find(
    (child): child is string => typeof child === "string"
  );
};

// A custom RemoveButton among the children replaces the default one, and
// goes last
const TagRoot = forwardRef<HTMLDivElement, TagRootProps>(
  ({ children, textValue, ...props }, ref) => {
    const { size = "md", variant = "default" } = useContext(TagGroupContext);
    const [content, removeButton] = useMemo(
      () =>
        typeof children === "function"
          ? [children, undefined]
          : pickChildren(children, TagRemoveButton),
      [children]
    );

    return (
      <AriaTag
        textValue={textValue ?? firstText(children)}
        {...props}
        ref={ref}
        data-tds="tag"
        data-tds-size={size}
        data-tds-variant={variant}
      >
        {(renderProps) =>
          typeof content === "function" ? (
            content(renderProps)
          ) : (
            <>
              {content}
              {renderProps.allowsRemoving &&
                (removeButton ?? <TagRemoveButton />)}
            </>
          )
        }
      </AriaTag>
    );
  }
);

TagRoot.displayName = "Tag";

export { TagGroupRoot, TagGroupList, TagRoot, TagRemoveButton };
export type {
  TagGroupRootProps,
  TagGroupListProps,
  TagRootProps,
  TagRemoveButtonProps,
  TagSize,
  TagVariant
};
