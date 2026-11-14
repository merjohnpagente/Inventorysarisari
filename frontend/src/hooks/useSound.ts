import { useEffect, useState } from 'react';
import { isSoundOn, setSoundOn, subscribeSound } from '../services/sound';

export default function useSound() {
  const [on, setOn] = useState(isSoundOn());
  useEffect(() => subscribeSound(setOn), []);
  return { on, toggle: () => setSoundOn(!on) };
}
