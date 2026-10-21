// The Figma pages stories show in their Design tab (@storybook/addon-designs).
// Node ids are written as Figma URLs write them: "2852-11850", not "2852:11850".
const FIGMA_FILE =
  "https://www.figma.com/design/dsDXz50atuBer9WlJXaflS/Terria-Design-System--WIP-";

const FIGMA_PAGES = {
  Alert: "5375-72355",
  Badge: "19865-36040",
  Button: "5375-69211",
  ButtonGroup: "14202-4550",
  Checkbox: "5375-70992",
  CheckboxGroup: "17290-24388",
  Chip: "5375-71211",
  CloseButton: "5375-69669",
  Input: "17293-26222",
  ListBox: "5375-70869",
  Modal: "5375-77858",
  Popover: "6192-4931",
  ProgressCircle: "21302-79204",
  RadioGroup: "5375-70882",
  Select: "5375-70822",
  Separator: "5375-70816",
  Slider: "5375-69689",
  Switch: "5375-71127",
  Tabs: "5375-79785",
  TextArea: "17293-35712",
  TextField: "5375-69732",
  Tooltip: "5375-71565",
  Typography: "17411-35676"
} as const;

export const figmaDesign = (
  page: keyof typeof FIGMA_PAGES
): { design: { type: "figma"; url: string } } => ({
  design: {
    type: "figma",
    url: `${FIGMA_FILE}?node-id=${FIGMA_PAGES[page]}`
  }
});
