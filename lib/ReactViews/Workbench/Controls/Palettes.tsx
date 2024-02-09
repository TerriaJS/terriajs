import React, { useEffect, useState } from "react";
import isDefined from "../../../Core/isDefined";
import WebMapServiceCapabilitiesStratum from "../../../Models/Catalog/Ows/WebMapServiceCapabilitiesStratum";
import Box from "../../../Styled/Box";
import { BaseModel } from "../../../Models/Definition/Model";
import Trait from "../../../Traits/Trait";

interface PalettesProps {
  item: BaseModel;
}

// @observable
const Palettes: React.FC<PalettesProps> = ({ item }) => {
  const [palettes, setPalettes] = useState([]);

  useEffect(() => {
    const fetchPalettes = async (availablePalettes: unknown) => {
      try {
        const paletteUrl = Array.isArray(availablePalettes)
          ? availablePalettes[0]?.url
          : undefined;
        if (isDefined(paletteUrl)) {
          const response = await fetch(paletteUrl);
          const data = await response.json();
          setPalettes(data.palettes);
        }
      } catch (error) {
        console.error("Error fetching palettes:", error);
      }
    };

    const pItem = item as any;
    console.log(pItem.availablePalettes);

    fetchPalettes(pItem.availablePalettes);
  }, [item]);

  const handlePaletteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //get the value of the selected option
    const selectedPalette = event.target.value;
    // item.setTrait("user", "selectedPalette", selectedPalette);
    console.log("Selected palette:", selectedPalette);
  };

  return (
    <Box displayInlineBlock fullWidth>
      <p>Palettes: </p>
      <select onChange={handlePaletteChange}>
        {palettes.map((palette: any) => (
          <option key={palette}>{palette}</option>
        ))}
      </select>
    </Box>
  );
};

export default Palettes;
