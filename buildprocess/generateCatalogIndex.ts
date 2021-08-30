import * as fse from "fs-extra";
import TerriaError from "../lib/Core/TerriaError";
import { getName } from "../lib/ModelMixins/CatalogMemberMixin";
import GroupMixin from "../lib/ModelMixins/GroupMixin";
import Group from "../lib/Models/Catalog/Group";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import { BaseModel } from "../lib/Models/Definition/Model";
import Terria from "../lib/Models/Terria";

require('jsdom-global')()
global.DOMParser = window.DOMParser;
global.fetch = require('node-fetch');

export default async function generateCatalogIndex(argv: string[]) {
  const [configUrl] = argv.slice(2);

  if (!configUrl) {
    console.error(`\nUSAGE: node ./build/generateCatalogIndex.js <config-url>\n`);
    process.exit(1);
  }

  console.log(`Config URL: ${configUrl}`);

  interface CatalogIndex {
    [id: string]: {
      name: string;
      knownContainerUniqueIds: string[];
    };
  }

  async function loadGroupMembers(terria: Terria, group: Group & BaseModel) {
    console.log(`Loading ${getName(group)}`);
    (await group.loadMembers()).catchError(error => console.error(TerriaError.from(error, `FAILED to load ${getName(group)}`).toError()));
    await Promise.all(
      group.memberModels.map((member) => {
        if (GroupMixin.isMixedInto(member)) {
          return loadGroupMembers(terria, member);
        }
        return Promise.resolve();
      })
    );
  }

  function indexModel(member: BaseModel, index: CatalogIndex = {}) {
    if (member.uniqueId && member.uniqueId !==  "/" && member.uniqueId !== "__User-Added_Data__") {
      index[member.uniqueId] = {
        name: getName(member),
        knownContainerUniqueIds: member.knownContainerUniqueIds,
      };
    }
    if (GroupMixin.isMixedInto(member)) {
      member.memberModels.forEach((childMember) =>
        indexModel(childMember, index)
      );
    }

    return index;
  }


  const terriaOptions = {
    baseUrl: "build/TerriaJS",
  };

  const terria = new Terria(terriaOptions);

  registerCatalogMembers();

  try {

    await terria.start({configUrl})

    await terria.loadInitSources();
  } catch (e) {
    console.error(TerriaError.from(e, `Failed to initialise Terria`).toError());
  }

  await loadGroupMembers(terria, terria.catalog.group);

  const index = indexModel(terria.catalog.group);

  fse.writeFileSync("catalog-index.json", JSON.stringify(index));
}

generateCatalogIndex(process.argv);
