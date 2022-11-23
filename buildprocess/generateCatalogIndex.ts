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
import CkanItemReference from "../lib/Models/Catalog/Ckan/CkanItemReference";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import hasTraits from "../lib/Models/Definition/hasTraits";
import { BaseModel } from "../lib/Models/Definition/Model";
import { CatalogIndexFile } from "../lib/Models/SearchProviders/CatalogIndex";
import Terria from "../lib/Models/Terria";
import CatalogMemberReferenceTraits from "../lib/Traits/TraitsClasses/CatalogMemberReferenceTraits";
import patchNetworkRequests from "./patchNetworkRequests";

/** Add model to index */
function indexModel(
  terria: Terria,
  index: CatalogIndexFile,
  member: CatalogMemberMixin.Instance | GroupMixin.Instance
) {
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

    // If model isn't already in index - create it
    if (!index[member.uniqueId]) {
      index[member.uniqueId] = {
        name,
        nameInCatalog: nameInCatalog !== name ? nameInCatalog : undefined,
        description: description || undefined,
        memberKnownContainerUniqueIds: [...member.knownContainerUniqueIds], // clone array
        isGroup: GroupMixin.isMixedInto(member) ? true : undefined,
        isMappable: MappableMixin.isMixedInto(member) ? true : undefined,
        shareKeys:
          shareKeys && shareKeys.length > 0 ? [...shareKeys] : undefined // clone array
      };
      // If model IS already in index - see if more info can be added
      // Merge shareKeys and memberKnownContainerUniqueIds
      //
    } else {
      const mergedShareKeys = Array.from(
        new Set([
          ...(shareKeys ?? []),
          ...(index[member.uniqueId].shareKeys ?? [])
        ])
      );
      index[member.uniqueId].shareKeys =
        mergedShareKeys && mergedShareKeys.length > 0
          ? mergedShareKeys
          : undefined;

      const mergedContainerIds = Array.from(
        new Set([
          ...member.knownContainerUniqueIds,
          ...(index[member.uniqueId].memberKnownContainerUniqueIds ?? [])
        ])
      );
      index[member.uniqueId].memberKnownContainerUniqueIds = mergedContainerIds;
    }
  }
}

/** Gets full path of member */
function getPath(terria: Terria, member: BaseModel | undefined): string {
  return filterOutUndefined([
    ...[
      member?.knownContainerUniqueIds.map((id) =>
        getPath(terria, terria.getModelById(BaseModel, id))
      )
    ].reverse(),
    member?.uniqueId
  ]).join("/");
}

async function loadGroup(
  terria: Terria,
  group: GroupMixin.Instance,
  errors: TerriaError[]
) {
  const name = getName(group);
  const path = getPath(terria, group);

  console.log(`Loading Group ${name} (${path})`);
  const result = await group.loadMembers();
  result.logError(`FAILED to load GROUP ${name} (${path})`);
  result.pushErrorTo(errors, `FAILED to load GROUP ${name} (${path})`);
  result.catchError((e) => console.error(e.toError().message));
}

async function loadReference(
  terria: Terria,
  reference: ReferenceMixin.Instance,
  errors: TerriaError[]
) {
  const name = getName(reference);
  const path = getPath(terria, reference);

  console.log(`Loading Reference ${name} (${path})`);
  const result = await reference.loadReference();
  result.logError(`FAILED to load Reference ${name} (${path})`);
  result.pushErrorTo(errors, `FAILED to load Reference ${name} (${path})`);
  result.catchError((e) => console.error(e.toError().message));
}

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
 *
 * @param excludeIdsCsv CSV of model IDs to exclude from catalog index (eg "some-id-1,some-id-2")
 *
 * @param basicAuth basic auth token to add to requests which include `baseUrl` (or `proxy/`)

 * Example usage: node ./build/generateCatalogIndex.js http://localhost:3001/config.json http://localhost:3001/
 */
