// Elementos del DOM
const departamentoInput = document.getElementById('departamento');
const departamentoLista = document.getElementById('departamentoLista');
const localizacionInput = document.getElementById('localizacion');
const palabraClaveInput = document.getElementById('palabra_clave');
const gallery = document.getElementById('gallery');
const antButton = document.getElementById('antButton');
const sigButton = document.getElementById('sigButton');
const pageInfo = document.getElementById('pageInfo');
const buscarButton = document.getElementById('buscarButton');
const gallerydept = document.getElementById('gallerydept');
const limpiarButton = document.getElementById('limpiarButton');


// Variables globales
let departamentos = [];
let objetosActuales = [];
let paginaActual = 0;
const objetosPorPagina = 20;
let objetosCargados = false;

// Cargar departamentos
const cargarDepartamentos = async () => {
    console.log('Iniciando carga de departamentos...');
    try {
        const respuesta = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/departments');
        console.log('Respuesta de departamentos recibida:', respuesta.status);
        if (respuesta.ok) {
            const data = await respuesta.json();
            console.log('Datos de departamentos recibidos:', data);
            const departamentos = data.departments;

            // Limpiar el contenido previo del select
            departamentoLista.innerHTML = '';

            // Agregar la opción "Seleccionar departamento"
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "Seleccionar departamento";
            departamentoLista.appendChild(defaultOption);

            // Agregar cada departamento como una opción en el select
            departamentos.forEach(dep => {
                const option = document.createElement('option');
                option.value = dep.departmentId; // Usa departmentId como valor
                option.textContent = dep.displayName; // Mostrar el nombre
                departamentoLista.appendChild(option);
            });
        } else {
            throw new Error(`HTTP error! status: ${respuesta.status}`);
        }
    } catch (error) {
        console.error('Error al cargar departamentos:', error);
        gallerydept.innerHTML = '<p>Error al cargar los departamentos. Por favor, recargue la página.</p>';
    }
};

// Función para construir la URL de búsqueda
const construirURLBusqueda = () => {
    console.log('Construyendo URL de búsqueda...');
    
    // Obtener el departamento seleccionado
    const departamentoSeleccionado = departamentoLista.value;
    const localizacion = localizacionInput.value.trim();
    const palabraClave = palabraClaveInput.value.trim();

    let url = 'https://collectionapi.metmuseum.org/public/collection/v1/search?';
    let params = [];

    // Agregar el ID del departamento si está seleccionado
    if (departamentoSeleccionado) {
        params.push(`departmentId=${departamentoSeleccionado}`);
    }

    // Agregar la geolocalización si se proporciona
    if (localizacion) {
        params.push(`geoLocation=${encodeURIComponent(localizacion)}`);
    }

    // Agregar la palabra clave si se proporciona
    if (palabraClave) {
        params.push(`q=${encodeURIComponent(palabraClave)}`);
    }

    // Asegurarse de que siempre haya al menos un parámetro de búsqueda
    params.push('q=*');

    // Construir la URL final con los parámetros
    const urlFinal = url + params.join('&');
    console.log('URL de búsqueda construida:', urlFinal);
    return urlFinal;
};

