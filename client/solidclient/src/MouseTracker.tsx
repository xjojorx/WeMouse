import { createEffect, createSignal, onCleanup } from "solid-js"

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

export function MouseTracker({speed}: {speed: () => number}) {
  const [pos, setPos] = createSignal({ x: 0, y: 0 });
  const [tracking, setTracking] = createSignal({ active: false, x: 0, y: 0 })
  let ws: WebSocket | undefined;

  createEffect(() => {
    ws = new WebSocket("ws://192.168.1.133:8080");
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
      const {x, y} = pos();
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
      const moved = { x: (e.offsetX - prevX) * s, y: (e.offsetY - prevY)*s }
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
    if(active) {
      const touch = e.changedTouches[0];
      const s = speed();
      const x =(touch.clientX - prevX);
      const y =(touch.clientY - prevY);
      const moved = { x: x*s, y: y*s }
      setTracking({ ...tracking(), x: touch.clientX, y: touch.clientY });
      setPos(moved)
    }
  }

  const stopTracking = () => {
    console.log("stop");
    setTracking({ ...tracking(), active: false });
  }

  return (<div class="h-full w-full bg-neutral-100"
    onMouseMove={onMouseMove}
    onMouseDown={startTracking}
    onMouseUp={stopTracking}
    // onTouchMove={onTouchMove}
    onTouchMove={throttle(onTouchMove, 20)}
    onTouchStart={startTrackingTouch}
    onTouchEnd={stopTracking}
  >touch here</div>)
}
