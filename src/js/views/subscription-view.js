
import { isPro } from '../services/monetization.js';

export const showSubscriptionModal = async () => {
                          // Prevent duplicates
                          if (document.getElementById('sub-modal')) return;

                          const modal = document.createElement('div');
                          modal.id = 'sub-modal';
                          modal.className = 'modal-overlay fade-in';
                          modal.style.display = 'flex';

                          modal.innerHTML = `
        <div class="modal-content" style="max-width: 360px; text-align: center; position: relative; overflow: hidden;">
            <!-- Decor -->
            <div style="position: absolute; top: -50px; left: 0; right: 0; height: 150px; background: linear-gradient(180deg, rgba(255,215,0,0.1) 0%, transparent 100%); pointer-events: none;"></div>
            
            <i id="close-sub" data-lucide="x" style="position: absolute; top: 16px; right: 16px; cursor: pointer; color: var(--text-secondary); z-index: 10;"></i>

            <div style="margin-bottom: 24px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);">
                    <i data-lucide="crown" style="color: black; width: 40px; height: 40px;"></i>
                </div>
                <h3 class="text-headline" style="font-size: 24px; margin-bottom: 8px;">Seja PRO</h3>
                <p class="text-body text-secondary">Desbloqueie todo o seu potencial com a Inteligência Artificial.</p>
            </div>

            <div style="text-align: left; margin-bottom: 32px; display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i data-lucide="check-circle-2" style="color: var(--system-green); width: 20px;"></i>
                    <span class="text-body">Análise de Treino com IA</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i data-lucide="check-circle-2" style="color: var(--system-green); width: 20px;"></i>
                    <span class="text-body">Backup na Nuvem Ilimitado</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i data-lucide="check-circle-2" style="color: var(--system-green); width: 20px;"></i>
                    <span class="text-body">Gráficos Avançados (Em breve)</span>
                </div>
            </div>

            <button id="upgrade-btn" class="btn btn-primary" style="width: 100%; background: linear-gradient(90deg, #FFD700 0%, #DAA520 100%); color: black; font-weight: 700; border: none; box-shadow: 0 4px 12px rgba(218, 165, 32, 0.4);">
                QUERO SER PRO
            </button>
            <p class="text-caption-2 text-secondary" style="margin-top: 12px;">Apenas R$ 9,90/mês</p>
        </div>
    `;

                          document.body.appendChild(modal);
                          if (window.lucide) window.lucide.createIcons();

                          // Close Interaction
                          modal.querySelector('#close-sub').addEventListener('click', () => modal.remove());

                          // Upgrade Action
                          modal.querySelector('#upgrade-btn').addEventListener('click', () => {
                                                    // Mock Stripe Link or Whatsapp
                                                    const text = "Ola! Quero ser PRO no App de Treino.";
                                                    const url = `https://wa.me/5511999999999?text=${encodeURIComponent(text)}`;
                                                    window.open(url, '_blank');
                          });
};
