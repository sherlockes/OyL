/**
 * CONFIGURACIÓN GLOBAL DEL PDF
 */
const PDF_CONFIG = {
    MARGEN: 15,
    COMPRESION_PDF: true, // Esto debe estar en true
    COMPRESION_IMG: 'MEDIUM', // Cambia 'FAST' por 'MEDIUM' o 'SLOW' (comprime más)
    FORMATO_IMG: 'JPEG',        
    COLOR_TITULO: [200, 230, 201], 
    COLOR_RESUMEN: [245, 245, 245], 
    TAMANO_TITULO: 16,          
    TAMANO_ENCABEZADO: 11,      
    TAMANO_TEXTO: 10,           
    TAMANO_RESUMEN: 9.5         
};

async function generarPDF(desviaciones, seccionId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ compress: PDF_CONFIG.COMPRESION_PDF, unit: 'mm', format: 'a4' });
    
    const margin = PDF_CONFIG.MARGEN; 
    const pageWidth = 210 - (margin * 2); 
    const ph = doc.internal.pageSize.getHeight();
    let y = margin + 10; 

    // --- FECHA Y TÍTULO ---
    const fecha = new Date();
    const codigoFecha = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const totalGlobal = desviaciones.length;
    let nombreSeccion = (seccionId && !seccionId.toLowerCase().includes("informe")) ? seccionId : "GENERAL";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(PDF_CONFIG.TAMANO_TITULO);
    doc.text(`${codigoFecha} - Informe de O&L de ${nombreSeccion.toUpperCase()} - ${totalGlobal} desviaciones`, margin, y);
    
    doc.setDrawColor(...PDF_CONFIG.COLOR_TITULO); 
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + pageWidth, y + 2);
    y += 10;

    // --- GRUPOS Y RESUMEN ---
    const ORDEN_TIPOS = ["Almacenamiento", "Productos químicos", "Mangueras", "Herramientas", "Equipos e instalaciones", "Elementos de seguridad y EPI's", "Zonas de paso y comunes", "Señalización y comunicación", "Residuos"];
    const grupos = {};
    desviaciones.forEach(d => { if (!grupos[d.tipo]) grupos[d.tipo] = []; grupos[d.tipo].push(d); });

    const tiposConDatos = ORDEN_TIPOS.filter(t => grupos[t] && grupos[t].length > 0);
    const alturaCuadro = (Math.ceil(tiposConDatos.length / 2) * 6) + 8; 

    doc.setFillColor(...PDF_CONFIG.COLOR_RESUMEN);
    doc.rect(margin, y, pageWidth, alturaCuadro, 'F');
    doc.setFontSize(PDF_CONFIG.TAMANO_RESUMEN);
    doc.text("RESUMEN:", margin + 2, y + 5);
    
    let resY = y + 11;
    let colStep = 0;
    doc.setFont("helvetica", "normal");
    tiposConDatos.forEach((t) => {
        const posX = colStep % 2 === 0 ? margin + 5 : margin + (pageWidth / 2) + 5;
        doc.text(`• ${t}: ${grupos[t].length}`, posX, resY);
        if (colStep % 2 !== 0) resY += 6;
        colStep++;
    });

    y = y + alturaCuadro + 10; 

    const colW = pageWidth / 2;
    const contentStartX = 24; 

    const dims = (base) => new Promise(ok => {
        if(!base) return ok({W:0, H:0});
        let img = new Image();
        img.onload = () => {
            let maxW = colW - 4; 
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

        if (y + 15 > ph - margin) { doc.addPage(); y = margin + 5; }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(PDF_CONFIG.TAMANO_ENCABEZADO);
        doc.setFillColor(...PDF_CONFIG.COLOR_TITULO); 
        doc.rect(margin, y, pageWidth, 6, 'F');
        doc.text(`${t.toUpperCase()} (${grupos[t].length})`, margin + 2, y + 4.2);
        y += 7; 

        for (const d of grupos[t]) {
            let W = 0, H = 0;
            if (d.foto) { const dimg = await dims(d.foto); W = dimg.W; H = dimg.H; }

            doc.setFontSize(PDF_CONFIG.TAMANO_TEXTO);
            const spaceForText = colW - contentStartX - 2;
            const ubiLines = doc.splitTextToSize(String(d.ubicacion || ""), spaceForText);
            const descLines = doc.splitTextToSize(String(d.descripcion || ""), spaceForText);
            
            // --- AJUSTES DE ESPACIADO ---
            const lineH = PDF_CONFIG.TAMANO_TEXTO * 0.42; 
            const paddingAfterFoto = 4;   // Hueco recuperado entre foto y texto
            const gapBetweenFields = 1.2; // Espacio mínimo entre líneas
            const paddingBottom = 1;      // Espacio mínimo al final de la celda
            
            // Calculamos altura total sumando solo lo estrictamente necesario
            const textSectionH = (ubiLines.length * lineH) + (descLines.length * lineH) + gapBetweenFields; 
            let cellH = 2 + (H > 0 ? H + paddingAfterFoto : 0) + textSectionH + paddingBottom;

            if (y + cellH > ph - margin) { doc.addPage(); y = margin + 5; }

            doc.setDrawColor(200);
            doc.rect(margin, y, colW, cellH);
            doc.rect(margin + colW, y, colW, cellH);

            let curY = y + 2;

            if (H > 0 && d.foto) {
                doc.addImage(d.foto, PDF_CONFIG.FORMATO_IMG, margin + (colW - W) / 2, curY, W, H, undefined, PDF_CONFIG.COMPRESION_IMG);
                curY += H + paddingAfterFoto; // Aplicamos el hueco aquí
            }

            // --- TEXTOS ---
            doc.setFontSize(PDF_CONFIG.TAMANO_TEXTO);
            
            // Ubicación
            doc.setFont(undefined, "bold");
            doc.text("Ubicación:", margin + 2, curY);
            doc.setFont(undefined, "normal");
            doc.text(ubiLines, margin + contentStartX, curY);
            
            curY += (ubiLines.length * lineH) + gapBetweenFields; 

            // Descripción
            doc.setFont(undefined, "bold");
            doc.text("Descripción:", margin + 2, curY);
            doc.setFont(undefined, "normal");
            doc.text(descLines, margin + contentStartX, curY);

            y += cellH; 
        }
        y += 6; 
    }
    doc.save(`${codigoFecha}_Informe_OL_${nombreSeccion.replace(/\s+/g, '_')}.pdf`);
}
