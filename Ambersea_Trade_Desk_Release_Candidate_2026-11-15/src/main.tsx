import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {Setup} from './Setup';
import {configurationError} from './service';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode>{configurationError?<Setup error={configurationError}/>:<App/>}</React.StrictMode>);
