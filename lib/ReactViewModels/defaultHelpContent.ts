import z from "zod";

export enum PaneMode {
  videoAndContent = "videoAndContent",
  slider = "slider",
  trainer = "trainer"
}

const StepItemSchema = z.object({
  title: z.string(),
  markdownDescription: z.string().optional()
});

const TrainerItemSchema = z.object({
  title: z.string(),
  footnote: z.string().optional(),
  steps: z.array(StepItemSchema)
});

export const HelpContentItemSchema = z.object({
  itemName: z.string(),
  title: z.string().optional(),

  videoUrl: z.string().optional(),
  placeholderImage: z.string().optional(),

  // The `placeholderImage` is also used as background cover image for the container that embeds the video. This setting allows us to control the opacity of the cover image.
  videoCoverImageOpacity: z.number().optional(),

  paneMode: z.string().optional(),
  trainerItems: z.array(TrainerItemSchema).optional(),

  markdownText: z.string().optional(),
  icon: z.string().optional()
});

export type StepItem = z.infer<typeof StepItemSchema>;
export type TrainerItem = z.infer<typeof TrainerItemSchema>;
export type HelpContentItem = z.infer<typeof HelpContentItemSchema>;
