import { createSignal, type Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import { MouseTracker } from './MouseTracker';

const App: Component = () => {
  const [speedMod, setSpeedMod] = createSignal(1)
  const speedUp = () => {
    setSpeedMod(Math.min(speedMod()+0.1, 10))
  }
  const speedDown = () => {
    setSpeedMod(Math.max(speedMod()-0.1, 0))
  }

  return (
    <div class='h-screen w-screen flex flex-col'>
      <div class='flex w-full gap-2' >
        <button onClick={speedDown}>Slow</button>
        {speedMod().toString().substring(0,3)}
        <button onClick={speedUp}>Fast</button>

    </div>
      <div class="grow">
      <MouseTracker speed={speedMod} />
      </div>
    </div>
  );
};

export default App;
