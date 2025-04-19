import { createSignal, type Component } from 'solid-js';

import { MouseTracker } from './MouseTracker';

const App: Component = () => {
  const speed = Number(localStorage.getItem("speed") ?? "1")
  const [speedMod, setSpeedMod] = createSignal(speed)
  const speedUp = () => {
    const newVal =Math.min(speedMod()+0.1, 10);
    setSpeedMod(newVal)
    localStorage.setItem("speed", newVal.toString())
  }
  const speedDown = () => {
    const newVal = Math.max(speedMod()-0.1, 0);
    setSpeedMod(newVal)
    localStorage.setItem("speed", newVal.toString())
  }

  return (
    <div class='h-screen w-screen flex flex-col bg-zinc-800 text-gray-500'>
      <div class='flex w-full gap-2 py-0.5' >
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
