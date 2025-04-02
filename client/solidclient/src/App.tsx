import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import { MouseTracker } from './MouseTracker';

const App: Component = () => {
  return (
    <div class='h-screen w-screen'>

      <MouseTracker />
    </div>
  );
};

export default App;
