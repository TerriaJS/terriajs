import { Sheet } from "protomaps-leaflet";

export default class SpriteSheets {
  private readonly sheets: Map<string, Sheet>;

  constructor() {
    this.sheets = new Map();
  }

  add(name: string, sheet: Sheet) {
    this.sheets.set(name, sheet);
  }

  getIcon(name: string) {
    let [sheetName, iconName] = name?.split(":") ?? [];
    if (iconName === undefined) {
      [sheetName, iconName] = ["", sheetName];
    }
    const sheet = this.sheets.get(sheetName);
    const glyph = sheet?.get(iconName);
    const icon = name && glyph && sheet ? { name, glyph, sheet } : undefined;
    return icon;
  }

  async loadAll() {
    return Promise.all([...this.sheets.values()].map((sheet) => sheet.load()));
  }
}
