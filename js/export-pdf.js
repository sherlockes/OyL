/**
 * CONFIGURACIÓN GLOBAL DEL PDF
 */
const PDF_CONFIG = {
    MARGEN: 15,
    COMPRESION_PDF: true, // Esto debe estar en true
    COMPRESION_IMG: 'SLOW', // Cambia 'FAST' por 'MEDIUM' o 'SLOW' (comprime más)
    FORMATO_IMG: 'JPEG',        
    COLOR_TITULO: [200, 230, 201], 
    COLOR_RESUMEN: [245, 245, 245], 
    TAMANO_TITULO: 16,          
    TAMANO_ENCABEZADO: 11,      
    TAMANO_TEXTO: 10,           
    TAMANO_RESUMEN: 9.5         
};

// Función interna para reducir la foto antes de insertarla en el PDF
function achicarParaPDF(base64) {
    return new Promise(res => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            // Para un PDF, con 800px de ancho sobra resolución y ahorra un 70% de espacio
            const MAX_W = 800; 
            const scale = MAX_W / img.width;
            canvas.width = MAX_W;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            res(canvas.toDataURL('image/jpeg', 0.6)); // Calidad 60% suficiente para impresión
        };
    });
}

async function generarPDF(desviaciones, seccionId, fechaManual, notaManual) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ compress: true, unit: 'mm', format: 'a4' });
    
    // --- 0. DEFINICIÓN DE VARIABLES GLOBALES DE PÁGINA ---
    const pw = doc.internal.pageSize.getWidth();  // Ancho total (210mm)
    const ph = doc.internal.pageSize.getHeight(); // Alto total (297mm)
    const margin = 15;
    const verdeCorporativo = [0, 121, 52]; // #007934
    let y = 40;

    // --- 1. PÁGINA 1: PORTADA ---
    
    // Línea 1: H1 - Título principal
    doc.setTextColor(...verdeCorporativo);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("AUDITORIA DE ORDEN Y LIMPIEZA", margin, y);
    y += 30;

    // Línea 2: H3 - Sección y Fecha
    doc.setFontSize(20);
    doc.text(seccionId.toUpperCase(), margin, y); 
    doc.text(fechaManual, pw - margin, y, { align: "right" }); 
    y += 20;

    // Línea 3: H2 - Desviaciones y Resultado (con fondo verde)
    const altoCuadro = 30;
    const fontSize = 24; // Definimos la fuente para usarla en el cálculo

    doc.setFillColor(...verdeCorporativo);
    doc.rect(0, y, pw, altoCuadro, 'F'); 

    doc.setTextColor(255, 255, 255); 
    doc.setFontSize(fontSize);

    // CÁLCULO DEL CENTRO VERTICAL:
    // y: posición actual del tope del cuadro
    // altoCuadro / 2: nos lleva al centro matemático (15mm)
    // + 3.5: es el ajuste para que el "cuerpo" de la letra de 24pt quede centrado respecto a la línea de base
    const posicionVerticalTexto = y + (altoCuadro / 2) + 3.5;

    doc.text(`DESVIACIONES: ${desviaciones.length}`, margin, posicionVerticalTexto);
    doc.text(`RESULTADO: ${notaManual}`, pw - margin, posicionVerticalTexto, { align: "right" });

    y += altoCuadro;

    // Línea 4: Imagen portada.jpg
    try {
        const imgPortada = await cargarImagen('images/portada.jpg');
        const altoPortada = 100;
        doc.addImage(imgPortada, 'JPEG', 0, y, pw, altoPortada); 
        y += altoPortada;
    } catch (e) {
        console.warn("No se pudo cargar portada.jpg", e);
        y += 20; 
    }

    // Línea 5: Imagen logo.jpg
    y += 20; 
    try {
        const imgLogo = await cargarImagen('images/logo.jpg');
        const logoW = 60; 
        const logoH = 25; 
        doc.addImage(imgLogo, 'JPEG', (pw / 2) - (logoW / 2), y, logoW, logoH);
    } catch (e) {
        console.warn("No se pudo cargar logo.jpg", e);
    }

    // --- 2. PASO AL CONTENIDO ---
    doc.addPage();
    y = 20; 
    doc.setTextColor(0, 0, 0); 

    // --- FECHA Y TÍTULO EN PÁGINA 2 ---
    const fecha = new Date();
    const codigoFecha = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const totalGlobal = desviaciones.length;
    let nombreSeccion = (seccionId && !seccionId.toLowerCase().includes("informe")) ? seccionId : "GENERAL";

    // --- GRUPOS Y RESUMEN ---
    const ORDEN_TIPOS = ["Almacenamiento", "Productos químicos", "Mangueras", "Herramientas", "Equipos e instalaciones", "Elementos de seguridad y EPI's", "Zonas de paso y comunes", "Señalización y comunicación", "Residuos"];
    const grupos = {};
    desviaciones.forEach(d => { if (!grupos[d.tipo]) grupos[d.tipo] = []; grupos[d.tipo].push(d); });

    const tiposConDatos = ORDEN_TIPOS.filter(t => grupos[t] && grupos[t].length > 0);
    const alturaCuadroResumen = (Math.ceil(tiposConDatos.length / 2) * 6) + 8; 

    doc.setFillColor(...PDF_CONFIG.COLOR_RESUMEN);
    doc.rect(margin, y, pw - (margin * 2), alturaCuadroResumen, 'F');
    doc.setFontSize(PDF_CONFIG.TAMANO_RESUMEN);
    doc.text("RESUMEN:", margin + 2, y + 5);
    
    let resY = y + 11;
    let colStep = 0;
    doc.setFont("helvetica", "normal");
    tiposConDatos.forEach((t) => {
        const posX = colStep % 2 === 0 ? margin + 5 : margin + (pw / 2);
        doc.text(`• ${t}: ${grupos[t].length}`, posX, resY);
        if (colStep % 2 !== 0) resY += 6;
        colStep++;
    });

    y = y + alturaCuadroResumen + 10; 

    const colW = (pw - (margin * 2)) / 2; 

    const dims = (base) => new Promise(ok => {
        if(!base) return ok({W:0, H:0});
        let img = new Image();
        img.onload = () => {
            let maxW = colW - 2; 
            let r = img.width / img.height;
            let W = maxW, H = maxW / r;
            if (H > 60) { H = 60; W = H * r; }
            ok({ W, H });
        };
        img.onerror = () => ok({ W: 0, H: 0 });
        img.src = base;
    });

    const internalPadding = 1;
    const labelWidth = 22;
    const lineH = PDF_CONFIG.TAMANO_TEXTO * 0.45;
    const gapSutil = 1;
    const ALTO_ENCABEZADO = 8; // Cuadro de 7mm + margen de separación de 1mm
    const margenVerticalTexto = 2.5; // Espacio vertical entre foto y texto (por encima) y entre texto y borde inferior
    const alturaAscendente = 2.5;    // Altura del texto sobre la línea base (helvetica 10pt)
    const alturaDescendente = 0.8;   // Trazo descendente bajo la última línea base

    // Caché de medidas para optimizar el rendimiento y evitar recalcular imágenes y textos
    const cacheMedidas = new Map();

    async function getMedidas(d) {
        if (cacheMedidas.has(d)) return cacheMedidas.get(d);

        let W = 0, H = 0;
        if (d.foto) {
            const dimg = await dims(d.foto);
            W = dimg.W;
            H = dimg.H;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(PDF_CONFIG.TAMANO_TEXTO);

        // Margen izquierdo del texto: igual al de la imagen para que queden alineados
        const margenIzquierdo = (H > 0 && W > 0) ? (colW - W) / 2 : internalPadding;
        const textX = margin + margenIzquierdo;

        // Espacio disponible para el texto hasta el margen derecho de la celda
        const anchoDisponible = colW - margenIzquierdo - internalPadding;
        const spaceForUbi = Math.max(20, anchoDisponible - labelWidth + 2);
        const spaceForDesc = Math.max(20, anchoDisponible - labelWidth - 2);

        const ubiLines = doc.splitTextToSize(String(d.ubicacion || ""), spaceForUbi);
        const descLines = doc.splitTextToSize(String(d.descripcion || ""), spaceForDesc);

        const ubiH = ubiLines.length * lineH;
        const descH = descLines.length * lineH;

        // Altura que ocupa el bloque de texto desde la primera línea base hasta el final de la última línea
        const altoTextoDesdeLineaBase = ubiH + gapSutil + ((descLines.length - 1) * lineH) + alturaDescendente;

        // Altura total de la celda garantizando centrado vertical exacto del bloque de texto
        let cellH;
        if (H > 0) {
            cellH = internalPadding + H + margenVerticalTexto + alturaAscendente + altoTextoDesdeLineaBase + margenVerticalTexto;
        } else {
            cellH = internalPadding + margenVerticalTexto + alturaAscendente + altoTextoDesdeLineaBase + margenVerticalTexto + internalPadding;
        }

        const m = {
            W,
            H,
            margenIzquierdo,
            textX,
            ubiLines,
            descLines,
            ubiH,
            descH,
            cellH
        };

        cacheMedidas.set(d, m);
        return m;
    }

    // --- BUCLE DE CONTENIDO ---
    for (const t of ORDEN_TIPOS) {
        if (!grupos[t] || grupos[t].length === 0) continue;

        // Comprobamos si en la página actual caben tanto el encabezado como la primera desviación del apartado
        const primeraDesv = grupos[t][0];
        const mPrimera = await getMedidas(primeraDesv);

        // Si el encabezado cabe pero no cabe la primera desviación (o el encabezado tampoco cabe),
        // pasamos el encabezado a la siguiente página (evitando encabezados huérfanos)
        if (y > margin + 5 && (y + ALTO_ENCABEZADO + mPrimera.cellH > ph - margin)) {
            doc.addPage();
            y = margin + 5;
        }

        // Dibujar encabezado del apartado
        doc.setFont("helvetica", "bold");
        doc.setFontSize(PDF_CONFIG.TAMANO_ENCABEZADO);
        doc.setFillColor(0, 121, 52);
        doc.rect(margin, y, pw - (margin * 2), 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(`${t.toUpperCase()} (${grupos[t].length})`, margin + 2, y + 5);
        doc.setTextColor(0, 0, 0);
        y += ALTO_ENCABEZADO;

        for (const d of grupos[t]) {
            const m = await getMedidas(d);

            // Salto de página si la desviación completa no cabe en la página actual:
            // la fila de la tabla pasa íntegra a la siguiente página (foto y texto no se separan)
            if (y > margin + 5 && (y + m.cellH > ph - margin)) {
                doc.addPage();
                y = margin + 5;
            }

            // Dibujar recuadros
            doc.setDrawColor(200);
            doc.rect(margin, y, colW, m.cellH);        // Celda izquierda (con datos)
            doc.rect(margin + colW, y, colW, m.cellH); // Celda derecha (vacía)

            let curY = y + internalPadding;

            // Insertar foto
            if (d.foto && m.H > 0) {
                const fotoMini = await achicarParaPDF(d.foto);
                const centroX = margin + (colW - m.W) / 2;
                doc.addImage(fotoMini, PDF_CONFIG.FORMATO_IMG, centroX, curY, m.W, m.H, undefined, PDF_CONFIG.COMPRESION_IMG);

                // --- BLOQUE: PIN VECTORIAL GPS ---
                if (d.lat && d.lon) {
                    const sIcon = 6;      // Tamaño total del icono
                    const padding = 1.5; 

                    // Posición: Esquina superior derecha de la foto
                    const iconX = centroX + m.W - sIcon - padding;
                    const iconY = curY + padding;

                    // 1. Sombra del pin
                    doc.setFillColor(0, 0, 0, 0.15);
                    doc.circle(iconX + 3, iconY + 6, 1.2, 'F');

                    // 2. Cuerpo del Pin (Rojo Google: #EA4335)
                    doc.setFillColor(234, 67, 53);
                    doc.circle(iconX + 3, iconY + 2.5, 2.5, 'F');
                    doc.triangle(
                        iconX + 0.8, iconY + 3.5,   // Esquina izquierda
                        iconX + 5.2, iconY + 3.5,   // Esquina derecha
                        iconX + 3, iconY + 6.5,     // Punta hacia abajo
                        'F'
                    );

                    // 3. El "agujero" blanco central
                    doc.setFillColor(255, 255, 255);
                    doc.circle(iconX + 3, iconY + 2.5, 1, 'F');

                    // 4. Enlace GPS a Google Maps
                    const googleMapsUrl = `https://www.google.com/maps?q=${d.lat},${d.lon}`;
                    doc.link(iconX, iconY, sIcon, sIcon, { url: googleMapsUrl });

                    // Resetear color de relleno
                    doc.setFillColor(0, 0, 0); 
                }

                // Posicionamos curY en la línea base del texto con margenVerticalTexto por encima
                curY += m.H + margenVerticalTexto + alturaAscendente;
            } else {
                curY += margenVerticalTexto + alturaAscendente;
            }

            // Insertar textos
            doc.setFontSize(PDF_CONFIG.TAMANO_TEXTO);

            // Ubicación
            doc.setFont(undefined, "bold");
            doc.text("Ubicación:", m.textX, curY);
            doc.setFont(undefined, "normal");
            doc.text(m.ubiLines, m.textX + labelWidth - 2, curY);
            
            curY += m.ubiH + gapSutil;

            // Descripción
            doc.setFont(undefined, "bold");
            doc.text("Descripción:", m.textX, curY);
            doc.setFont(undefined, "normal");
            doc.text(m.descLines, m.textX + labelWidth + 2, curY);

            // Avanzar posición Y para la siguiente fila
            y += m.cellH; 
        }
        y += 3; 
    }

    // --- 3. AÑADIR ENCABEZADOS CON LOGO (EXCEPTO PORTADA) ---
    const totalPaginas = doc.internal.getNumberOfPages();
    
    // Cargamos el logo una sola vez para el encabezado
    let imgLogoHeader = null;
    try {
        imgLogoHeader = await cargarImagen('images/logo.jpg');
    } catch (e) {
        console.warn("No se pudo cargar el logo para el encabezado");
    }

    for (let i = 2; i <= totalPaginas; i++) {
        doc.setPage(i);
        
        // Estilo del encabezado
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont("helvetica", "normal");
        
        // 1. Logo en pequeño (Lado izquierdo, arriba de la línea)
        if (imgLogoHeader) {
            // Coordenadas: x=margin, y=5, ancho=15, alto=proporcional (aprox 6)
            doc.addImage(imgLogoHeader, 'JPEG', margin, 5, 15, 6);
        }
        
        // 2. Nombre de sección (Al lado del logo)
        doc.text(`INFORME O&L: ${nombreSeccion.toUpperCase()}`, margin + 18, 9.5);
        
        // 3. Información derecha (Fecha y Página)
        const infoDerecha = `${fechaManual} | Pág. ${i} de ${totalPaginas}`;
        doc.text(infoDerecha, pw - margin, 9.5, { align: "right" });

        // 4. Línea divisoria sutil
        doc.setDrawColor(220);
        doc.setLineWidth(0.1);
        doc.line(margin, 12, pw - margin, 12);
    }

    // --- FINALIZACIÓN ---
    const nombreArchivo = `${codigoFecha}_Informe_OL_${nombreSeccion.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
}

// Función auxiliar para cargar imágenes locales como Base64 (necesaria para jsPDF)
function cargarImagen(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg"));
        };
        img.onerror = reject;
        img.src = url;
    });
}
