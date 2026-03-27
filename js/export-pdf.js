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
        const imgPortada = await cargarImagen('portada.jpg');
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
        const imgLogo = await cargarImagen('logo.jpg');
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
            if (H > 70) { H = 70; W = H * r; }
            ok({ W, H });
        };
        img.src = base;
    });

    // --- BUCLE DE CONTENIDO ---
    for (const t of ORDEN_TIPOS) {
        if (!grupos[t] || grupos[t].length === 0) continue;

        if (y + 20 > ph - margin) { doc.addPage(); y = margin + 5; }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(PDF_CONFIG.TAMANO_ENCABEZADO);
        //doc.setFillColor(...PDF_CONFIG.COLOR_TITULO);
	doc.setFillColor(0, 121, 52);
        doc.rect(margin, y, pw - (margin * 2), 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(`${t.toUpperCase()} (${grupos[t].length})`, margin + 2, y + 5);
        doc.setTextColor(0, 0, 0);
        y += 8; 

        for (const d of grupos[t]) {
            // 1. DIMENSIONES Y AJUSTES INICIALES
            let W = 0, H = 0;
            if (d.foto) { 
                const dimg = await dims(d.foto); 
                W = dimg.W; 
                H = dimg.H; 
            }

            const colW = (pw - (margin * 2)) / 2; // Ancho de la celda
            const internalPadding = 1;            // Margen superior/inferior reducido
            const labelWidth = 22;               // Espacio para "Ubicación:"
            
            // --- AQUÍ ESTABA EL ERROR: Definimos spaceForValue ---
            const spaceForValue = colW - labelWidth - (internalPadding * 2);
            
            const lineH = PDF_CONFIG.TAMANO_TEXTO * 0.45; 
            const gapSutil = 1; // Espacio entre bloques de texto

            // 2. CÁLCULO DE LÍNEAS Y ALTURAS DE TEXTO
            const ubiLines = doc.splitTextToSize(String(d.ubicacion || ""), spaceForValue);
            const descLines = doc.splitTextToSize(String(d.descripcion || ""), spaceForValue);
            
            const ubiH = ubiLines.length * lineH;
            const descH = descLines.length * lineH;

            // 3. CÁLCULO DE ALTURA DE CELDA (MÁS AJUSTADO)
            let cellH = (internalPadding * 2); 
            if (H > 0) {
                cellH += H + 2; // Foto + pequeño margen
            }
            cellH += ubiH + gapSutil + descH; 

            // 4. SALTO DE PÁGINA SI NO CABE
            if (y + cellH > ph - margin) { 
                doc.addPage(); 
                y = margin + 5; 
            }

            // 5. DIBUJAR RECUADROS
            doc.setDrawColor(200);
            doc.rect(margin, y, colW, cellH);        // Celda izquierda (con datos)
            doc.rect(margin + colW, y, colW, cellH); // Celda derecha (vacía)

            let curY = y + internalPadding;

            // 6. INSERTAR FOTO
            if (d.foto && H > 0) {
                const fotoMini = await achicarParaPDF(d.foto);
                const centroX = margin + (colW - W) / 2;
                doc.addImage(fotoMini, PDF_CONFIG.FORMATO_IMG, centroX, curY, W, H, undefined, PDF_CONFIG.COMPRESION_IMG);
                curY += H + 5;
            }

            // 7. INSERTAR TEXTOS
            doc.setFontSize(PDF_CONFIG.TAMANO_TEXTO);

            // Ubicación
            doc.setFont(undefined, "bold");
            doc.text("Ubicación:", margin + internalPadding, curY);
            doc.setFont(undefined, "normal");
            doc.text(ubiLines, margin + internalPadding + labelWidth - 2, curY);
            
            curY += ubiH + gapSutil;

            // Descripción
            doc.setFont(undefined, "bold");
            doc.text("Descripción:", margin + internalPadding, curY);
            doc.setFont(undefined, "normal");
            doc.text(descLines, margin + internalPadding + labelWidth + 2, curY);

            // Avanzar posición Y para la siguiente fila
            y += cellH; 
        }
        y += 5; 
    }

    // --- FINALIZACIÓN ---
    doc.save(`${codigoFecha}_Informe_OL_${nombreSeccion.replace(/\s+/g, '_')}.pdf`);
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
