import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

class WelcomeMessageVideoTraits extends ModelTraits {
  @primitiveTrait({
    name: "Title",
    type: "string",
    description: "Title of the video."
  })
  title: string = "Getting started with the map";

  @primitiveTrait({
    name: "Url",
    type: "string",
    description: "Url of the video."
  })
  url: string = "https://www.youtube-nocookie.com/embed/FjSxaviSLhc";

  @primitiveTrait({
    name: "Placeholder image",
    type: "string",
    description: "Placeholder image"
  })
  placeholderImage: string =
    "https://img.youtube.com/vi/FjSxaviSLhc/maxresdefault.jpg";
}

export class WelcomeMessageTraits extends ModelTraits {
  @primitiveTrait({
    name: "Show welcome message",
    type: "boolean",
    description: "True to display welcome message on startup."
  })
  show: boolean = false;

  @objectTrait({
    name: "Welcome message video",
    type: WelcomeMessageVideoTraits,
    description: "Video to show in welcome message."
  })
  video?: WelcomeMessageVideoTraits;
}
