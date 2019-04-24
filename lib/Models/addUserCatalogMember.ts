"use strict";

import Terria from "./Terria";
import { BaseModel } from "./Model";
import isDefined from "../Core/isDefined";
import hasTraits from "./hasTraits";
import GroupTraits from "../Traits/GroupTraits";
import when from "terriajs-cesium/Source/ThirdParty/when";
import TerriaError from "../Core/TerriaError";
import CommonStrata from "./CommonStrata";

interface AddUserCatalogMemberOptions {
    enable?: boolean;
    open?: boolean;
    zoomTo?: boolean;
}

/**
 * Adds a user's catalog item or group to the catalog.
 *
 */
export default function addUserCatalogMember(
    terria: Terria,
    newCatalogMemberOrPromise: BaseModel | Promise<BaseModel | undefined>,
    options?: AddUserCatalogMemberOptions
) {
    return when(newCatalogMemberOrPromise, function(newCatalogItem: BaseModel) {
        if (!isDefined(newCatalogItem)) {
            return;
        }

        terria.catalog.userAddedDataGroup.add(newCatalogItem);
        terria.catalog.userAddedDataGroup.setTrait(CommonStrata.user, "isOpen", true);

        if (
            isDefined(options) &&
            isDefined(options.open) &&
            hasTraits(newCatalogItem, GroupTraits, "isOpen")
        ) {
            newCatalogItem.setTrait("user", "isOpen", true);
        }

        if (isDefined(options) && isDefined(options.zoomTo)) {
            // TODO: this throws a cesium rendering error
            //terria.currentViewer.zoomTo(newCatalogItem);
        }

        return newCatalogItem;
    }).otherwise((e: any) => {
        if (!(e instanceof TerriaError)) {
            e = new TerriaError({
                title: "Data could not be added",
                message:
                    "The specified data could not be added because it is invalid or does not have the expected format."
            });
        }

        terria.error.raiseEvent(e);
        return e;
    });
}
