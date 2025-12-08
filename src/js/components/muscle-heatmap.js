// Muscle Heatmap Component
// Renders anatomical SVG Body with dynamic coloring based on volume

export const MuscleHeatmap = (volumeData) => {
    const container = document.createElement('div');
    container.className = 'heatmap-container card';
    container.style.cssText = `
        position: relative;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--bg-card);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'width: 100%; text-align: center; margin-bottom: 16px;';
    header.innerHTML = `
        <h3 class="text-headline" style="margin-bottom: 4px;">Mapa de Calor</h3>
        <p class="text-caption-1 text-secondary">Últimos 7 dias</p>
    `;
    container.appendChild(header);

    // Color Scale Legend
    const legend = document.createElement('div');
    legend.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-bottom: 20px;
        font-size: 10px;
        color: var(--text-secondary);
    `;
    legend.innerHTML = `
        <span>Leve</span>
        <div style="width: 20px; height: 6px; background: #3A3A3C; border-radius: 3px;"></div>
        <div style="width: 20px; height: 6px; background: #FFD60A; border-radius: 3px;"></div>
        <div style="width: 20px; height: 6px; background: #FF9F0A; border-radius: 3px;"></div>
        <div style="width: 20px; height: 6px; background: #FF375F; border-radius: 3px;"></div>
        <span>Intenso</span>
    `;
    container.appendChild(legend);

    // Helper to get color based on sets
    const getColor = (sets) => {
        if (!sets || sets === 0) return '#3A3A3C';
        if (sets < 5) return '#FFD60A';
        if (sets < 10) return '#FF9F0A';
        return '#FF375F';
    };

    // Anatomical Body SVG
    const visualization = document.createElement('div');
    visualization.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 24px;
        width: 100%;
    `;

    const frontSVG = `
        <svg viewBox="0 0 120 280" width="100" height="220">
            <ellipse cx="60" cy="20" rx="15" ry="18" fill="#2C2C2E" stroke="#3A3A3C" stroke-width="1"/>
            <path d="M50 38 Q60 45 70 38 L68 48 L52 48 Z" fill="${getColor(volumeData.shoulders)}" opacity="0.9"/>
            <ellipse cx="30" cy="58" rx="12" ry="10" fill="${getColor(volumeData.shoulders)}"/>
            <ellipse cx="90" cy="58" rx="12" ry="10" fill="${getColor(volumeData.shoulders)}"/>
            <path d="M42 52 Q60 48 78 52 Q82 70 60 78 Q38 70 42 52" fill="${getColor(volumeData.chest)}"/>
            <ellipse cx="24" cy="85" rx="7" ry="18" fill="${getColor(volumeData.biceps)}"/>
            <ellipse cx="96" cy="85" rx="7" ry="18" fill="${getColor(volumeData.biceps)}"/>
            <rect x="18" y="105" width="12" height="30" rx="5" fill="#2C2C2E"/>
            <rect x="90" y="105" width="12" height="30" rx="5" fill="#2C2C2E"/>
            <rect x="45" y="80" width="30" height="45" rx="4" fill="${getColor(volumeData.abs)}"/>
            <line x1="60" y1="85" x2="60" y2="120" stroke="#1C1C1E" stroke-width="1" opacity="0.3"/>
            <line x1="47" y1="95" x2="73" y2="95" stroke="#1C1C1E" stroke-width="1" opacity="0.3"/>
            <line x1="47" y1="108" x2="73" y2="108" stroke="#1C1C1E" stroke-width="1" opacity="0.3"/>
            <path d="M42 130 Q38 165 42 200 L55 200 Q52 165 50 130 Z" fill="${getColor(volumeData.quads)}"/>
            <path d="M78 130 Q82 165 78 200 L65 200 Q68 165 70 130 Z" fill="${getColor(volumeData.quads)}"/>
            <ellipse cx="48" cy="205" rx="8" ry="6" fill="#2C2C2E"/>
            <ellipse cx="72" cy="205" rx="8" ry="6" fill="#2C2C2E"/>
            <ellipse cx="46" cy="235" rx="6" ry="20" fill="${getColor(volumeData.calves)}"/>
            <ellipse cx="74" cy="235" rx="6" ry="20" fill="${getColor(volumeData.calves)}"/>
            <ellipse cx="46" cy="268" rx="8" ry="4" fill="#2C2C2E"/>
            <ellipse cx="74" cy="268" rx="8" ry="4" fill="#2C2C2E"/>
        </svg>
    `;

    const backSVG = `
        <svg viewBox="0 0 120 280" width="100" height="220">
            <ellipse cx="60" cy="20" rx="15" ry="18" fill="#2C2C2E" stroke="#3A3A3C" stroke-width="1"/>
            <path d="M45 38 L75 38 L80 55 L40 55 Z" fill="${getColor(volumeData.shoulders)}" opacity="0.8"/>
            <ellipse cx="30" cy="58" rx="12" ry="10" fill="${getColor(volumeData.shoulders)}"/>
            <ellipse cx="90" cy="58" rx="12" ry="10" fill="${getColor(volumeData.shoulders)}"/>
            <path d="M40 55 Q35 75 38 100 L52 120 L68 120 L82 100 Q85 75 80 55 Z" fill="${getColor(volumeData.back)}"/>
            <line x1="60" y1="55" x2="60" y2="115" stroke="#1C1C1E" stroke-width="2" opacity="0.3"/>
            <ellipse cx="24" cy="85" rx="7" ry="18" fill="${getColor(volumeData.triceps)}"/>
            <ellipse cx="96" cy="85" rx="7" ry="18" fill="${getColor(volumeData.triceps)}"/>
            <rect x="18" y="105" width="12" height="30" rx="5" fill="#2C2C2E"/>
            <rect x="90" y="105" width="12" height="30" rx="5" fill="#2C2C2E"/>
            <ellipse cx="48" cy="135" rx="12" ry="10" fill="${getColor(volumeData.glutes)}"/>
            <ellipse cx="72" cy="135" rx="12" ry="10" fill="${getColor(volumeData.glutes)}"/>
            <path d="M40 148 Q36 175 40 200 L54 200 Q50 175 48 148 Z" fill="${getColor(volumeData.hamstrings)}"/>
            <path d="M80 148 Q84 175 80 200 L66 200 Q70 175 72 148 Z" fill="${getColor(volumeData.hamstrings)}"/>
            <ellipse cx="48" cy="205" rx="8" ry="6" fill="#2C2C2E"/>
            <ellipse cx="72" cy="205" rx="8" ry="6" fill="#2C2C2E"/>
            <ellipse cx="46" cy="235" rx="6" ry="20" fill="${getColor(volumeData.calves)}"/>
            <ellipse cx="74" cy="235" rx="6" ry="20" fill="${getColor(volumeData.calves)}"/>
            <ellipse cx="46" cy="268" rx="8" ry="4" fill="#2C2C2E"/>
            <ellipse cx="74" cy="268" rx="8" ry="4" fill="#2C2C2E"/>
        </svg>
    `;

    visualization.innerHTML = `
        <div style="text-align: center;">
            ${frontSVG}
            <div style="font-size: 10px; color: var(--text-secondary); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Frente</div>
        </div>
        <div style="text-align: center;">
            ${backSVG}
            <div style="font-size: 10px; color: var(--text-secondary); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Costas</div>
        </div>
    `;

    container.appendChild(visualization);

    return container;
};
