import Bottleneck from "bottleneck";
import * as fse from "fs-extra";
import { shuffle } from "lodash-es";
import { join, parse } from "path";
import filterOutUndefined from "../lib/Core/filterOutUndefined";
import TerriaError from "../lib/Core/TerriaError";
import timeout from "../lib/Core/timeout";
import CatalogMemberMixin, {
  getName
} from "../lib/ModelMixins/CatalogMemberMixin";
import GroupMixin from "../lib/ModelMixins/GroupMixin";
import MappableMixin from "../lib/ModelMixins/MappableMixin";
import ReferenceMixin from "../lib/ModelMixins/ReferenceMixin";
import CatalogGroup from "../lib/Models/Catalog/CatalogGroup";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import hasTraits from "../lib/Models/Definition/hasTraits";
import { BaseModel } from "../lib/Models/Definition/Model";
import { CatalogIndexFile } from "../lib/Models/SearchProviders/CatalogIndex";
import Terria from "../lib/Models/Terria";
import CatalogMemberReferenceTraits from "../lib/Traits/TraitsClasses/CatalogMemberReferenceTraits";
import patchNetworkRequests from "./patchNetworkRequests";

/**
 * Generate catalog index (**experimental**)
 *
 * This will "crawl" a terria JS catalog, load all groups and references and then create an "index" file which contains fully resolved tree of models.
 *
 * It applies network request rate limiting (see `speedString` parameter)
 *
 * @param configUrl URL to map-config
 *
 * @param baseUrl baseUrl will be used as:
 * - `origin` property for CORS
 * - URL for `serverConfig`
 * - URL for `proxy`
 *
 * @param outPath catalog-index JSON file path
 *
 * @param speedString speed will control number of concurrently loaded catalog groups/references
 * - default value is 1 (which is around 10 loads per second)
 * - minimum value is 1
 * - If speed = 10 - then expect around 100 loads per second
 * - Note:
 *  - loads are somewhat randomised across catalog, so you don't hit one server with many requests
 *  - one load may not equal one request. some groups/references do not make network requests

 * @param basicAuth basic auth token to add to requests which include `baseUrl` (or `proxy/`)
 */
