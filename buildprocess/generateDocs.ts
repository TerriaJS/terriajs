import fs from "fs";
import { uniqueId } from "lodash-es";
import YAML from "yaml";
import flatten from "../lib/Core/flatten";
import isDefined from "../lib/Core/isDefined";
import markdownToHtml from "../lib/Core/markdownToHtml";
import CatalogMemberFactory from "../lib/Models/Catalog/CatalogMemberFactory";
import { BaseModel } from "../lib/Models/Definition/Model";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import Terria from "../lib/Models/Terria";
import { AnyTrait } from "../lib/Traits/Decorators/anyTrait";
import { ModelReferenceArrayTrait } from "../lib/Traits/Decorators/modelReferenceArrayTrait";
import { ModelReferenceTrait } from "../lib/Traits/Decorators/modelReferenceTrait";
import { ObjectArrayTrait } from "../lib/Traits/Decorators/objectArrayTrait";
import { ObjectTrait } from "../lib/Traits/Decorators/objectTrait";
import { PrimitiveArrayTrait } from "../lib/Traits/Decorators/primitiveArrayTrait";
import { PrimitiveTrait } from "../lib/Traits/Decorators/primitiveTrait";
import ModelTraits from "../lib/Traits/ModelTraits";
import Trait, { TraitJsonSpec } from "../lib/Traits/Trait";
import {
  cleanJsonSpec,
  createModelJsonSchema
} from "../lib/Traits/traitsToJsonSpec";

/** Get type name for a given Trait */
function markdownFromTraitType(trait: Trait) {
  let base: string;
  if (trait instanceof PrimitiveTrait || trait instanceof PrimitiveArrayTrait) {
    base = trait.type;
  } else if (
    trait instanceof ObjectTrait ||
    trait instanceof ObjectArrayTrait
  ) {
    base = trait.type.name;
  } else if (trait instanceof AnyTrait) {
    base = "any";
  } else if (
    trait instanceof ModelReferenceTrait ||
    trait instanceof ModelReferenceArrayTrait
  ) {
    base = "ModelReference";
  } else {
    base = "unknown";
  }

  return base;
}

/** Render row for a Trait with:
 * - name
 * - type
 * - default value
 * - description
 */
function renderTraitRow(property: string, trait: Trait, defaultValue: any) {
  let traitType = markdownFromTraitType(trait);
  const traitTypeIsArray =
    trait instanceof PrimitiveArrayTrait || trait instanceof ObjectArrayTrait;
  if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait) {
    traitType = `<a href="#${traitType.toLocaleLowerCase()}"><code>${
      traitType + (traitTypeIsArray ? "[]" : "")
    }</code></b>`;
    defaultValue = undefined;
  } else {
    traitType = `<code>${traitType + (traitTypeIsArray ? "[]" : "")}</code>`;
  }

  // Delete defalut value is it is an empty array
  if (
    Array.isArray(defaultValue) &&
    (defaultValue.length === 0 || defaultValue.every((i) => !isDefined(i)))
  )
    defaultValue = undefined;

  return `
<tr>
  <td><code>${property}</code></td>
  <td>${traitType}</td>
  <td>${defaultValue ? `<code>${defaultValue}</code>` : ""}</td>
  <td>${markdownToHtml(trait.description, true)}</td>
</tr>`;
}

/** Render rows for all traits with the given parentTrait */
function renderTraitRows(
  parentTrait: string,
  model: BaseModel,
  showTitle = true
) {
  const objectTraits: BaseModel[] = [];
  const traitRows = Object.entries(model.traits)
    .filter(([_property, trait]) => trait.parent.name === parentTrait)
    .map(([property, trait]) => {
      if (trait instanceof ObjectTrait) {
        objectTraits.push((model as any)[property]);
      } else if (trait instanceof ObjectArrayTrait) {
        objectTraits.push(
          new (trait as ObjectArrayTrait<ModelTraits>).modelClass(
            uniqueId(),
            model.terria
          )
        );
      }

      return renderTraitRow(property, trait, (model as any)[property]);
    })
    .join("\n");

  return {
    html: `
${showTitle ? `<tr><td colspan=4><b>${parentTrait}</b></td></tr>` : ""}
${traitRows}`,
    objectTraits
  };
}

