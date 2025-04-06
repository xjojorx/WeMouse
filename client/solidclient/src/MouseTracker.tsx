import { createEffect, createSignal, onCleanup } from "solid-js"
import { Pause, Play, SkipBack, SkipForward, SkipForwardIcon, Volume1, Volume2, VolumeX } from 'lucide-solid';

type MediaOptions = "play" | "pause" |"previous" |"next" |"volume_up"| "volume_down"|"mute";

function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function(this: any, ...args: Parameters<T>) { // Explicit 'this'
    const now = Date.now();
    if (now - lastCall < delay) {
      return; // Ignore this call
    }
    lastCall = now;
    func.apply(this, args);
  };
}

export function MouseTracker({ speed }: { speed: () => number }) {
  const [pos, setPos] = createSignal({ x: 0, y: 0 });
  const [tracking, setTracking] = createSignal({ active: false, x: 0, y: 0 })
  let ws: WebSocket | undefined;

  createEffect(() => {
    // ws = new WebSocket(`ws://localhost:8080/ws`);
    ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onopen = () => {
      console.log("open");
    }
    ws.onclose = () => {
      console.log("close");
    }

    ws.onerror = () => {
      console.log("error");
    }
    ws.onmessage = (e) => {
      const receivedMessage = e.data;
      console.log('Received message from server:', receivedMessage);
    }
    onCleanup(() => {
      // Clean up WebSocket connection
      if (ws) {
        ws.close();
      }
    });
  });

  createEffect(() => {
    console.log(pos())
    if (ws && ws.readyState === WebSocket.OPEN) {
      // ws.send(`MOVE:${JSON.stringify(pos())}`)
      const { x, y } = pos();
      ws.send(`MOVE:${Math.floor(x)};${Math.floor(y)}`)
    }
  })

  const startTracking = (e: MouseEvent) => {
    console.log("start");
    setTracking({ active: true, x: e.offsetX, y: e.offsetY });
  }

  const onMouseMove = (e: MouseEvent) => {
    const { active, x: prevX, y: prevY } = tracking();
    if (active) {
      const s = speed();
      const moved = { x: (e.offsetX - prevX) * s, y: (e.offsetY - prevY) * s }
      setTracking({ ...tracking(), x: e.offsetX, y: e.offsetY });
      setPos(moved)
    }
  }

  const startTrackingTouch = (e: TouchEvent) => {
    console.log("start");
    setTracking({ active: true, x: e.touches[0].clientX, y: e.touches[0].clientY });
  }
  const onTouchMove = (e: TouchEvent) => {
    const { active, x: prevX, y: prevY } = tracking();
    if (active) {
      const touch = e.changedTouches[0];
      const s = speed();
      const x = (touch.clientX - prevX);
      const y = (touch.clientY - prevY);
      const moved = { x: x * s, y: y * s }
      setTracking({ ...tracking(), x: touch.clientX, y: touch.clientY });
      setPos(moved)
    }
  }

  const stopTracking = () => {
    console.log("stop");
    setTracking({ ...tracking(), active: false });
  }

  const clicked = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(`CLICK`)
    }
  }

  const mediaClicked = (mediaBtn : MediaOptions) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(`MEDIA:${mediaBtn}`);
    }

  }

  return (
    <div class="h-full w-full flex flex-col">
      <div class="flex items-center py-1 gap-2 px-2" >
        <div onClick={() => mediaClicked("previous")} class="border rounded-sm border-slate-500 p-1 flex items-center justify-center active:bg-slate-200">
          <SkipBack />
        </div>
        <div onClick={() => mediaClicked("play")} class="border rounded-sm border-slate-500 p-1 flex items-center justify-center active:bg-slate-200">
          <Play />
        </div>
        <div onClick={() => mediaClicked("pause")} class="border rounded-sm border-slate-500 p-1 flex items-center justify-center active:bg-slate-200">
          <Pause />
        </div>
        <div onClick={() => mediaClicked("next")} class="border rounded-sm border-slate-500 p-1 flex items-center justify-center active:bg-slate-200">
          <SkipForward />
        </div>
        <div onClick={() => mediaClicked("volume_down")} class="border rounded-sm border-slate-500 p-1 flex items-center justify-center active:bg-slate-200">
          <Volume1/>
        </div>
        <div onClick={() => mediaClicked("volume_up")} class="border rounded-sm border-slate-500 p-1 flex items-center justify-center active:bg-slate-200">
          <Volume2/>
        </div>
        <div onClick={() => mediaClicked("mute")} class="border rounded-sm border-slate-500 p-1 flex items-center justify-center active:bg-slate-200">
          <VolumeX />
        </div>

      </div>
      <div class="grow w-full  bg-black text-gray-400 select-none"
        onMouseMove={throttle(onMouseMove, 20)}
        onMouseDown={startTracking}
        onMouseUp={stopTracking}
        // onTouchMove={onTouchMove}
        onTouchMove={throttle(onTouchMove, 20)}
        onTouchStart={startTrackingTouch}
        onTouchEnd={stopTracking}
        onClick={() => tracking().active ? stopTracking() : clicked()}
      >touch here</div>
    </div>)
}
