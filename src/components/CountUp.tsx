import { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

/** A number that counts up to its new value, Balatro style. */
export function CountUp({ value, style, durationMs = 500 }: { value: number; style?: TextStyle; durationMs?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = Date.now();
    const begin = from.current;
    let frame = 0;
    const step = () => {
      const p = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - (1 - p) ** 3;
      setShown(Math.round(begin + (value - begin) * eased));
      if (p < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, durationMs]);

  return <Text style={style}>{shown.toLocaleString()}</Text>;
}
