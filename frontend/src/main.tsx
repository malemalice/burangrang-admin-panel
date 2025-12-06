// IMPORTANT: Import theme init FIRST to run initialization before React renders
// This ensures CSS variables are set immediately, preventing flash of wrong theme
import './core/lib/theme/init';

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './core/lib/theme/theme.css'

createRoot(document.getElementById("root")!).render(<App />);
