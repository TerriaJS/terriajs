import CustomComponent from "terriajs/lib/ReactViews/Custom/CustomComponent";
import PreviewRenderers from "terriajs/lib/ReactViews/Preview/PreviewRenderers";
import OgcProcessCatalogFunction from "../Models/Ogc/Process/OgcProcessCatalogFunction";
import OgcProcessPreviewRenderer from "./OgcProcessPreviewRenderer";
import { ProcessLinkCustomComponent } from "./ProcessLink";

export default function registerCustomComponentTypes() {
  CustomComponent.register(new ProcessLinkCustomComponent());

  PreviewRenderers.set(
    OgcProcessCatalogFunction.type,
    OgcProcessPreviewRenderer
  );
}
