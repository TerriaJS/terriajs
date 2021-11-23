import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export class FeedbackTraits extends ModelTraits {
  @primitiveTrait({
    name: "Preamble",
    type: "string",
    description: "Text showing at the top of feedback form."
  })
  preamble: string = "translate#feedback.feedbackPreamble";

  @primitiveTrait({
    name: "Postamble",
    type: "string",
    description: "Text showing at the bottom of feedback form."
  })
  postamble?: string;

  @primitiveTrait({
    name: "Min length",
    type: "number",
    description: "Minimum length of feedback comment."
  })
  minLength: number = 0;
}
