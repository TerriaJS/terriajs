import { BaseModel } from "../Models/Definition/Model";
import ModelTraits, { TraitDefinitions } from "./ModelTraits";
import { TraitJsonSpec, TraitJsonSpecContext } from "./Trait";
import TraitsConstructor from "./TraitsConstructor";
import traitsClassToModelClass from "./traitsClassToModelClass";

export function createTraitJsonSpecContext(): TraitJsonSpecContext {
  return {
    definitions: {},
    visitedTraits: new Set<string>()
  };
}

export function cleanJsonSpec<T extends TraitJsonSpec>(spec: T): T {
  const cleaned = { ...spec };
  (Object.keys(cleaned) as Array<keyof T>).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

export function buildTraitsJsonSpecs(
  traits: TraitDefinitions,
  model: BaseModel,
  context: TraitJsonSpecContext
): Record<string, TraitJsonSpec> {
  const properties: Record<string, TraitJsonSpec> = {};
  Object.entries(traits).forEach(([traitId, trait]) => {
    properties[traitId] = trait.toJsonSpec(model, context);
  });
  return properties;
}

export function ensureTraitsClassDefinition(
  traitsClass: TraitsConstructor<ModelTraits>,
  model: BaseModel,
  context: TraitJsonSpecContext
): string {
  const definitionName = traitsClass.name || "Traits";

  if (context.definitions[definitionName]) {
    return `#/definitions/${definitionName}`;
  }

  if (context.visitedTraits.has(definitionName)) {
    return `#/definitions/${definitionName}`;
  }
  context.visitedTraits.add(definitionName);

  const ModelClass = traitsClassToModelClass(traitsClass);
  const nestedModel = new ModelClass(undefined, model.terria);

  // Placeholder to short-circuit recursive references
  context.definitions[definitionName] = { title: definitionName, type: "object" };

  const properties = buildTraitsJsonSpecs(
    traitsClass.traits,
    nestedModel,
    context
  );

  context.definitions[definitionName] = cleanJsonSpec({
    title: definitionName,
    description: traitsClass.description,
    type: "object",
    properties,
    additionalProperties: false
  });

  context.visitedTraits.delete(definitionName);

  return `#/definitions/${definitionName}`;
}

export function createModelJsonSchema(
  model: BaseModel,
  includeBaseProperties = true
): TraitJsonSpec {
  const context = createTraitJsonSpecContext();
  const properties = buildTraitsJsonSpecs(model.traits, model, context);

  if (includeBaseProperties) {
    properties.id = properties.id ?? {
      type: "string",
      description: "Unique identifier for this catalog member."
    };
    properties.type = properties.type ?? {
      type: "string",
      description: "The catalog member type identifier.",
      default: model.type
    };
    properties.shareKeys = properties.shareKeys ?? {
      type: "array",
      items: { type: "string" },
      description:
        "Alternative IDs this catalog member can be resolved by (including its own id if present)."
    };
  }

  const definitions =
    Object.keys(context.definitions).length > 0
      ? context.definitions
      : undefined;

  return cleanJsonSpec({
    title: model.constructor.name,
    description: model.TraitsClass.description,
    type: "object",
    properties,
    additionalProperties: false,
    definitions
  });
}
