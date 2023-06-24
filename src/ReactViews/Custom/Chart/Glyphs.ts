import {
  GlyphCircle,
  GlyphCross,
  GlyphDiamond,
  GlyphSquare,
  GlyphStar,
  GlyphTriangle,
  GlyphWye
} from "@visx/glyph";

const Glyphs = {
  circle: GlyphCircle,
  cross: GlyphCross,
  diamond: GlyphDiamond,
  square: GlyphSquare,
  star: GlyphStar,
  triangle: GlyphTriangle,
  wye: GlyphWye
};

export type GlyphStyle = keyof typeof Glyphs;

export default Glyphs;
