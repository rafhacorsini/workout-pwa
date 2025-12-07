import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, getCurrentUser, resetPassword } from '../services/supabase.js';
import { syncData } from '../services/sync.js';

export const showAuthModal = async () => {
    const existingModal = document.getElementById('auth-modal');
    if (existingModal) existingModal.remove();

    const user = await getCurrentUser();

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'modal-overlay fade-in';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 320px; text-align: center;">
            <div style="display: flex; justify-content: flex-end; width: 100%;">
                <i id="close-auth" data-lucide="x" style="cursor: pointer; color: var(--text-secondary);"></i>
            </div>
            
            <div style="margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background: var(--accent-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                    <i data-lucide="user" style="color: white; width: 32px; height: 32px;"></i>
                </div>
                <h3 class="text-headline">${user ? 'Seu Perfil' : 'Entrar / Criar Conta'}</h3>
                <p class="text-caption-1 text-secondary">${user ? user.email : 'Salve seus treinos na nuvem e acesse de qualquer lugar.'}</p>
            </div>

            ${user ? `
                <div style="margin-bottom: 24px; text-align: left; background: var(--bg-secondary); padding: 12px; border-radius: 12px;">
                    <p class="text-caption-2 text-secondary">ID da Conta</p>
                    <p class="text-body" style="font-family: monospace; font-size: 12px; word-break: break-all;">${user.id}</p>
                </div>
                <button id="sign-out-btn" class="btn btn-secondary" style="width: 100%; color: var(--system-red);">Sair da Conta</button>
            ` : `
                <div id="auth-forms">
                    <!-- Toggle Buttons -->
                    <div style="display: flex; gap: 8px; margin-bottom: 16px; background: var(--bg-secondary); padding: 4px; border-radius: 10px;">
                        <button id="tab-login" class="btn-tab active" style="flex: 1; padding: 8px; font-size: 14px; border-radius: 8px; border: none; background: var(--bg-card); color: white;">Login</button>
                        <button id="tab-signup" class="btn-tab" style="flex: 1; padding: 8px; font-size: 14px; border-radius: 8px; border: none; background: transparent; color: var(--text-secondary);">Criar</button>
                    </div>

                    <form id="login-form">
                        <input type="email" id="email" class="input-field" placeholder="Email" required style="margin-bottom: 12px;">
                        <input type="password" id="password" class="input-field" placeholder="Senha" required style="margin-bottom: 16px;">
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Entrar</button>
                        <p id="forgot-password" class="text-caption-1 text-secondary" style="margin-top: 12px; cursor: pointer; text-decoration: underline;">Esqueci minha senha</p>
                    </form>

                    <form id="signup-form" style="display: none;">
                        <input type="text" id="new-name" class="input-field" placeholder="Nome Completo" required style="margin-bottom: 12px;">
                        <input type="email" id="new-email" class="input-field" placeholder="Email" required style="margin-bottom: 12px;">
                        <input type="password" id="new-password" class="input-field" placeholder="Senha (min 6 caracteres)" required style="margin-bottom: 16px;">
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Criar Conta</button>
                    </form>
                    
                    <!--
                    <div style="margin-top: 16px; border-top: 1px solid var(--separator); padding-top: 16px;">
                        <button id="google-btn" class="btn" style="width: 100%; background: white; color: black; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18">
                            Entrar com Google
                        </button>
                    </div>
                    -->
                </div>
            `}
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    // Close logic
    const closeBtn = modal.querySelector('#close-auth');
    closeBtn.addEventListener('click', () => modal.remove());

    if (!user) {
        // Tab Logic
        const tabLogin = modal.querySelector('#tab-login');
        const tabSignup = modal.querySelector('#tab-signup');
        const loginForm = modal.querySelector('#login-form');
        const signupForm = modal.querySelector('#signup-form');

        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active'); tabLogin.style.background = 'var(--bg-card)'; tabLogin.style.color = 'white';
            tabSignup.classList.remove('active'); tabSignup.style.background = 'transparent'; tabSignup.style.color = 'var(--text-secondary)';
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
        });

        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active'); tabSignup.style.background = 'var(--bg-card)'; tabSignup.style.color = 'white';
            tabLogin.classList.remove('active'); tabLogin.style.background = 'transparent'; tabLogin.style.color = 'var(--text-secondary)';
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
        });

        // Login Submit
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = modal.querySelector('#email').value;
            const password = modal.querySelector('#password').value;
            try {
                const btn = loginForm.querySelector('button');
                btn.textContent = 'Entrando...';
                await signInWithEmail(email, password);
                await syncData(); // Sync
                modal.remove();
                window.location.reload(); // Refresh to update UI
            } catch (err) {
                alert('Erro ao entrar: ' + err.message);
            }
        });

        // Forgot Password
        const forgotPasswordLink = modal.querySelector('#forgot-password');
        forgotPasswordLink?.addEventListener('click', async () => {
            const email = modal.querySelector('#email').value;
            if (!email) {
                alert('Digite seu email primeiro.');
                return;
            }
            try {
                await resetPassword(email);
                alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
            } catch (err) {
                alert('Erro: ' + err.message);
            }
        });

        // Signup Submit
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = modal.querySelector('#new-email').value;
            const password = modal.querySelector('#new-password').value;
            const name = modal.querySelector('#new-name').value;
            try {
                const btn = signupForm.querySelector('button');
                btn.textContent = 'Criando...';
                await signUpWithEmail(email, password, name);
                await syncData(); // Sync
                alert('Conta criada! Verifique seu email para confirmar.');
                modal.remove();
            } catch (err) {
                alert('Erro ao criar conta: ' + err.message);
            }
        });

        // Google
        /*
        const googleBtn = modal.querySelector('#google-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                try {
                    await signInWithGoogle();
                } catch (err) {
                    alert('Erro Google: ' + err.message);
                }
            });
        }
        */
    } else {
        // Logout
        modal.querySelector('#sign-out-btn').addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja sair?')) {
                await signOut();
                window.location.reload();
            }
        });
    }
};
