document.addEventListener('DOMContentLoaded', () => {

  const passwordInput = document.getElementById('password-input');
  const analyzeButton = document.getElementById('analyze-button');
  const progressBar = document.getElementById('progress-bar');
  const barraTexto = document.getElementById('barra-texto');
  const req_length = document.getElementById('req-length');
  const req_upper = document.getElementById('req-uppercase');
  const req_lower = document.getElementById('req-lowercase');
  const req_number = document.getElementById('req-number');
  const req_symbol = document.getElementById('req-symbol');
  const tiempoHackeo = document.getElementById('tiempo-hackeo');
  const combinaciones = document.getElementById('combinaciones');
  const intentos = document.getElementById('intentos');
  const resultados = document.getElementById('resultados');

  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const btnLogout = document.getElementById('btn-logout');
  const authButtons = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');

  const authModal = document.getElementById('auth-modal');
  const authClose = document.getElementById('auth-close');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const authMsg = document.getElementById('auth-msg');

  const generateButton = document.getElementById('generate-button');
  const compareButton = document.getElementById('btn-compare');
  const userPasswordInput = document.getElementById('user-password');
  const generatedPasswordInput = document.getElementById('generated-password');
  const compareResult = document.getElementById('compare-result');
  const premiumOverlay = document.getElementById('premium-overlay');

  let generatedPassword = '';
  let isLoggedIn = false;

  checkSession();

  async function checkSession() {
    try {
      const res = await fetch('/check-session', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();

      if (data.logged_in) {
        isLoggedIn = true;
        updateUILoggedIn(data.nombre);
      } else {
        isLoggedIn = false;
        updateUILoggedOut();
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
      isLoggedIn = false;
      updateUILoggedOut();
    }
  }

  function updateUILoggedIn(nombre) {
    authButtons.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userName.textContent = `👤 ${nombre}`;
    
    premiumOverlay.classList.add('hidden');
    generateButton.disabled = false;
    compareButton.disabled = false;
    userPasswordInput.disabled = false;
  }

  function updateUILoggedOut() {
    authButtons.classList.remove('hidden');
    userInfo.classList.add('hidden');
    
    premiumOverlay.classList.remove('hidden');
    generateButton.disabled = true;
    compareButton.disabled = true;
    userPasswordInput.disabled = true;
  }

  btnLogin.addEventListener('click', () => {
    openAuthModal('login');
  });

  btnRegister.addEventListener('click', () => {
    openAuthModal('register');
  });

  authClose.addEventListener('click', closeAuthModal);

  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    switchToRegister();
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchToLogin();
  });

  function openAuthModal(type) {
    authModal.classList.remove('hidden');
    authModal.setAttribute('aria-hidden', 'false');
    authMsg.textContent = '';
    authMsg.className = 'auth-message';
    
    if (type === 'register') {
      switchToRegister();
    } else {
      switchToLogin();
    }
  }

  function closeAuthModal() {
    authModal.classList.add('hidden');
    authModal.setAttribute('aria-hidden', 'true');
    clearAuthForms();
  }

  function switchToLogin() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    clearAuthForms();
  }

  function switchToRegister() {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    clearAuthForms();
  }

  function clearAuthForms() {
    document.getElementById('auth-login-email').value = '';
    document.getElementById('auth-login-password').value = '';
    document.getElementById('auth-reg-name').value = '';
    document.getElementById('auth-reg-email').value = '';
    document.getElementById('auth-reg-password').value = '';
    authMsg.textContent = '';
    authMsg.className = 'auth-message';
  }

  document.getElementById('auth-login-submit').addEventListener('click', async () => {
    const correo = document.getElementById('auth-login-email').value.trim();
    const contrasena = document.getElementById('auth-login-password').value;

    if (!correo || !contrasena) {
      showAuthMessage('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ correo, contrasena })
      });

      const data = await res.json();

      if (res.ok) {
        showAuthMessage(data.mensaje, 'success');
        setTimeout(() => {
          closeAuthModal();
          checkSession();
        }, 1000);
      } else {
        showAuthMessage(data.error, 'error');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      showAuthMessage('Error de conexión', 'error');
    }
  });

  document.getElementById('auth-reg-submit').addEventListener('click', async () => {
    const nombre = document.getElementById('auth-reg-name').value.trim();
    const correo = document.getElementById('auth-reg-email').value.trim();
    const contrasena = document.getElementById('auth-reg-password').value;

    if (!nombre || !correo || !contrasena) {
      showAuthMessage('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, contrasena })
      });

      const data = await res.json();

      if (res.ok) {
        showAuthMessage(data.mensaje, 'success');
        setTimeout(() => {
          switchToLogin();
        }, 1500);
      } else {
        showAuthMessage(data.error, 'error');
      }
    } catch (err) {
      console.error('Error al registrar:', err);
      showAuthMessage('Error de conexión', 'error');
    }
  });

  btnLogout.addEventListener('click', async () => {
    try {
      const res = await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        isLoggedIn = false;
        updateUILoggedOut();
        
        passwordInput.value = '';
        userPasswordInput.value = '';
        generatedPasswordInput.value = '';
        compareResult.textContent = '';
        barraTexto.textContent = '';
        resultados.classList.add('hidden');
        resetProgressBar();
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  });

  function showAuthMessage(message, type) {
    authMsg.textContent = message;
    authMsg.className = `auth-message ${type}`;
  }

  passwordInput.addEventListener('input', () => {
    const pw = passwordInput.value || '';
    updateRecommendations(pw);
    
    if (pw.trim() === '') {
      resetProgressBar();
      barraTexto.textContent = '';
      resultados.classList.add('hidden');
    }
  });

  analyzeButton.addEventListener('click', async () => {
    const password = passwordInput.value.trim();
    
    if (!password) {
      alert('Ingresa una contraseña para analizar.');
      return;
    }

    barraTexto.textContent = 'Analizando...';
    resultados.classList.add('hidden');

    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!res.ok) throw new Error('Error en servidor: ' + res.status);
      
      const data = await res.json();

      paintBar(data.score);
      barraTexto.textContent = `Fuerza: ${data.strength || 'N/A'}`;

      const onlineEs = data.crack_time_online_es || 'Menos de un segundo';
      const slowEs = data.crack_time_offline_slow_es || 'Menos de un segundo';
      const fastEs = data.crack_time_offline_fast_es || 'Menos de un segundo';

      tiempoHackeo.innerHTML = `
        <strong>Online:</strong> ${onlineEs}<br>
        <strong>Offline (slow hash):</strong> ${slowEs}<br>
        <strong>Offline (fast GPU):</strong> ${fastEs}
      `;
      
      combinaciones.textContent = `Combinaciones posibles: ${Number(data.guesses || 0).toLocaleString('es-ES')}`;
      intentos.textContent = `Intentos/segundo (GPU potente): ${Number(data.attempts_per_second || 0).toLocaleString('es-ES')}`;

      resultados.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      barraTexto.textContent = 'Error al analizar';
    }
  });

  function paintBar(score) {
    const s = Number.isFinite(Number(score)) ? Number(score) : 0;
    const width = (s + 1) * 20;
    progressBar.style.width = `${width}%`;

    const colors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#10b981'];
    progressBar.style.backgroundColor = colors[s] || 'transparent';
  }

  function resetProgressBar() {
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = 'transparent';
  }

  function updateRecommendations(pw) {
    toggleOk(req_length, pw.length >= 12);
    toggleOk(req_upper, /[A-Z]/.test(pw));
    toggleOk(req_lower, /[a-z]/.test(pw));
    toggleOk(req_number, /[0-9]/.test(pw));
    toggleOk(req_symbol, /[^A-Za-z0-9]/.test(pw));
  }

  function toggleOk(el, ok) {
    if (!el) return;
    if (ok) {
      el.classList.add('ok');
      el.textContent = el.textContent.replace('✗', '✓');
    } else {
      el.classList.remove('ok');
      el.textContent = el.textContent.replace('✓', '✗');
    }
  }

  generateButton.addEventListener('click', () => {
    if (!isLoggedIn) {
      alert('Debes iniciar sesión para usar esta función');
      return;
    }

    const pw = generateSecurePassword(16);
    passwordInput.value = pw;
    generatedPassword = pw;
    generatedPasswordInput.value = pw;
    updateRecommendations(pw);
    
    barraTexto.textContent = '';
    resultados.classList.add('hidden');
    resetProgressBar();
  });

  function generateSecurePassword(length) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  compareButton.addEventListener('click', async () => {
    if (!isLoggedIn) {
      alert('Debes iniciar sesión para usar esta función');
      return;
    }

    const userPassword = userPasswordInput.value.trim();
    const genPassword = generatedPasswordInput.value.trim();

    if (!userPassword || !genPassword) {
      alert('Debes tener ambas contraseñas para comparar');
      return;
    }

    try {
      const [res1, res2] = await Promise.all([
        fetch('/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: userPassword })
        }),
        fetch('/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: genPassword })
        })
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      let resultText = '';
      let resultColor = '';

      if (data1.score > data2.score) {
        resultText = `¡Tu contraseña es más segura!`;
        resultColor = '#10b981';
      } else if (data1.score < data2.score) {
        resultText = `La contraseña generada es más segura`;
        resultColor = '#ef4444';
      } else {
        if (data1.guesses > data2.guesses) {
          resultText = `¡Tu contraseña es más segura! (Más combinaciones posibles)`;
          resultColor = '#10b981';
        } else if (data1.guesses < data2.guesses) {
          resultText = `La contraseña generada es más segura (Más combinaciones posibles)`;
          resultColor = '#ef4444';
        } else {
          resultText = `Ambas contraseñas tienen un nivel de seguridad similar`;
          resultColor = '#f59e0b';
        }
      }

      compareResult.textContent = resultText;
      compareResult.style.color = resultColor;

    } catch (err) {
      console.error(err);
      compareResult.textContent = 'Error al comparar contraseñas';
      compareResult.style.color = '#ef4444';
    }
  });

  document.getElementById('auth-login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('auth-login-submit').click();
    }
  });

  document.getElementById('auth-reg-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('auth-reg-submit').click();
    }
  });

  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      analyzeButton.click();
    }
  });

  userPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !compareButton.disabled) {
      compareButton.click();
    }
  });

});