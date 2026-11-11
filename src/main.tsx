import { createRoot } from 'react-dom/client';
import App from './App';
import './fonts.css';
import './styles.css';

// No StrictMode: it double-mounts components in dev, which costs an extra WebGL context.
createRoot(document.getElementById('root')!).render(<App />);
