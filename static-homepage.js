// Esperamos a que todo esté cargado en la página
window.addEventListener('DOMContentLoaded', async () => {
    
    // Verificamos que la librería se haya cargado
    if (!window.supabase) {
        console.error("La librería de Supabase no cargó correctamente.");
        return;
    }

    const supabaseUrl = 'https://wjjutxkjyhfwpncwprcx.supabase.co';
    const supabaseAnonKey = 'sb_publishable_Rz1zCG9yufBLcZSKaW__qQ_zibv2dy6';
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    const categoriasMenu = ['INICIO', 'SUCESOS', 'POLÍTICA', 'SOCIEDAD', 'CLASIFICADOS'];
    let noticias = [];
    let categoriaSeleccionada = 'INICIO';

    const refs = {
        sectionTitle: document.getElementById('sectionTitle'),
        articleCount: document.getElementById('articleCount'),
        contentArea: document.getElementById('contentArea'),
        categoryButtons: document.getElementById('categoryButtons'),
        estadoClimaText: document.getElementById('estadoClimaText'),
        estadoCriminalidad: document.getElementById('estadoCriminalidad'),
        estadoAlerta: document.getElementById('estadoAlerta'),
        breakingText: document.getElementById('breakingText'),
    };


    // Función para renderizar los botones de navegación
    function renderNavButtons() {
        if (!refs.categoryButtons) return;
        refs.categoryButtons.innerHTML = categoriasMenu.map(cat => `
            <button class="nav-btn ${categoriaSeleccionada === cat ? 'active' : ''}" data-cat="${cat}">
                ${cat}
            </button>
        `).join('');

        refs.categoryButtons.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                categoriaSeleccionada = btn.getAttribute('data-cat');
                renderNavButtons();
                renderArticles();
            });
        });
    }

    // Función para renderizar las noticias
    function renderArticles() {
        let filtradas = noticias.filter(n => {
    const catNoticia = (n.categoria || '').trim().toLowerCase();
    const catSeleccionada = categoriaSeleccionada.trim().toLowerCase();
    
    // Si es INICIO, muestra todo. Si no, compara ignorando mayúsculas y espacios.
    return categoriaSeleccionada === 'INICIO' || catNoticia === catSeleccionada;
});

        if (refs.sectionTitle) refs.sectionTitle.innerText = categoriaSeleccionada;
        if (refs.articleCount) refs.articleCount.innerText = `${filtradas.length} artículos encontrados`;

        if (refs.contentArea) {
            refs.contentArea.innerHTML = filtradas.length > 0 
                ? filtradas.map(n => {
                    // Formatear fecha
                    const fecha = new Date(n.created_at).toLocaleDateString('es-ES', { 
                        day: 'numeric', month: 'long', year: 'numeric' 
                    });
                    
                    // Clase dinámica para el badge
                    const catClass = n.categoria.toLowerCase().replace(/\s+/g, '-');
                    
                    return `
                        <article class="article-card">
                          <div class="image-wrapper">
                            <span class="category-badge badge-${catClass}">${n.categoria}</span>
                            <img src="${n.imagen}" alt="${n.titulo}">
                          </div>
                          <div class="card-content">
                            <h3>${n.titulo}</h3>
                            <p class="meta-info">Por <strong>${n.autor || 'Redacción LSNN'}</strong> | ${fecha}</p>
                            <a href="static-noticia.html?id=${n.id}" class="read-more">Leer noticia →</a>
                          </div>
                        </article>
                    `;
                }).join('')
                : '<p>No hay noticias disponibles en esta sección.</p>';
        }
    }

    // Carga inicial de datos
    async function loadData() {
        try {
            const [noticiasRes, ciudadRes] = await Promise.all([
                supabaseClient.from('noticias').select('*').order('created_at', { ascending: false }),
                supabaseClient.from('estado_ciudad').select('*').eq('id', 1).single()
            ]);

            if (noticiasRes.error) throw noticiasRes.error;
            
            noticias = noticiasRes.data || [];
            renderNavButtons();
            renderArticles();

            if (ciudadRes.data && refs.estadoClimaText) {
                refs.estadoClimaText.innerText = ciudadRes.data.clima;
                refs.estadoCriminalidad.innerText = ciudadRes.data.criminalidad;
                refs.estadoAlerta.innerText = ciudadRes.data.alerta_lspd;
                refs.breakingText.innerText = ciudadRes.data.ultima_hora;
            }

            if (ciudadRes.data && ciudadRes.data.publicidad_texto) {
    const adsContainer = document.getElementById('adsArea');
    if (adsContainer) {
        // Asumiendo que publicidad_texto es un array de objetos con una propiedad "texto"
        const ads = ciudadRes.data.publicidad_texto;
        adsContainer.innerHTML = ads.map(ad => `
            <div class="ad-card">
                <h5>${ad.titulo}</h5>
                <p>${ad.texto}</p>
            </div>
        `).join('');
    }
}

        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    }

    loadData();
});