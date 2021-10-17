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
    name: "Min length",
    type: "number",
    description: "Minimum length of feedback comment."
  })
  minLength: number = 0;
}