// This tracks which traits have been rendered already - so we don't get duplicates
// It is reset for every catalog model
let alreadyRenderedTraits: string[] = [];
const catalogTypeJsonSpecDir =
  "doc/connecting-to-data/catalog-type-details/json";

/** Render table of traits for given model */
function renderTraitTable(model: BaseModel, recursive = false, depth = 1) {
  const rootTraits = model.TraitsClass.name;

  // Return nothing if these traits have already been rendered
  if (alreadyRenderedTraits.includes(rootTraits)) return {};

  alreadyRenderedTraits.push(rootTraits);

  // Traits organised by parentTraits
  const traits = Object.values(model.traits).reduce<{
    [parentTrait: string]: Trait[];
  }>((obj, cur) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    obj[cur.parent.name]
      ? obj[cur.parent.name].push(cur)
      : (obj[cur.parent.name] = [cur]);
    return obj;
  }, {});

  // List of all groups of traits
  const otherTraits = Object.keys(traits)
    .filter((trait) => trait !== rootTraits)
    .sort();

  const traitGroups = [rootTraits, ...otherTraits];

  const traitGroupRows = traitGroups.map((traits) =>
    renderTraitRows(traits, model, traits !== rootTraits)
  );

  let html = `

${"#".repeat(depth + 1)} ${rootTraits}

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  ${traitGroupRows.map((rows) => rows.html).join("\n")}
  </tbody>
</table>`;

  const objectTraits = flatten(traitGroupRows.map((rows) => rows.objectTraits));

  if (recursive) {
    html += objectTraits
      .map((model) => renderTraitTable(model, true, depth + 1).html)
      .filter(isDefined)
      .join("\n");
  }

  return { html, objectTraits };
}

