/**
 * Simple Router with Parameter Support
 */

import { HomeView } from '../views/home-view.js';
import { LibraryView } from '../views/library-view.js';
import { WorkoutView } from '../views/workout-view.js';
import { WorkoutEditorView } from '../views/workout-editor-view.js';
import { ProgressView } from '../views/progress-view.js';
import { NutritionView } from '../views/nutrition-view.js';

const routes = [];
const appDiv = document.getElementById('app');

export const registerRoute = (path, component) => {
    // Convert path to regex (e.g., /workout/:id -> /workout/([^/]+))
    const regexPath = path.replace(/:[^\s/]+/g, '([^/]+)');
    routes.push({
        path: new RegExp(`^${regexPath}$`),
        component
    });
};

export const navigate = (path) => {
    window.history.pushState({}, path, window.location.origin + path);
    handleRoute(path);
};

const handleRoute = async (path) => {
    let match = null;
    let route = null;
    let params = {};

    // Separate path and query string
    const [cleanPath, queryString] = path.split('?');

    for (const r of routes) {
        match = cleanPath.match(r.path);
        if (match) {
            route = r;
            // Extract params if any
            if (match.length > 1) {
                params = { id: match[1] };
            }

            // Parse query params
            if (queryString) {
                const urlParams = new URLSearchParams(queryString);
                for (const [key, value] of urlParams) {
                    params[key] = value;
                }
            }
            break;
        }
    }

    if (!route) {
        // Fallback to home or 404
        if (path !== '/') {
            navigate('/');
            return;
        }
    }

    if (route) {
        // Simple transition effect
        appDiv.classList.add('page-exit-active');

        setTimeout(async () => {
            appDiv.innerHTML = '';
            appDiv.classList.remove('page-exit-active');

            const content = await route.component(params);
            appDiv.appendChild(content);

            appDiv.classList.add('page-enter');
            requestAnimationFrame(() => {
                appDiv.classList.remove('page-enter');
                appDiv.classList.add('page-enter-active');
                setTimeout(() => {
                    appDiv.classList.remove('page-enter-active');
                }, 300);
            });
        }, 300);
    }
};

export const initRouter = () => {
    // Register Routes directly here for simplicity in this architecture
    registerRoute('/', HomeView);
    registerRoute('/library', LibraryView);
    registerRoute('/workout/:id', WorkoutView);
    registerRoute('/workout/edit/:id', WorkoutEditorView);
    registerRoute('/progress', ProgressView);
    registerRoute('/nutrition', NutritionView);

    window.addEventListener('popstate', () => {
        handleRoute(window.location.pathname);
    });
    handleRoute(window.location.pathname);
};
