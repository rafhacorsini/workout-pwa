/**
 * Workout PWA - Main Entry Point
 */

import { initDB } from '/src/js/core/db.js';
import { initRouter, registerRoute } from '/src/js/core/router.js';
import { HomeView } from '/src/js/views/home-view.js';
import { LibraryView } from '/src/js/views/library-view.js';
import { NavBar } from '/src/js/components/nav-bar.js';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App Initializing...');

    try {
        // 1. Initialize Database
        await initDB();
        console.log('Database initialized');

        // 2. Initialize Router
        registerRoute('/', HomeView);
        registerRoute('/library', LibraryView);

        // Dynamic Route for Workout
        registerRoute('/workout/new', async () => {
            const { WorkoutEditorView } = await import('/src/js/views/workout-editor-view.js');
            return WorkoutEditorView();
        });

        registerRoute('/workout/edit/:id', async (params) => {
            const { WorkoutEditorView } = await import('/src/js/views/workout-editor-view.js');
            return WorkoutEditorView(params);
        });

        registerRoute('/workout/:id', async (params) => {
            const { WorkoutView } = await import('/src/js/views/workout-view.js');
            return WorkoutView(params.id);
        });

        registerRoute('/progress', async () => {
            const { ProgressView } = await import('/src/js/views/progress-view.js');
            return ProgressView();
        });

        initRouter();
        console.log('Router initialized');

        // 3. Add Navigation Bar
        document.body.appendChild(NavBar());

    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});
