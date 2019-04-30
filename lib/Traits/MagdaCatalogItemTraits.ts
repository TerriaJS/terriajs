import ModelTraits from "./ModelTraits";
import mixTraits from "./mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";

export default class MagdaCatalogItemTraits extends mixTraits(
    UrlTraits,
    CatalogMemberTraits
) {
    @primitiveTrait({
        name: 'Dataset ID',
        description: 'The ID of the MAGDA dataset referred to by this catalog item. Either this property ' +
                     'or `Distribution ID` must be specified. If `Dataset ID` is specified too, and this ' +
                     'distribution is not found, _any_ supported distribution may be used instead, ' +
                     'depending on the value of `Allow Any Distribution if Distribution ID Not Found`.',
        type: 'string'
    })
    datasetId?: string;

    @primitiveTrait({
        name: 'Distribution ID',
        description: 'The ID of the MAGDA distribution referred to by this catalog item. Either this property ' +
                     'or `Dataset ID` must be specified. The first distribution of a supported type ' +
                     'in this dataset will be used.',
        type: 'string'
    })
    distributionId?: string;

    @primitiveTrait({
        name: 'Allow WMS',
        description: 'Whether or not to allow the use of a Web Map Service (WMS) distribution.',
        type: 'boolean'
    })
    allowWms: boolean = true;

    @primitiveTrait({
        name: 'WMS Distribution Format',
        description: 'A regular expression that, when it matches a distribution\'s format, indicates that the distribution is a WMS distribution.',
        type: 'string'
    })
    wmsDistributionFormat: string = '^wms$';
}