// Cargar objetos filtrados
const cargarObjetosFiltrados = async () => {
    const departamentoSeleccionado = departamentoLista.value;
    const localizacion = localizacionInput.value.trim();
    const palabraClave = palabraClaveInput.value.trim();

    // Validar si al menos uno de los campos está lleno
    if (!departamentoSeleccionado && !localizacion && !palabraClave) {
        mostrarAdvertencia('Necesita llenar alguno de los campos para realizar una búsqueda.');
        return;
    }

    console.log('Iniciando búsqueda de objetos...');
    antButton.style.display = 'none';
    sigButton.style.display = 'none';
    objetosCargados = false; // Reiniciar el estado
    actualizarEstadoBotonLimpiar(); // Inhabilitar el botón al iniciar la búsqueda

    // Mostrar el loader
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    setTimeout(async () => {
        try {
            const url = construirURLBusqueda();
            console.log('Realizando fetch a:', url);
            const respuesta = await fetch(url);
            console.log('Respuesta de búsqueda recibida:', respuesta.status);
            if (respuesta.ok) {
                const data = await respuesta.json();
                console.log('Datos de búsqueda recibidos:', data);
                objetosActuales = (data.objectIDs || []).slice(0, 120);
                paginaActual = 0;
                actualizarPaginacion();
                loader.style.display = 'none';
                await mostrarObjetosGaleria(); // Esperar a que se muestren los objetos
                objetosCargados = true; // Marcar que los objetos se han cargado
                actualizarEstadoBotonLimpiar(); // Habilitar el botón después de cargar
            } else {
                throw new Error(`HTTP error! status: ${respuesta.status}`);
            }
        } catch (error) {
            console.error('Error al cargar objetos filtrados:', error);
            gallery.innerHTML = '<p>Error al cargar los resultados. Por favor, intente nuevamente.</p>';
            loader.style.display = 'none';
            objetosCargados = false; // Asegurar que el botón permanezca inhabilitado en caso de error
            actualizarEstadoBotonLimpiar();
        }
    }, 2000);
};


// Mostrar objetos en la galería
const mostrarObjetosGaleria = async () => {
    console.log('Mostrando objetos en la galería...');
    gallery.innerHTML = ''; // Limpiar la galería antes de mostrar objetos

    if (objetosActuales.length === 0) {
        gallery.innerHTML = '<p>No se encontraron resultados para esta búsqueda.</p>';
        return;
    }

    // Calcular los objetos que se mostrarán en la página actual
    const inicio = paginaActual * objetosPorPagina;
    const fin = inicio + objetosPorPagina;
    const objetosPagina = objetosActuales.slice(inicio, Math.min(fin, objetosActuales.length));

    for (const id of objetosPagina) {
        try {
            console.log(`Cargando detalles del objeto ${id}...`);
            const respuesta = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
            let datos = await respuesta.json();
            console.log(`Respuesta para objeto ${id} recibida:`, datos);
            if (respuesta.ok) {
                const card = await crearCard(datos);
                gallery.appendChild(card);
            } else {
                throw new Error(`HTTP error! status: ${respuesta.status}`);
            }
        } catch (error) {
            console.error(`Error al cargar objeto ${id}:`, error);
        }
    }
    antButton.style.display = 'inline-block';
    sigButton.style.display = 'inline-block';
};
// Función para traducir texto 
async function translateText(text, targetLang = 'es') {
    try {
        const response = await fetch('/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, targetLang })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.translatedText;
    } catch (error) {
        console.error('Error al traducir el texto:', error);
        return text; // Devuelve el texto original si hay un error
    }
}

// Crear tarjeta para cada objeto
const crearCard = async (objeto) => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const title = await translateText(objeto.title || 'Sin título', 'es');
    const culture = await translateText(objeto.culture || 'No especificada', 'es');
    const dynasty = await translateText(objeto.dynasty || 'No especificada', 'es');

    const imageUrl = objeto.primaryImageSmall || '/imagenesStyle/sinIMG .jpg';
    const creationDate = objeto.objectDate || 'Fecha no disponible';

    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" title="Fecha de creación: ${creationDate}" onerror="this.onerror=null;this.src='/imagenesStyle/sinIMG .jpg';">
        <div class="card-content">
            <h3>${title}</h3>
            <p>Cultura: ${culture}</p>
            <p>Dinastía: ${dynasty}</p>
            ${objeto.additionalImages && objeto.additionalImages.length > 0 ? 
                `<button onclick="verMasImagenes(${objeto.objectID})">Ver más imágenes</button>` : 
                ''}
        </div>
    `;

    return card;
};


// Función para ver más imágenes
const verMasImagenes = async (objectID) => {
    const modal = document.getElementById('modal');
    const modalContent = document.querySelector('.modal-content');
    const additionalImagesContainer = document.getElementById('additionalImagesContainer');
    additionalImagesContainer.innerHTML = ''; // Limpiar contenido previo

    // Obtener el objeto para obtener las imágenes adicionales
    try {
        const respuesta = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`);
        const objeto = await respuesta.json();

        // Traducir el título del objeto antes de asignarlo al modal
        const translatedTitle = await translateText(objeto.title || 'Objeto sin título', 'es');

        // Actualizar el título del modal con el nombre del objeto traducido
        const modalTitle = modalContent.querySelector('h2');
        modalTitle.textContent = `Imágenes adicionales de "${translatedTitle}"`;

        // Agregar información de cultura y dinastía
        const infoElement = document.createElement('p');
        infoElement.innerHTML = `<strong>Cultura:</strong> ${objeto.culture || 'No especificada'}<br>
                                 <strong>Dinastía:</strong> ${objeto.dynasty || 'No especificada'}`;
        additionalImagesContainer.appendChild(infoElement);

        // Cargar imágenes adicionales
        if (objeto.additionalImages && objeto.additionalImages.length > 0) {
            objeto.additionalImages.forEach(imgUrl => {
                const img = document.createElement('img');
                img.src = imgUrl;
                img.alt = `Imagen adicional de ${translatedTitle}`;
                img.onerror = function () {
                    this.src = 'https://via.placeholder.com/150'; // Imagen por defecto si falla
                };
                additionalImagesContainer.appendChild(img);
            });
        } else {
            additionalImagesContainer.innerHTML += '<p>No hay imágenes adicionales disponibles.</p>';
        }

        // Mostrar el modal
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error al cargar imágenes adicionales:', error);
    }
};
// Función para cerrar el modal
document.getElementById('closeModal').onclick = function () {
    document.getElementById('modal').style.display = 'none';
};

