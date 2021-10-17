import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export class TermTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Term",
    description: "Term to search for."
  })
  term!: string;

  @primitiveTrait({
    type: "string",
    name: "Content",
    description: "Content to show to user on term hover."
  })
  content!: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Aliases",
    description: "Term aliases to look for."
  })
  aliases?: string[];
}
