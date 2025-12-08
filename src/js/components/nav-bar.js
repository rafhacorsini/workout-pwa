import { navigate } from '/src/js/core/router.js';

export const NavBar = () => {
    const nav = document.createElement('nav');
    nav.className = 'nav-bar';

    const currentPath = window.location.pathname;

    const links = [
        { label: 'Hoje', icon: 'calendar', path: '/' },
        { label: 'Treinos', icon: 'dumbbell', path: '/library' },
        { label: 'Nutrição', icon: 'apple', path: '/nutrition' },
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

    // Theme Toggle Button
    const themeBtn = document.createElement('button');
    themeBtn.className = 'nav-item';
    themeBtn.style.marginLeft = '8px';
    themeBtn.style.borderLeft = '1px solid rgba(255,255,255,0.1)';
    themeBtn.style.paddingLeft = '8px';

    // Check current theme preference
    const savedTheme = localStorage.getItem('theme_preference');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    // Apply saved theme on load
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    themeBtn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const currentIsDark = currentTheme === 'dark' || (!currentTheme && prefersDark);
        const newTheme = currentIsDark ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme_preference', newTheme);

        // Update icon
        themeBtn.innerHTML = `<i data-lucide="${newTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
        if (window.lucide) window.lucide.createIcons();
    });

    nav.appendChild(themeBtn);

    // Initialize Icons
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 0);

    return nav;
};
