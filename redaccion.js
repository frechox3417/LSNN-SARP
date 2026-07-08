// Configuración de Supabase (reemplaza con tus datos reales)
const supabaseUrl = 'https://wjjutxkjyhfwpncwprcx.supabase.co';
const supabaseAnonKey = 'sb_publishable_Rz1zCG9yufBLcZSKaW__qQ_zibv2dy6';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

document.getElementById('publishNewsBtn').addEventListener('click', async () => {
    // Captura de valores del formulario
// Recolectar datos
const noticia = {
  autor: document.getElementById('reportero').value,
  categoria: document.getElementById('categoria').value,
  titulo: document.getElementById('titulo').value,
  subtitulo: document.getElementById('subtitulo').value,
  imagen: document.getElementById('captura').value,
  
  // SOLUCIÓN: Envía el contenido como un array que contenga el texto
  contenido: [document.getElementById('cuerpo').value], 
  
  // Como 'galería_imágenes' también es text[], debe ser un array
  galeria_imagenes: [] 
};

    // Envío a Supabase
    const { data, error } = await supabase
        .from('noticias')
        .insert([newsData]);

    if (error) {
        console.error('Error detallado:', error);
        alert('Error al publicar: ' + error.message);
    } else {
        alert('¡Noticia publicada con éxito!');
        document.querySelector('.redaccion-form').reset();
    }
});