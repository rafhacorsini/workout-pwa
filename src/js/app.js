/**
 * Workout PWA - Main Entry Point
 */

import { initDB } from '/src/js/core/db.js';
import { initRouter } from '/src/js/core/router.js';
import { NavBar } from '/src/js/components/nav-bar.js';


// Initialize App
console.log('App Module execution started');

const initApp = async () => {
    console.log('App Initializing...');

    try {
        // 1. Initialize Database
        await initDB();
        console.log('Database initialized');

        // 2. Initialize Router (Routes are configured inside router.js)
        initRouter();
        console.log('Router initialized');

        // 3. Add Navigation Bar
        document.body.appendChild(NavBar());
        console.log('NavBar added');

    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
};

// Run immediately (Modules are deferred by default)
initApp();