async function processMember(sampleMember: BaseModel, memberName: string) {
  let content = `
# ${memberName}

${sampleMember.TraitsClass.description ?? ""}

${
  sampleMember.TraitsClass.example
    ? `
## Example usage
\`\`\`json
${JSON.stringify(sampleMember.TraitsClass.example, null, 2)}
\`\`\`
`
    : `\`"type": "${sampleMember.type}"\``
}`;

  // Render table of *top-level* traits for the given member
  // and reset alreadyRenderedTraits
  alreadyRenderedTraits = [];
  const mainTraitTable = renderTraitTable(sampleMember);
  content += mainTraitTable.html;

  // Render object-traits
  content += mainTraitTable.objectTraits
    ?.map((objectTrait) => renderTraitTable(objectTrait, true).html)
    .filter(isDefined)
    .join("\n");

  return content;
}

function createJsonSpecForMember(sampleMember: BaseModel) {
  return createModelJsonSchema(sampleMember);
}

function createCameraViewSchema() {
  const vector: TraitJsonSpec = {
    type: "object",
    properties: {
      x: { type: "number" },
      y: { type: "number" },
      z: { type: "number" }
    },
    required: ["x", "y", "z"] as string[],
    additionalProperties: false
  };

  const lookAt: TraitJsonSpec = {
    type: "object",
    properties: {
      lookAt: {
        type: "object",
        properties: {
          targetLongitude: { type: "number" },
          targetLatitude: { type: "number" },
          targetHeight: { type: "number" },
          heading: { type: "number" },
          pitch: { type: "number" },
          range: { type: "number" }
        },
        required: [
          "targetLongitude",
          "targetLatitude",
          "targetHeight",
          "heading",
          "pitch",
          "range"
        ] as string[],
        additionalProperties: false
      }
    },
    required: ["lookAt"] as string[],
    additionalProperties: false
  };

  const positionHeadingPitchRoll: TraitJsonSpec = {
    type: "object",
    properties: {
      positionHeadingPitchRoll: {
        type: "object",
        properties: {
          cameraLongitude: { type: "number" },
          cameraLatitude: { type: "number" },
          cameraHeight: { type: "number" },
          heading: { type: "number" },
          pitch: { type: "number" },
          roll: { type: "number" }
        },
        required: [
          "cameraLongitude",
          "cameraLatitude",
          "cameraHeight",
          "heading",
          "pitch",
          "roll"
        ] as string[],
        additionalProperties: false
      }
    },
    required: ["positionHeadingPitchRoll"] as string[],
    additionalProperties: false
  };

  const rectangle: TraitJsonSpec = {
    type: "object",
    properties: {
      west: { type: "number" },
      south: { type: "number" },
      east: { type: "number" },
      north: { type: "number" },
      position: vector,
      direction: vector,
      up: vector
    },
    required: ["west", "south", "east", "north"] as string[],
    additionalProperties: false,
    allOf: [
      {
        if: {
          anyOf: [
            { required: ["position"] },
            { required: ["direction"] },
            { required: ["up"] }
          ]
        },
        then: {
          required: ["position", "direction", "up"] as string[]
        }
      }
    ]
  };

  return cleanJsonSpec({
    description:
      "Camera view definition. Accepts lookAt, positionHeadingPitchRoll, or explicit rectangle (with optional position/direction/up vectors).",
    oneOf: [lookAt, positionHeadingPitchRoll, rectangle]
  });
}

function createInitSourceSchema(members: BaseModel[]) {
  const modelSchemas = members.map((member) => createModelJsonSchema(member));

  return cleanJsonSpec({
    title: "InitSourceData",
    description:
      "Terria init source data describing catalog members and viewer configuration.",
    type: "object",
    properties: {
      catalog: {
        description:
          "Catalog members. Each entry should match one of the catalog item/group/function/reference schemas.",
        type: "array",
        items: {
          oneOf: modelSchemas
        }
      },
      viewerMode: {
        description: "Initial viewer mode.",
        enum: ["3d", "3dSmooth", "2d"]
      },
      baseMaps: {
        description: "Base map configuration.",
        type: "object"
      },
      initialCamera: {
        description:
          "Initial camera view or a flag to focus the camera on workbench items.",
        oneOf: [
          createCameraViewSchema(),
          {
            type: "object",
            properties: {
              focusWorkbenchItems: { type: "boolean" }
            },
            required: ["focusWorkbenchItems"],
            additionalProperties: false
          }
        ]
      },
      workbench: {
        description: "List of model IDs to place on the workbench.",
        type: "array",
        items: { type: "string" }
      },
      timeline: {
        description: "Timeline of model IDs.",
        type: "array",
        items: { type: "string" }
      },
      settings: {
        description:
          "Overrides for persistent settings (used for shares/stories).",
        type: "object",
        properties: {
          baseMaximumScreenSpaceError: { type: "number" },
          useNativeResolution: { type: "boolean" },
          alwaysShowTimeline: { type: "boolean" },
          baseMapId: { type: "string" },
          terrainSplitDirection: { type: "number" },
          depthTestAgainstTerrainEnabled: { type: "boolean" },
          shortenShareUrls: { type: "boolean" }
        },
        additionalProperties: true
      }
    },
    additionalProperties: true
  });
}

function createGenericModelSchema(members: BaseModel[]) {
  const modelSchemas = members.map((member) => createModelJsonSchema(member));

  return cleanJsonSpec({
    title: "CatalogModel",
    description: "Union schema for any Terria catalog member type.",
    oneOf: modelSchemas
  });
}

async function processArray(members: BaseModel[]) {
  const typeDetailsNavItems = [];
  let catalogItemsContent = "";
  let catalogGroupsContent = "";
  let catalogFunctionsContent = "";
  let catalogReferencesContent = "";
  fs.mkdirSync(catalogTypeJsonSpecDir, { recursive: true });
  for (let i = 0; i < members.length; i++) {
    const sampleMember = members[i];
    const memberName = sampleMember.constructor.name;

    console.log(memberName, sampleMember.type);
    const tableRow = `| [${memberName}](catalog-type-details/${sampleMember.type}.md) | \`${sampleMember.type}\` |\n`;
    if (memberName.endsWith("Item")) {
      catalogItemsContent += tableRow;
    } else if (memberName.endsWith("Group")) {
      catalogGroupsContent += tableRow;
    } else if (memberName.endsWith("Function")) {
      catalogFunctionsContent += tableRow;
    } else if (memberName.endsWith("Reference")) {
      catalogReferencesContent += tableRow;
    } else if (memberName.endsWith("FunctionJob")) {
      // Ignore FunctionJobs
    } else {
      console.error(`${memberName} is not an Item, Group or Function`);
    }

    typeDetailsNavItems.push({
      [memberName]: `connecting-to-data/catalog-type-details/${sampleMember.type}.md`
    });
    const content = await processMember(sampleMember, memberName);
    fs.writeFileSync(
      `doc/connecting-to-data/catalog-type-details/${sampleMember.type}.md`,
      content
    );

    const jsonSpec = createJsonSpecForMember(sampleMember);
    fs.writeFileSync(
      `${catalogTypeJsonSpecDir}/${sampleMember.type}.json`,
      JSON.stringify(jsonSpec, null, 2)
    );
  }

  return {
    catalogItemsContent,
    catalogGroupsContent,
    catalogFunctionsContent,
    catalogReferencesContent,
    typeDetailsNavItems
  };
}

