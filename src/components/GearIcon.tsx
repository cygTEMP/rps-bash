import Svg, { Circle, Path } from 'react-native-svg';

/** A line-drawn gear, the same one fijit uses for its settings button. */
export function GearIcon({ color, size = 26 }: { color: string; size?: number }) {
  // Eight teeth round a ring.
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = 12 + 7 * Math.cos(a);
    const y1 = 12 + 7 * Math.sin(a);
    const x2 = 12 + 9.5 * Math.cos(a);
    const y2 = 12 + 9.5 * Math.sin(a);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }).join('');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={6.5} stroke={color} strokeWidth={1.8} fill="none" />
      <Circle cx={12} cy={12} r={2.4} stroke={color} strokeWidth={1.8} fill="none" />
      <Path d={teeth} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}
