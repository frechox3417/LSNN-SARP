// Configuración de Supabase
const supabaseUrl = 'https://wjjutxkjyhfwpncwprcx.supabase.co';
const supabaseAnonKey = 'sb_publishable_Rz1zCG9yufBLcZSKaW__qQ_zibv2dy6';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

document.getElementById('publishNewsBtn').addEventListener('click', async () => {
    // 1. Recolectar datos del formulario
    const noticia = {
        autor: document.getElementById('reportero').value,
        categoria: document.getElementById('categoria').value,
        titulo: document.getElementById('titulo').value,
        subtitulo: document.getElementById('subtitulo').value,
        imagen: document.getElementById('captura').value,
        // El contenido debe ser un array para coincidir con el tipo text[] de Supabase
        contenido: [document.getElementById('cuerpo').value],
        galeria_imagenes: [] 
    };

    // 2. Validación simple (opcional pero recomendada)
    if (!noticia.titulo || !noticia.autor || !noticia.contenido[0]) {
        alert("Por favor, rellena los campos obligatorios.");
        return;
    }

    try {
        // 3. Envío a Supabase (Corregido: usamos 'noticia' en lugar de 'newsData')
        const { data, error } = await supabaseClient
            .from('noticias')
            .insert([noticia]);

        if (error) {
            console.error('Error detallado de Supabase:', error);
            alert('Error al publicar: ' + error.message);
        } else {
            alert('¡Noticia publicada con éxito!');
            // Limpiar el formulario después de publicar
            document.querySelector('.redaccion-form').reset();
        }
    } catch (err) {
        console.error('Error inesperado:', err);
        alert('Ocurrió un error inesperado al conectar con la base de datos.');
    }
});