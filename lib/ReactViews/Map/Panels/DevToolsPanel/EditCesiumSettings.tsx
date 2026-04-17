import { observer } from "mobx-react";
import { FC } from "react";
import { runAppWorkflow } from "../../../../Models/Workflows/AppWorkflows/AppWorkflow";
import CesiumSettingsWorkflow from "../../../../Models/Workflows/AppWorkflows/CesiumSettingsWorkflow";
import Button from "../../../../Styled/Button";
import { useViewState } from "../../../Context";

interface PropsType {
  closePanel: () => void;
}

const EditCesiumSettings: FC<PropsType> = observer(({ closePanel }) => {
  const terria = useViewState().terria;
  const cesium = terria.cesium;

  return (
    <Button
      primary
      disabled={cesium === undefined}
      title={
        cesium ? undefined : "Switch map to 3D mode to enable this feature"
      }
      onClick={() => {
        if (cesium) {
          runAppWorkflow(terria, new CesiumSettingsWorkflow(terria, cesium));
        }
        closePanel();
      }}
    >
      Edit 3D graphics settings
    </Button>
  );
});

export default EditCesiumSettings;
