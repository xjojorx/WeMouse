import { createEffect, createSignal, onCleanup } from "solid-js"

export function MouseTracker() {
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
      ws.send(`MOVE:${x};${y})}`)
    }
  })

  const startTracking = (e: MouseEvent) => {
    console.log("start");
    setTracking({ active: true, x: e.offsetX, y: e.offsetY });
  }

  const onMouseMove = (e: MouseEvent) => {
    const { active, x: prevX, y: prevY } = tracking();
    if (active) {
      const moved = { x: e.offsetX - prevX, y: e.offsetY - prevY }
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
      const moved = { x: touch.clientX - prevX, y: touch.clientY - prevY }
      setTracking({ ...tracking(), x: touch.clientX, y: touch.clientY });
      setPos(moved)
    }
  }

  const stopTracking = () => {
    console.log("stop");
    setTracking({ ...tracking(), active: false });
  }

  return (<div class="h-full w-full"
    onMouseMove={onMouseMove}
    onMouseDown={startTracking}
    onMouseUp={stopTracking}
    onTouchMove={onTouchMove}
    onTouchStart={startTrackingTouch}
    onTouchEnd={stopTracking}
  >asdf</div>)
}
