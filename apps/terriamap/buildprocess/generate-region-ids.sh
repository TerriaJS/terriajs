# This script downloads lists of region map codes from our WFS region mapping server, and transforms them into a minimal
# JSON file. This is faster to serve, smaller to transfer, and faster to parse.
# It should be run whenever boundary layers are added or changed.

# This JQ filter can be used to automatically update regionMapping.json to follow the naming convention defined here:
# .regionWmsMap |= (map_values(.regionIdList = @uri "data/regionids/\( .layerName)_\(.regionProp).json"))
# To use it:
# 1. Go to jqplay.org
# 2. Paste the filter in the top box
# 3. Paste the contents of regionmapping.json into the JSON box
# 4. Copy the Result back out.

OUTPUTDIR="../wwwroot/data/regionids"

function makeJSON {
    LAYER=$1  # Name of the GeoServer layer
    COLUMN=$2 # Name of the column/attribute within that layer that we want to get IDs for (assumed to be URL safe)
    QUOTES=$3 # Optional double quote mark to insert around non-numeric values
    LAYERU=${LAYER//:/%3A} # URL-encoded form of the layer name

    echo "$LAYER, $COLUMN"

    wget  --quiet -O response "http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?service=wfs&version=2.0&request=getPropertyValue&typenames=${LAYERU}&valueReference=${COLUMN}"

    # Add commas between items
    perl -pi -e "s/<\/wfs:member><wfs:member>/${QUOTES},${QUOTES}/g" response

    # Strip all other tags
    perl -pi -e 's/<[^>]*>//g' response

    # Add JSON header: object with an array
    perl -0777 -pi -e "s/^/{\"layer\":\"${LAYER}\",\"property\":\"${COLUMN}\",\"values\": [${QUOTES}/" response

    # Close JSON array and object
    echo "${QUOTES}]}" >> response
    mv response "${OUTPUTDIR}/${LAYER//:/-}_${COLUMN}.json"
}

echo "Generating region ID lists and saving to ${OUTPUTDIR}."

mkdir -p $OUTPUTDIR
# In an ideal world, we'd run this automatically off regionmapping.json

makeJSON "region_map:FID_SA1_2011_AUST" SA1_MAIN11
makeJSON "region_map:FID_SA1_2011_AUST" SA1_7DIG11
makeJSON "region_map:FID_SA2_2011_AUST" SA2_MAIN11
makeJSON "region_map:FID_SA2_2011_AUST" SA2_5DIG11
makeJSON "region_map:FID_SA2_2011_AUST" SA2_NAME11 '"' 
makeJSON "region_map:FID_SA3_2011_AUST" SA3_CODE11 
makeJSON "region_map:FID_SA3_2011_AUST" SA3_NAME11 '"'
makeJSON "region_map:FID_SA4_2011_AUST" SA4_CODE11
makeJSON "region_map:FID_SA4_2011_AUST" SA4_NAME11 '"'
makeJSON "region_map:FID_LGA_2015_AUST" LGA_CODE15
makeJSON "region_map:FID_LGA_2015_AUST" LGA_NAME15 '"'
makeJSON "region_map:FID_LGA_2015_AUST" STE_NAME15 '"' # disambiguation column
makeJSON "region_map:FID_LGA_2013_AUST" LGA_CODE13
makeJSON "region_map:FID_LGA_2013_AUST" LGA_NAME13 '"'
makeJSON "region_map:FID_LGA_2013_AUST" STE_NAME11 '"' # yes, 11...
makeJSON "region_map:FID_LGA_2011_AUST" LGA_CODE11
makeJSON "region_map:FID_LGA_2011_AUST" LGA_NAME11 '"'
makeJSON "region_map:FID_LGA_2011_AUST" STE_NAME11 '"' # disambiguation column
makeJSON "region_map:FID_SSC_2011_AUST" SSC_CODE
makeJSON "region_map:FID_SSC_2011_AUST" SSC_NAME '"'
makeJSON "region_map:FID_POA_2011_AUST" POA_CODE '"' # leading zeroes
makeJSON "region_map:FID_COM20111216_ELB_region" ELECT_DIV '"'
makeJSON "region_map:FID_CED_2011_AUST" CED_CODE
makeJSON "region_map:FID_CED_2011_AUST" CED_NAME '"'
makeJSON "region_map:FID_CED_2013_AUST" CED_CODE13
makeJSON "region_map:FID_CED_2013_AUST" CED_NAME13 '"'
makeJSON "region_map:FID_SED_2011_AUST" SED_CODE
makeJSON "region_map:FID_SED_2011_AUST" SED_NAME '"'
makeJSON "region_map:FID_STE_2011_AUST" STE_CODE11
makeJSON "region_map:FID_STE_2011_AUST" STE_NAME11 '"' 
makeJSON "region_map:FID_TM_WORLD_BORDERS" ISO2 '"'
makeJSON "region_map:FID_TM_WORLD_BORDERS" ISO3 '"'
makeJSON "region_map:FID_TM_WORLD_BORDERS" NAME '"'
makeJSON "region_map:FID_AUS_2011_AUST" AUS_CODE # lol
makeJSON "region_map:FID_GCCSA_2011_AUST" GCC_CODE11 '"'
makeJSON "region_map:FID_GCCSA_2011_AUST" GCC_NAME11 '"'
makeJSON "region_map:FID_SUA_2011_AUST" SUA_CODE11
makeJSON "region_map:FID_SUA_2011_AUST" SUA_NAME11 '"'
makeJSON "region_map:FID_SOS_2011_AUST" SOS_CODE11
makeJSON "region_map:FID_SOSR_2011_AUST" SSR_CODE11
makeJSON "region_map:FID_UCL_2011_AUST" UCL_CODE11
makeJSON "region_map:FID_IREG_2011_AUST" IR_CODE11
makeJSON "region_map:FID_ILOC_2011_AUST" IL_CODE11
makeJSON "region_map:FID_IARE_2011_AUST" IA_CODE11
makeJSON "region_map:FID_RA_2011_AUST" RA_CODE11
makeJSON "region_map:FID_TR_2015_AUST" TR_CODE15 '"'
makeJSON "region_map:FID_TR_2013_AUST" TR_CODE13 '"'
makeJSON "region_map:FID_PHN_boundaries_AUS_Sep2015_V5" PHN_Code '"'