export default async function generateDocs() {
  const terria = new Terria();

  registerCatalogMembers();
  const catalogMembers = CatalogMemberFactory.constructorsArray;

  const members = catalogMembers
    .map((member) => {
      const memberName = member[1];
      return new memberName(undefined, terria);
    })
    .sort(function (a, b) {
      if (a.constructor.name < b.constructor.name) return -1;
      else if (a.constructor.name > b.constructor.name) return 1;
      return 0;
    });

  const mkDocsConfig = YAML.parse(fs.readFileSync("doc/mkdocs.yml", "utf8"));

  console.log("read doc/mkdocs.yml");

  const commonContentHeader = `The Type column in the table below indicates the \`"type"\` property to use in the [Initialization File](../customizing/initialization-files.md).

  | Name | Type |
  |------|------|
  `;

  const catalogItemsContentHeader =
    "A Catalog Item is a dataset or service that can be enabled for display on the map or in a chart. ";

  const catalogGroupsContentHeader =
    "A Catalog Group is a folder in the TerriaJS catalog that contains [Catalog Items](catalog-items.md), [Catalog Functions](catalog-functions.md), and other groups. ";

  const catalogFunctionsContentHeader =
    "A Catalog Function is a parameterized service where the user supplies the parameters and gets back some result. ";

  const catalogReferencesContentHeader =
    "A Catalog Reference can resolve to a Catalog Item, Group or Function. It's mostly used to connect to services that could return a single dataset or a group of datasets. ";

  const {
    catalogFunctionsContent,
    catalogGroupsContent,
    catalogItemsContent,
    catalogReferencesContent,
    typeDetailsNavItems
  } = await processArray(members);

  const initSourceSchema = createInitSourceSchema(members);
  fs.writeFileSync(
    `${catalogTypeJsonSpecDir}/init-source.json`,
    JSON.stringify(initSourceSchema, null, 2)
  );

  const genericModelSchema = createGenericModelSchema(members);
  fs.writeFileSync(
    `${catalogTypeJsonSpecDir}/model.json`,
    JSON.stringify(genericModelSchema, null, 2)
  );

  // Add entries for all the catalog item/group/function/reference types to type details subsection in mkdocs.yml
  const connectingToDataSection = mkDocsConfig.nav
    .map((section: any) => section["Connecting to Data"])
    .filter((x: any) => x !== undefined)[0];
  const typeDetailsSubSection =
    connectingToDataSection &&
    connectingToDataSection.find(
      (subSection: any) => "Catalog Type Details" in subSection
    );
  if (typeDetailsSubSection === undefined) {
    throw new Error(
      `Couldn't find "Connecting to Data" → "Catalog Type Details" in mkdocs.yml`
    );
  }
  typeDetailsSubSection["Catalog Type Details"] = typeDetailsNavItems;

  fs.writeFileSync("mkdocs.yml", YAML.stringify(mkDocsConfig));

  fs.writeFileSync(
    "doc/connecting-to-data/catalog-items.md",
    catalogItemsContentHeader + commonContentHeader + catalogItemsContent
  );

  fs.writeFileSync(
    "doc/connecting-to-data/catalog-functions.md",
    catalogFunctionsContentHeader +
      commonContentHeader +
      catalogFunctionsContent
  );

  fs.writeFileSync(
    "doc/connecting-to-data/catalog-groups.md",
    catalogGroupsContentHeader + commonContentHeader + catalogGroupsContent
  );

  fs.writeFileSync(
    "doc/connecting-to-data/catalog-references.md",
    catalogReferencesContentHeader +
      commonContentHeader +
      catalogReferencesContent
  );
}

generateDocs().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
