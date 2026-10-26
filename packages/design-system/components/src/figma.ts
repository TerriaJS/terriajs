// The Figma pages stories show in their Design tab (@storybook/addon-designs).
// Node ids are written as Figma URLs write them: "2852-11850", not "2852:11850".
const FIGMA_FILE =
  "https://www.figma.com/design/dsDXz50atuBer9WlJXaflS/Terria-Design-System--WIP-";

const FIGMA_PAGES = {
  Accordion: "5375-79876",
  Alert: "5375-72355",
  AlertDialog: "7814-319",
  Badge: "19865-36040",
  Button: "5375-69211",
  Breadcrumbs: "14153-3704",
  ButtonGroup: "14202-4550",
  Calendar: "5375-71626",
  Card: "5375-72791",
  Checkbox: "5375-70992",
  CheckboxGroup: "17290-24388",
  Chip: "5375-71211",
  CloseButton: "5375-69669",
  ColorArea: "18514-47954",
  ColorField: "18530-48241",
  ColorPicker: "18553-86417",
  ColorSlider: "18553-85013",
  ColorSwatch: "18408-5727",
  ColorSwatchPicker: "18411-2327",
  DateField: "17293-41856",
  DatePicker: "5375-72308",
  Disclosure: "6160-642",
  DisclosureGroup: "17293-43646",
  Drawer: "21149-43114",
  Dropdown: "5375-70150",
  Effects: "17422-36753",
  Colors: "17361-32787",
  Icons: "2217-823",
  Input: "17293-26222",
  InputGroup: "17293-29953",
  Kbd: "5375-70805",
  Link: "5375-69635",
  ListBox: "5375-70869",
  Modal: "5375-77858",
  NumberField: "17293-33571",
  Popover: "6192-4931",
  ProgressBar: "21302-78002",
  ProgressCircle: "21302-79204",
  Radius: "17421-36561",
  RadioGroup: "5375-70882",
  ScrollShadow: "5375-73776",
  SearchField: "17293-34733",
  Select: "5375-70822",
  Separator: "5375-70816",
  Slider: "5375-69689",
  Spinner: "5375-71607",
  Surface: "17294-52295",
  Switch: "5375-71127",
  Tabs: "5375-79785",
  TextArea: "17293-35712",
  TextField: "5375-69732",
  ToggleButton: "15237-23433",
  ToggleButtonGroup: "15251-25651",
  TimeField: "17293-42243",
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
