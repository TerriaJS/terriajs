"use strict";

import Terria from "./Terria";
import { BaseModel } from "./Model";
import isDefined from "../Core/isDefined";
import hasTraits from "./hasTraits";
import GroupTraits from "../Traits/GroupTraits";
import when from "terriajs-cesium/Source/ThirdParty/when";
import TerriaError from "../Core/TerriaError";
import CommonStrata from "./CommonStrata";
import Mappable from "./Mappable";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import GroupMixin from "../ModelMixins/GroupMixin";

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
    optionsArg?: AddUserCatalogMemberOptions
) {
    const options: AddUserCatalogMemberOptions = defaultValue(optionsArg, {});
    return when(newCatalogMemberOrPromise, function(newCatalogItem: BaseModel) {
        if (!isDefined(newCatalogItem)) {
            return;
        }

        terria.catalog.userAddedDataGroup.add(newCatalogItem);
        terria.catalog.userAddedDataGroup.setTrait(CommonStrata.definition, "isOpen", true);

        if (
            isDefined(options.open) &&
            hasTraits(newCatalogItem, GroupTraits, "isOpen")
        ) {
            newCatalogItem.setTrait(CommonStrata.definition, "isOpen", true);
        }

        if (defaultValue(options.enable, true) && !GroupMixin.isMixedInto(newCatalogItem)) {
            // add to workbench if it doesn't hold an item by the same id
            if (!terria.workbench.items.find(item => item.id === newCatalogItem.id)) {
                terria.workbench.items.push(newCatalogItem);
            }
        }

        if (defaultValue(options.zoomTo, true) && Mappable.is(newCatalogItem)) {
            newCatalogItem.loadMapItems().then(() => terria.currentViewer.zoomTo(newCatalogItem));
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
