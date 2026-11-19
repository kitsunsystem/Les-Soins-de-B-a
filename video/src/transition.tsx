import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { clamp } from "./ui";

type Props = Record<string, never>;

/**
 * Fondu « au crème » : la scène sortante s'efface sur le fond crème, puis la suivante apparaît.
 * Contrairement à un fondu enchaîné, les textes des deux scènes ne se superposent jamais.
 */
const FonduCreme: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const opacity =
    presentationDirection === "exiting"
      ? interpolate(presentationProgress, [0, 0.55], [1, 0], clamp)
      : interpolate(presentationProgress, [0.45, 1], [0, 1], clamp);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const fonduCreme = (): TransitionPresentation<Props> => ({ component: FonduCreme, props: {} });