// Cerrar el modal si se hace clic fuera de él
window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};
// Cambiar página
const cambiarPagina = (direccion) => {
    console.log(`Cambiando página. Dirección: ${direccion}`);
    paginaActual += direccion;

    // Limitar la página actual entre 0 y 5 (total 6 páginas)
    paginaActual = Math.max(0, Math.min(paginaActual, 5)); 

    actualizarPaginacion();
    mostrarObjetosGaleria();
};

// Actualizar paginación
const actualizarPaginacion = () => {
    console.log('Actualizando paginación...');
    const totalPaginas = Math.min(Math.ceil(objetosActuales.length / objetosPorPagina), 6); // Limitar a 6 páginas
    antButton.disabled = paginaActual === 0;
    sigButton.disabled = (paginaActual + 1) >= totalPaginas; 
    pageInfo.textContent = `Página ${paginaActual + 1} de ${totalPaginas}`;
};
//boton buscar
// Función para mostrar mensaje de advertencia si no hay campos llenos
const mostrarAdvertencia = (mensaje) => {
    const advertencia = document.createElement('p');
    advertencia.textContent = mensaje;
    advertencia.style.color = 'white';
    gallery.innerHTML = ''; 
    gallery.appendChild(advertencia); 
};
// event listener del botón de búsqueda
buscarButton.addEventListener('click', cargarObjetosFiltrados);

// Función para habilitar o inhabilitar el botón limpiar
const actualizarEstadoBotonLimpiar = () => {
    limpiarButton.disabled = !objetosCargados;
};

// Función para limpiar los campos de búsqueda
const limpiarCampos = () => {
    departamentoLista.value = ''; 
    localizacionInput.value = ''; 
    palabraClaveInput.value = ''; 
    gallery.innerHTML = ''; 
    pageInfo.textContent = ''; 
    antButton.style.display = 'none'; 
    sigButton.style.display = 'none'; 
    objetosCargados = false; // Reiniciar el estado
    actualizarEstadoBotonLimpiar(); 
};

// Agregar evento al botón Limpiar
limpiarButton.addEventListener('click', limpiarCampos);

// Inicialización
console.log('Iniciando aplicación...');
cargarDepartamentos();
actualizarEstadoBotonLimpiar();





