interface IElementConfig {
  visible?: boolean;
}

export default class ElementsConfig {
  [key: string]: IElementConfig;
}
