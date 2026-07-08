const supabaseUrl = 'https://wjjutxkjyhfwpncwprcx.supabase.co';
const supabaseAnonKey = 'sb_publishable_Rz1zCG9yufBLcZSKaW__qQ_zibv2dy6';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

const addSponsorBtn = document.getElementById('addSponsorBtn');
const sponsorshipList = document.getElementById('sponsorshipList');
const publishChangesBtn = document.getElementById('publishChangesBtn');
const dashboardMessage = document.getElementById('dashboardMessage');
const dashboardDebug = document.getElementById('dashboardDebug');

function updateSponsorLabels() {
  const sponsorBlocks = sponsorshipList.querySelectorAll('.sponsorship-block');
  sponsorBlocks.forEach((block, index) => {
    const label = block.querySelector('.label-small');
    if (label) {
      label.textContent = `PATROCINIO #${index + 1}`;
    }
  });
}

function createSponsorBlock(title = '', message = '') {
  const sponsorshipBlock = document.createElement('section');
  sponsorshipBlock.className = 'sponsorship-block';
  sponsorshipBlock.innerHTML = `
    <div class="sponsorship-header">
      <p class="label-small">PATROCINIO</p>
      <button type="button" class="remove-btn">Remover Marca</button>
    </div>
    <label>NOMBRE DE LA EMPRESA COMERCIAL</label>
    <input type="text" class="input-full" value="${title}" placeholder="Ej: Aura Athletics" />
    <label>SLOGAN O MENSAJE</label>
    <textarea class="input-full" placeholder="Ej: 'Viste como un atleta profesional...'">${message}</textarea>
  `;

  sponsorshipBlock.querySelector('.remove-btn').addEventListener('click', () => {
    sponsorshipBlock.remove();
    updateSponsorLabels();
  });

  return sponsorshipBlock;
}

function addSponsor() {
  const newBlock = createSponsorBlock('', '');
  sponsorshipList.appendChild(newBlock);
  updateSponsorLabels();
  newBlock.querySelector('input')?.focus();
}

function attachSponsorHandlers() {
  addSponsorBtn.addEventListener('click', addSponsor);

  sponsorshipList.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const block = event.target.closest('.sponsorship-block');
      if (block) {
        block.remove();
        updateSponsorLabels();
      }
    });
  });

  publishChangesBtn?.addEventListener('click', publishChanges);
}

function showDashboardMessage(text, type = 'info') {
  if (!dashboardMessage) return;
  dashboardMessage.textContent = text;
  dashboardMessage.style.color = type === 'error' ? '#f87171' : '#f8fafc';
}

function showDashboardDebug(text) {
  if (!dashboardDebug) return;
  dashboardDebug.textContent = text;
}

function getSponsorData() {
  return Array.from(sponsorshipList.querySelectorAll('.sponsorship-block')).map((block) => {
    const titleInput = block.querySelector('input[type="text"]');
    const messageTextarea = block.querySelector('textarea');
    return {
      titulo: titleInput?.value.trim() || 'Patrocinador LSNN',
      texto: messageTextarea?.value.trim() || 'Anuncio institucional de patrocinio.'
    };
  });
}

async function publishChanges() {
  showDashboardMessage('Guardando cambios en vivo...', 'info');

  const breakingText = document.querySelector('.card:nth-of-type(1) .input-full')?.value.trim() || '';
  const climaSelect = document.getElementById('weatherSelect');
  const climaDescription = document.getElementById('weatherDescription')?.value.trim() || '';
  const criminalidad = document.getElementById('criminalityInput')?.value.trim() || '';
  const alerta = document.getElementById('alertInput')?.value.trim() || '';
  const temperatura = document.getElementById('temperatureInput')?.value.trim() || '';

  const climaEmoji = climaSelect?.selectedOptions[0]?.textContent?.split(' ')[0] || '☁️';
  const climaText = climaDescription ? `${climaEmoji} ${climaDescription}` : climaEmoji;

  const estadoCiudad = {
    id: 1,
    clima: climaText,
    criminalidad,
    alerta_lspd: alerta,
    ultima_hora: breakingText,
    publicidad_texto: getSponsorData()
  };

  try {
    const { error } = await supabaseClient.from('estado_ciudad').upsert(estadoCiudad, { onConflict: 'id' });
    if (error) throw error;
    showDashboardMessage('Cambios publicados correctamente.', 'info');
  } catch (error) {
    console.error('Error guardando en Supabase:', error);
    showDashboardMessage('Error al guardar cambios. Revisa la consola.', 'error');
  }
}

