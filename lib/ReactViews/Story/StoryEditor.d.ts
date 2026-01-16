import React from "react";
import Terria from "../../Models/Terria";
import { StoryData } from "./StoryBuilder";

interface PropsType {
  story?: StoryData;
  removeStory: (id: number) => void;
  saveStory: (story: StoryData) => void;
  exitEditingMode: () => void;
  terria: Terria;
}

declare class StoryEditor extends React.Component<PropsType> {}

export default StoryEditor;
