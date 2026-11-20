import { Composition } from "remotion";
import { loadFonts } from "./fonts";
import { DUREE_TOTALE, Presentation } from "./Presentation";
import { FPS } from "./theme";

loadFonts();

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Presentation"
      component={Presentation}
      durationInFrames={DUREE_TOTALE}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ audio: true }}
    />
  );
};
