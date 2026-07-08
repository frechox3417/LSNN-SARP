const supabaseUrl = 'https://wjjutxkjyhfwpncwprcx.supabase.co';
const supabaseAnonKey = 'sb_publishable_Rz1zCG9yufBLcZSKaW__qQ_zibv2dy6';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Esperar a que el DOM esté listo antes de ejecutar nada
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('authForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const usernameRow = document.getElementById('usernameRow');
  const usernameInput = document.getElementById('username');
  const messageBox = document.getElementById('message');
  const toggleMode = document.getElementById('toggleMode');
  const submitButton = document.querySelector('.login-submit');

  let esRegistro = false;
  let modoOscuro = false;

  function updateAuthMode() {
    if (usernameRow) {
      usernameRow.classList.toggle('hidden', !esRegistro);
      usernameInput.required = esRegistro;
    }
    if (submitButton) {
      submitButton.textContent = esRegistro ? 'Registrarse' : 'Iniciar Sesión';
    }
    if (toggleMode) {
      toggleMode.textContent = esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
    }
  }

  if (toggleMode) {
    toggleMode.addEventListener('click', (event) => {
      event.preventDefault();
      esRegistro = !esRegistro;
      updateAuthMode();
      if (messageBox) {
        messageBox.textContent = '';
      }
    });
  }

  // --- Funciones de Tema ---
  function loadTheme() {
    const theme = window.localStorage.getItem('lsnn-theme');
    modoOscuro = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', modoOscuro);
  }

  // --- Lógica de persistencia de credenciales ---
  if (emailInput) emailInput.value = localStorage.getItem('savedEmail') || '';
  if (passwordInput) passwordInput.value = localStorage.getItem('savedPassword') || '';

  // --- Manejo del Formulario ---
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput?.value.trim();
      const password = passwordInput?.value.trim();
      const personaje = usernameInput?.value.trim();

      if (!email || !password) {
        alert('Correo y contraseña son obligatorios.');
        return;
      }

      if (esRegistro && !personaje) {
        alert('Por favor ingresa el nombre de tu personaje.');
        return;
      }

      // Guardar en localStorage
      localStorage.setItem('savedEmail', email);
      localStorage.setItem('savedPassword', password);

      try {
        if (esRegistro) {
          const { data, error } = await supabaseClient.auth.signUp({ email, password });
          if (error) {
            console.error('Error al registrarse:', error);
            messageBox.textContent = error.message || 'Error al registrarse.';
            messageBox.style.color = '#f87171';
            return;
          }

          if (!data?.user) {
            console.error('Registro no devolvió usuario:', data);
            messageBox.textContent = 'No se pudo crear la cuenta. Revisa la consola.';
            messageBox.style.color = '#f87171';
            return;
          }

          const profile = {
            id: data.user.id,
            username: personaje,
            rol: 'CIUDADANO'
          };

          const { data: profileData, error: profileError } = await supabaseClient.from('perfiles').insert([profile]).select();
          if (profileError) {
            console.error('Error guardando perfil:', profileError);
            messageBox.textContent = `Cuenta creada, pero no se guardó el perfil. ${profileError.message}`;
            messageBox.style.color = '#f87171';
            return;
          }

          // Guardar datos en localStorage para que el dashboard pueda recuperar el perfil
          try { localStorage.setItem('savedUserId', data.user.id); } catch (e) { console.warn('No se pudo guardar savedUserId', e); }
          try { localStorage.setItem('savedUsername', personaje); } catch (e) { console.warn('No se pudo guardar savedUsername', e); }
          try { localStorage.setItem('savedRole', 'CIUDADANO'); } catch (e) { console.warn('No se pudo guardar savedRole', e); }

          // Intentar iniciar sesión automáticamente tras registro
          messageBox.textContent = 'Registro exitoso. Iniciando sesión...';
          messageBox.style.color = '#34d399';
          try {
            const { data: signData, error: signError } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (signError) {
              console.error('Error auto-login:', signError);
              messageBox.textContent = 'Cuenta creada, pero no se pudo iniciar sesión automáticamente. Inicia sesión manualmente.';
              messageBox.style.color = '#f87171';
              form.reset();
              esRegistro = false;
              updateAuthMode();
              return;
            }

            const signedUser = signData?.user || signData?.session?.user;
            if (!signedUser || !signedUser.id) {
              console.error('Auto-login: usuario no disponible', signData);
              messageBox.textContent = 'Cuenta creada, pero no se pudo verificar el usuario.';
              messageBox.style.color = '#f87171';
              form.reset();
              esRegistro = false;
              updateAuthMode();
              return;
            }

            // Comprobar rol en la tabla `perfiles`
            const { data: perfil, error: perfilErr } = await supabaseClient.from('perfiles').select('username, rol').eq('id', signedUser.id).single();
            if (perfilErr || !perfil) {
              console.error('Error obteniendo perfil tras auto-login:', perfilErr, perfil);
              messageBox.textContent = 'Cuenta creada, pero no se encontró perfil con rol asignado.';
              messageBox.style.color = '#f87171';
              form.reset();
              esRegistro = false;
              updateAuthMode();
              return;
            }

            try { localStorage.setItem('savedUserId', signedUser.id); } catch (e) { console.warn('No se pudo guardar savedUserId', e); }
            try { localStorage.setItem('savedUsername', perfil.username || ''); } catch (e) { console.warn('No se pudo guardar savedUsername', e); }
            try { localStorage.setItem('savedRole', perfil.rol || ''); } catch (e) { console.warn('No se pudo guardar savedRole', e); }

            if (perfil.rol === 'REDACTOR' || perfil.rol === 'DIRECTOR') {
              window.location.href = './static-dashboard.html';
            } else {
              messageBox.textContent = 'Acceso denegado: tu cuenta no tiene permisos para el dashboard.';
              messageBox.style.color = '#f87171';
              form.reset();
              esRegistro = false;
              updateAuthMode();
              return;
            }
          } catch (err) {
            console.error('Auto-login exception:', err);
            messageBox.textContent = 'Cuenta creada, pero no se pudo iniciar sesión automáticamente.';
            messageBox.style.color = '#f87171';
            form.reset();
            esRegistro = false;
            updateAuthMode();
          }
        } else {
          const { data: signData, error: signError } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (signError) {
            console.error('Error al iniciar sesión:', signError);
            messageBox.textContent = signError.message || 'Error al iniciar sesión.';
            messageBox.style.color = '#f87171';
            return;
          }

          const signedUser = signData?.user || signData?.session?.user;
          if (!signedUser || !signedUser.id) {
            console.error('Login: usuario no devuelto', signData);
            messageBox.textContent = 'No se pudo verificar el usuario tras iniciar sesión.';
            messageBox.style.color = '#f87171';
            return;
          }

          const { data: perfil, error: perfilErr } = await supabaseClient.from('perfiles').select('username, rol').eq('id', signedUser.id).single();
          if (perfilErr || !perfil) {
            console.error('Error obteniendo perfil:', perfilErr, perfil);
            messageBox.textContent = 'No se encontró perfil o rol. Contacta un administrador.';
            messageBox.style.color = '#f87171';
            return;
          }

          try { localStorage.setItem('savedUserId', signedUser.id); } catch (e) { console.warn('No se pudo guardar savedUserId', e); }
          try { localStorage.setItem('savedUsername', perfil.username || ''); } catch (e) { console.warn('No se pudo guardar savedUsername', e); }
          try { localStorage.setItem('savedRole', perfil.rol || ''); } catch (e) { console.warn('No se pudo guardar savedRole', e); }

          if (perfil.rol === 'REDACTOR' || perfil.rol === 'DIRECTOR') {
            window.location.href = './static-dashboard.html';
          } else {
            messageBox.textContent = 'Acceso denegado: tu cuenta no tiene permisos para el dashboard.';
            messageBox.style.color = '#f87171';
          }
        }
      } catch (error) {
        console.error('Error en auth:', error);
        messageBox.textContent = error?.message || 'Error en la autenticación';
        messageBox.style.color = '#f87171';
      }
    });
  }

  // Inicialización
  loadTheme();
  updateAuthMode();
  
});