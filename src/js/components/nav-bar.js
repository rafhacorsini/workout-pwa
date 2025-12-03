import { navigate } from '/src/js/core/router.js';

export const NavBar = () => {
    const nav = document.createElement('nav');
    nav.className = 'nav-bar';

    const currentPath = window.location.pathname;

    const links = [
        { label: 'Hoje', icon: 'calendar', path: '/' },
        { label: 'Treinos', icon: 'dumbbell', path: '/library' },
        { label: 'Progresso', icon: 'bar-chart-2', path: '/progress' }
    ];

    links.forEach(link => {
        const btn = document.createElement('button');
        const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));

        btn.className = `nav-item ${isActive ? 'active' : ''}`;
        btn.innerHTML = `<i data-lucide="${link.icon}"></i>`;

        btn.addEventListener('click', () => {
            // Update active state visually immediately
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            navigate(link.path);
        });

        nav.appendChild(btn);
    });

    // Initialize Icons
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 0);

    return nav;
};