export default async function generateCatalogIndex(
  configUrl: string,
  baseUrl: string,
  outPath: string | undefined,
  speedString: string | undefined,
  excludeIdsCsv: string | undefined,
  basicAuth: string | undefined
) {
  let debug = false;

  let speed = speedString ? parseFloat(speedString) : 1;
  if (speed < 1) speed = 1;

  const excludeIds = excludeIdsCsv ? excludeIdsCsv.split(",") : [];

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
    minTime: 100 / speed
  });

  /** Timeout for loading groups/references */
  const timeoutMs = 30000;

  let totalJobs = 0;
  let completedJobs = 0;

  const printStatus = () => {
    console.log(
      "\x1b[44m\x1b[37m%s\x1b[0m",
      `${((completedJobs * 100) / (totalJobs || 1)).toPrecision(
        3
      )}% DONE - (${completedJobs}/${totalJobs || 1})`
    );
  };

  const index: CatalogIndexFile = {};
  const errors: TerriaError[] = [];

  /** Recursively load all references and groups.
   * This will add members to `index` after loading
   */
  async function loadAndIndexMember(terria: Terria, member: BaseModel) {
    let name = getName(member);
    let path = getPath(terria, member);

    if (member.uniqueId && excludeIds.includes(member.uniqueId)) {
      console.log(`Excluding model \`${member.uniqueId}\`:"${name}" (${path}`);
      return;
    }

    totalJobs++;

    // Random priority between 3 and 9 for references/members
    // Random priority between 0 and 5 for groups
    // This is so we slightly priorities loading groups before references
    // But we don't want to load all groups at once - as they can be very expensive network requests
    const memberPriority = Math.round(Math.random() * 6) + 3;
    const groupPriority = Math.round(Math.random() * 5);

    // Load reference - this also handles nested references
    while (ReferenceMixin.isMixedInto(member)) {
      // We immediately de-reference CkanItemReferences with `_ckanDataset` - as they don't make any XHR
      if (member instanceof CkanItemReference && member._ckanDataset) {
        await loadReference(terria, member, errors);
      }
      // All other references are de-referenced through the queue
      else {
        try {
          const priority =
            hasTraits(member, CatalogMemberReferenceTraits, "isGroup") &&
            member.isGroup
              ? groupPriority
              : memberPriority;

          debug
            ? console.log(
                "\x1b[32m%s\x1b[0m",
                `Adding Reference ${name} (${path})`
              )
            : null;

          await timeout(Math.random() * 1000);
          await loadLimiter.schedule(
            { expiration: timeoutMs, priority },
            loadReference,
            terria,
            member,
            errors
          );
        } catch (timeout) {
          errors.push(
            TerriaError.from(
              `TIMEOUT FAILED to load Reference ${name} (${path})`
            )
          );
          console.error(`TIMEOUT FAILED to load Reference ${name}`);
        }
      }

      if (member.target) {
        member = member.target;
      } else {
        // Something has gone wrong
        // After loading reference we don't have a target
        // So break from while loop
        break;
      }
      name = getName(member);
    }

    if (GroupMixin.isMixedInto(member)) {
      debug
        ? console.log("\x1b[36m%s\x1b[0m", `Adding Group ${name} (${path})`)
        : null;

      // CatalogGroup can be loaded immediately
      // Even though CatalogGroup doesn't have anything to load
      // This needs to be called so GroupMixin.refreshKnownContainerUniqueIds is called
      if (member instanceof CatalogGroup) {
        await loadGroup(terria, member, errors);
      } else {
        try {
          await timeout(Math.random() * 1000);
          await loadLimiter.schedule(
            { expiration: timeoutMs, priority: groupPriority },
            loadGroup,
            terria,
            member,
            errors
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

      // Add catalog group to index (if it isn't empty)
      // Note: this needs to happen after recursively loading group members - as after each member is loaded, the reference is removed.
      // This would result in memberModels being empty!
      if (member.memberModels.length > 0) indexModel(terria, index, member);

      // Recursively load group members
      await Promise.all(
        shuffle(member.memberModels).map((child) => {
          return loadAndIndexMember(terria, child);
        })
      );
    } else if (CatalogMemberMixin.isMixedInto(member)) {
      // Add catalog member to index
      indexModel(terria, index, member);
    }

    // Remove model after it has been indexed
    terria.removeModelReferences(member);

    completedJobs++;
    printStatus();
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
  await loadAndIndexMember(terria, model);

  const outPathResolved = parse(outPath ?? "catalog-index.json");

  // Sort index by ID (so we can compare them easier)

  const sortedIndex = Object.keys(index)
    .sort((a, b) => a.localeCompare(b))
    .reduce<CatalogIndexFile>((acc, currentKey) => {
      acc[currentKey] = index[currentKey];
      return acc;
    }, {});

  // Save index to file
  fse.writeFileSync(
    outPath ?? "catalog-index.json",
    JSON.stringify(sortedIndex)
  );

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

const [configUrl, baseUrl, outPath, speedString, excludeIdsCsv, basicAuth] =
  process.argv.slice(2);

generateCatalogIndex(
  configUrl,
  baseUrl,
  outPath,
  speedString,
  excludeIdsCsv,
  basicAuth
);
