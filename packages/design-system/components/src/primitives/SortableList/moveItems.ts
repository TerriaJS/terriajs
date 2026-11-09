import type {
  DroppableCollectionReorderEvent,
  Key
} from "react-aria-components/GridList";

type ItemDropTarget = DroppableCollectionReorderEvent["target"];

// Moves the items with the keys before or after the target, keeping the rest
// in order. A target that isn't among the rest, such as one of the moved
// items, leaves them as they are
const moveItems = <T extends { id: Key }>(
  items: Iterable<T>,
  keys: Set<Key>,
  target: ItemDropTarget
): T[] => {
  const list = [...items];
  const moved = list.filter((item) => keys.has(item.id));
  const rest = list.filter((item) => !keys.has(item.id));
  const index = rest.findIndex((item) => item.id === target.key);
  if (index < 0) return list;
  const at = target.dropPosition === "after" ? index + 1 : index;
  return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
};

export { moveItems };
export type { ItemDropTarget };
