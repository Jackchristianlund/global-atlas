import { createRoot } from 'react-dom/client';
import App from './App';
import './fonts.css';
import './styles.css';
import { installUrlSync } from './urlSync';

// A shared link opens the view it was copied from.
installUrlSync();

// No StrictMode: it double-mounts components in dev, which costs an extra WebGL context.
createRoot(document.getElementById('root')!).render(<App />);
