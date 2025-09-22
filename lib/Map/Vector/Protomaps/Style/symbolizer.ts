import {
  CenteredSymbolizer,
  CenteredTextSymbolizer,
  Feature,
  LabelSymbolizer,
  TextSymbolizer,
  TextSymbolizerOptions
} from "protomaps-leaflet";

interface TextFieldOptions {
  textField?: (zoom?: number, f?: Feature) => string | undefined;
}

export class CustomCenteredTextSymbolizer extends CenteredTextSymbolizer {
  centered: LabelSymbolizer;

  constructor(
    options: Omit<TextSymbolizerOptions, "labelProps"> & TextFieldOptions
  ) {
    super(options);
    const textFieldSymbolizer = new TextSymbolizer(options);
    // The protomaps implementation only supports reading text value from
    // a feature's property but we want to be able to generate labels from any
    // text string. This is a hacky override to make it work. TODO: implement
    // the text transform code from protomaps-leaflet
    textFieldSymbolizer.text.get = (z, f) => options.textField?.(z, f);
    this.centered = new CenteredSymbolizer(textFieldSymbolizer);
  }
}