if (addSponsorBtn && sponsorshipList && publishChangesBtn) {
  attachSponsorHandlers();
  updateSponsorLabels();
}

// --- Verificar sesión y cargar perfil dinámicamente ---
async function initializeDashboard() {
  console.log('static-dashboard.js inicializado');
  const profileNameEl = document.getElementById('profileName');
  const profileRoleEl = document.getElementById('profileRole');
  const logoutBtn = document.getElementById('logoutBtn');

  const savedUserId = localStorage.getItem('savedUserId');
  const savedUsername = localStorage.getItem('savedUsername');
  const savedRole = localStorage.getItem('savedRole');
  showDashboardDebug(`savedUserId=${savedUserId} savedUsername=${savedUsername} savedRole=${savedRole}`);
  console.log('savedUserId', savedUserId, 'savedUsername', savedUsername, 'savedRole', savedRole);

  if (savedUsername && profileNameEl) profileNameEl.textContent = savedUsername;
  if (savedRole && profileRoleEl) profileRoleEl.textContent = savedRole;

  try {
    const { data: sessionData, error: sessionErr } = await supabaseClient.auth.getSession();
    if (sessionErr) throw sessionErr;
    const user = sessionData?.session?.user || sessionData?.user;
    console.log('sessionData', sessionData, 'user', user);
    if (!user) {
      if (savedUserId) {
        try {
          const { data: perfilById, error: errById } = await supabaseClient.from('perfiles').select('username, rol').eq('id', savedUserId).single();
          console.log('perfilById', perfilById, 'errById', errById);
          if (!errById && perfilById) {
            if (profileNameEl) profileNameEl.textContent = perfilById.username || savedUsername || 'Usuario';
            if (profileRoleEl) profileRoleEl.textContent = perfilById.rol || savedRole || '—';
            showDashboardMessage('Datos cargados desde perfil guardado.', 'info');
            return;
          }
        } catch (e) {
          console.error('Error buscando perfil por savedUserId fallback:', e);
        }
      }
      if (savedUsername) {
        try {
          const { data: perfilByName, error: errByName } = await supabaseClient.from('perfiles').select('username, rol').eq('username', savedUsername).single();
          console.log('perfilByName', perfilByName, 'errByName', errByName);
          if (!errByName && perfilByName) {
            if (profileNameEl) profileNameEl.textContent = perfilByName.username || savedUsername;
            if (profileRoleEl) profileRoleEl.textContent = perfilByName.rol || savedRole || '—';
            showDashboardMessage('Datos cargados desde perfil guardado.', 'info');
            return;
          }
        } catch (e) {
          console.error('Error buscando perfil por username fallback:', e);
        }
      }
      window.location.href = './static-login.html';
      return;
    }

    console.log('Usuario en sesión:', user.id, user.email);
    const { data: perfil, error: perfilErr } = await supabaseClient.from('perfiles').select('username, rol').eq('id', user.id).single();
    console.log('perfil', perfil, 'perfilErr', perfilErr);
    if (perfilErr || !perfil) {
      console.error('Perfil no encontrado o error:', perfilErr, perfil);
      if (profileNameEl) profileNameEl.textContent = 'Perfil no encontrado';
      if (profileRoleEl) profileRoleEl.textContent = '—';
      alert('No se encontró perfil. Contacta a un administrador.');
      return;
    }

    if (profileNameEl) profileNameEl.textContent = perfil.username || user.email || 'Usuario';
    if (profileRoleEl) profileRoleEl.textContent = perfil.rol || '—';

    try { localStorage.setItem('savedUserId', user.id); } catch (e) { console.warn('No se pudo guardar savedUserId', e); }
    try { localStorage.setItem('savedUsername', perfil.username || ''); } catch (e) { console.warn('No se pudo guardar savedUsername', e); }
    try { localStorage.setItem('savedRole', perfil.rol || ''); } catch (e) { console.warn('No se pudo guardar savedRole', e); }

    if (!(perfil.rol === 'REDACTOR' || perfil.rol === 'DIRECTOR')) {
      alert('Acceso denegado: no tienes permisos para esta sección.');
      window.location.href = './static-login.html';
      return;
    }
  } catch (err) {
    console.error('Error al verificar sesión en dashboard:', err);
    window.location.href = './static-login.html';
    return;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.error('Error al cerrar sesión:', e);
      }
      window.location.href = './static-login.html';
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}