export default async function generateCatalogIndex(
  configUrl: string,
  baseUrl: string,
  outPath: string | undefined,
  speedString: string | undefined,
  basicAuth: string | undefined
) {
  let debug = false;

  let speed = speedString ? parseFloat(speedString) : 1;
  if (speed < 1) speed = 1;

  if (!configUrl || !baseUrl) {
    console.error(
      `\nUSAGE: node ./build/generateCatalogIndex.js <config-url> <base-url> <out-path = ""> <speed = "1">\n`
    );
    process.exit(1);
  }

  // Make sure baseURL has trailing slash
  baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  patchNetworkRequests(baseUrl, basicAuth);

  console.log(`Config URL: ${configUrl}`);

  // Limit load reference calls to 10 per second (on speed = 1)
  const loadLimiter = new Bottleneck({
    maxConcurrent: 10 * speed,
    minTime: 100 / speed,
    trackDoneStatus: true
  });

  const printStatus = () => {
    const c = loadLimiter.counts();
    const total =
      c.EXECUTING + c.QUEUED + c.RECEIVED + c.RUNNING + (c.DONE ?? 0);

    console.log(
      "\x1b[44m\x1b[37m%s\x1b[0m",
      `${(((c.DONE ?? 0) * 100) / (total || 1)).toPrecision(
        2
      )}% DONE - (${c.DONE ?? 0}/${total})`
    );
  };

  const errors: TerriaError[] = [];

  /** Gets full path of member */
  function getPath(terria: Terria, member: BaseModel | undefined): string {
    return filterOutUndefined([
      ...[
        member?.knownContainerUniqueIds.map(id =>
          getPath(terria, terria.getModelById(BaseModel, id))
        )
      ].reverse(),
      member?.uniqueId
    ]).join("/");
  }

  /** Recusrively load all references and groups */
  async function loadMember(terria: Terria, member: BaseModel) {
    let name = getName(member);
    let path = getPath(terria, member);
    // Random priority between 3 and 9 for references/members
    const memberPriority = Math.round(Math.random() * 6) + 3;
    // Random priority between 0 and 5
    const groupPriority = Math.round(Math.random() * 5);
    // Load reference
    if (ReferenceMixin.isMixedInto(member)) {
      try {
        const priority =
          hasTraits(member, CatalogMemberReferenceTraits, "isGroup") &&
          member.isGroup
            ? groupPriority
            : memberPriority;

        // Timeout after 30 seconds
        debug
          ? console.log(
              "\x1b[32m%s\x1b[0m",
              `Adding Reference ${name} (${path})`
            )
          : null;

        await timeout(Math.random() * 1000);
        await loadLimiter.schedule(
          { expiration: 30000, priority },
          async () => {
            console.log(`Loading Reference ${name} (${path}) = ${priority}`);
            const result = await (member as ReferenceMixin.Instance).loadReference();
            result.logError(`FAILED to load Reference ${name} (${path})`);
            result.pushErrorTo(
              errors,
              `FAILED to load Reference ${name} (${path})`
            );
            result.catchError(e => console.error(e.toError().message));
          }
        );
      } catch (timeout) {
        errors.push(
          TerriaError.from(`TIMEOUT FAILED to load Reference ${name} (${path})`)
        );
        console.error(`TIMEOUT FAILED to load Reference ${name}`);
      }

      if (member.target) member = member.target;
      name = getName(member);
    }

    if (GroupMixin.isMixedInto(member)) {
      debug
        ? console.log("\x1b[36m%s\x1b[0m", `Adding Group ${name} (${path})`)
        : null;

      // Function to load group
      const loadGroup = async () => {
        console.log(`Loading Group ${name} (${path})`);
        const result = await (member as GroupMixin.Instance).loadMembers();
        result.logError(`FAILED to load GROUP ${name} (${path})`);
        result.pushErrorTo(errors, `FAILED to load GROUP ${name} (${path})`);
        result.catchError(e => console.error(e.toError().message));
      };

      // CatalogGroup can be loaded immediately
      // Even though CatalogGroup doesn't have anything to load
      // This needs to be called so GroupMixin.refreshKnownContainerUniqueIds is called
      if (member instanceof CatalogGroup) {
        await loadGroup();
      } else {
        try {
          await timeout(Math.random() * 1000);
          await loadLimiter.schedule(
            { expiration: 30000, priority: groupPriority },
            loadGroup
          );
        } catch (timeout) {
          errors.push(
            TerriaError.from(
              `TIMEOUT FAILED to load GROUP ${name} (${path}) = ${groupPriority}`
            )
          );
          console.error(`TIMEOUT FAILED to load GROUP ${name} (${path})`);
        }
      }

      // Recursively load group members
      await Promise.all(
        shuffle(member.memberModels).map(child => {
          return loadMember(terria, child);
        })
      );
    }

    printStatus();
  }

  // Recursively add models to CatalogIndex
  function indexModel(member: BaseModel, index: CatalogIndexFile = {}) {
    let knownContainerUniqueIds = member.knownContainerUniqueIds;
    if (ReferenceMixin.isMixedInto(member) && member.target) {
      knownContainerUniqueIds = Array.from(
        new Set([
          ...member.knownContainerUniqueIds,
          ...member.target.knownContainerUniqueIds
        ])
      );
      member = member.target;
    }
    if (
      member.uniqueId &&
      member.uniqueId !== "/" &&
      member.uniqueId !== "__User-Added_Data__"
    ) {
      const name = getName(member);
      const nameInCatalog = CatalogMemberMixin.isMixedInto(member)
        ? member.nameInCatalog
        : undefined;

      let description = "";
      // Remove description from CatalogIndex - as it makes files too large
      // if (CatalogMemberMixin.isMixedInto(member)) {
      //   description =
      //     member.description +
      //     "\n" +
      //     member.info
      //       .map(i => i.content)
      //       .filter(c => c)
      //       .join("\n");
      // }

      const shareKeys = terria.modelIdShareKeysMap.get(member.uniqueId);

      index[member.uniqueId] = {
        name,
        nameInCatalog: nameInCatalog !== name ? nameInCatalog : undefined,
        description: description || undefined,
        memberKnownContainerUniqueIds: knownContainerUniqueIds,
        isGroup: GroupMixin.isMixedInto(member) ? true : undefined,
        isMappable: MappableMixin.isMixedInto(member) ? true : undefined,
        shareKeys: shareKeys && shareKeys.length > 0 ? shareKeys : undefined
      };
    }
    if (GroupMixin.isMixedInto(member)) {
      member.memberModels.forEach(childMember =>
        indexModel(childMember, index)
      );
    }

    return index;
  }

  // Terria initialisation
  const terriaOptions = {
    baseUrl: "build/TerriaJS"
  };

  const terria = new Terria(terriaOptions);

  registerCatalogMembers();

  try {
    terria.configParameters.serverConfigUrl = `${baseUrl}serverconfig`;
    terria.configParameters.corsProxyBaseUrl = `${baseUrl}proxy/`;
    await terria.start({ configUrl });

    await terria.loadInitSources();
  } catch (e) {
    console.error(TerriaError.from(e, `Failed to initialise Terria`).toError());
  }

  // Load group and references

  // rootId can be set to change root group that is loaded for testing purposes
  // If undefined, then terria root catalog group will be used
  const rootId: string | undefined = undefined;

  const model = rootId
    ? terria.getModelById(BaseModel, rootId)
    : terria.catalog.group;

  if (!model) throw new Error("No model to load");
  await loadMember(terria, model);

  // Create index
  const index = indexModel(terria.catalog.group);

  const outPathResolved = parse(outPath ?? "catalog-index.json");

  // Save index to file
  fse.writeFileSync(outPath ?? "catalog-index.json", JSON.stringify(index));

  // Save errors to file
  const terriaError = TerriaError.combine(errors, "Errors")?.toError();

  if (terriaError?.stack) {
    fse.writeFileSync(
      join(outPathResolved.dir, outPathResolved.name + "errors.json"),
      terriaError.message
    );
    fse.writeFileSync(
      join(outPathResolved.dir, outPathResolved.name + "errors-stack.json"),
      terriaError.stack
    );
  } else {
    fse.writeFileSync(
      join(outPathResolved.dir, outPathResolved.name + "errors.json"),
      "No errors"
    );
    fse.writeFileSync(
      join(outPathResolved.dir, outPathResolved.name + "errors-stack.json"),
      "No errors"
    );
  }
}

const [
  configUrl,
  baseUrl,
  outPath,
  speedString,
  basicAuth
] = process.argv.slice(2);

generateCatalogIndex(configUrl, baseUrl, outPath, speedString, basicAuth);
