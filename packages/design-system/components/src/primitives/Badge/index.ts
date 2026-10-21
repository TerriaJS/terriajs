import { BadgeAnchor, BadgeLabel, BadgeRoot } from "./Badge";

// Compound component, assembled here so Badge.tsx only exports components
export const Badge = Object.assign(BadgeRoot, {
  Root: BadgeRoot,
  Anchor: BadgeAnchor,
  Label: BadgeLabel
});

export { BadgeAnchor, BadgeLabel, BadgeRoot };
export type {
  BadgeAnchorProps,
  BadgeColor,
  BadgeLabelProps,
  BadgePlacement,
  BadgeProps,
  BadgeSize,
  BadgeVariant
} from "./Badge";
