// js/export-docx.js

async function exportarAWord(nombreSeccion, desviaciones, resumen, fechaManual, notaManual, codigoFecha) {
    const { 
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        WidthType, ImageRun, ExternalHyperlink, AlignmentType, ShadingType, 
        BorderStyle, TabStopType 
    } = docx;

    const base64ToBuffer = (b64) => {
        try {
            const str = atob(b64.split(",")[1]);
            const buf = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
            return buf;
        } catch (e) { return null; }
    };

    const getImageDimensions = (base64) => new Promise(res => {
        if (!base64) return res({ width: 320, height: 220 });
        const img = new Image();
        img.onload = () => {
            const MAX_W = 320;
            const MAX_H = 220;
            let w = img.width;
            let h = img.height;
            const r = w / h;
            if (w > MAX_W) {
                w = MAX_W;
                h = w / r;
            }
            if (h > MAX_H) {
                h = MAX_H;
                w = h * r;
            }
            res({ width: Math.round(w), height: Math.round(h) });
        };
        img.onerror = () => res({ width: 320, height: 220 });
        img.src = base64;
    });

    let portadaBuffer = null;
    try {
        portadaBuffer = await imageToBuffer("images/portada.jpg");
    } catch (e) {
        console.error("Error cargando la portada:", e);
    }

    let logoBuffer = null;
    try {
        logoBuffer = await imageToBuffer("images/logo.jpg");
    } catch (e) {
        console.error("Error cargando el logo:", e);
    }

    const seccionesDoc = [];

    // --- 1. PORTADA ---

    // Línea 1: H1 - Título principal
    seccionesDoc.push(new Paragraph({
        children: [new TextRun({ text: "AUDITORIA DE ORDEN Y LIMPIEZA", bold: true, size: 50, color: "007934" })],
        alignment: AlignmentType.LEFT,
        spacing: { before: 800, after: 1500 }
    }));

    // Línea 2: H3 - Sección y Fecha
    seccionesDoc.push(new Paragraph({
        children: [
            new TextRun({ text: `${nombreSeccion.toUpperCase()}`, bold: true, size: 32, color: "007934" }),
            new TextRun({ text: "\t" }), 
            new TextRun({ text: `${(fechaManual || "").toUpperCase()}`, bold: true, size: 32, color: "007934" }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: 10500 }],
        spacing: { after: 600 }
    }));

    // Línea 3: H2 - Cuadro verde con desviaciones y resultado
    const hijosLinea2 = [
        new TextRun({ 
            text: `DESVIACIONES: ${desviaciones.length}`, 
            bold: true, size: 35, color: "FFFFFF" 
        })
    ];

    if (notaManual && String(notaManual).trim() !== "") {
        hijosLinea2.push(new TextRun({ text: "\t" }));
        hijosLinea2.push(new TextRun({ 
            text: `RESULTADO: ${notaManual}`, 
            bold: true, size: 35, color: "FFFFFF" 
        }));
    }

    const cuadroVerde = new Table({
        width: { size: 11906, type: WidthType.DXA },
        indent: { size: -720, type: WidthType.DXA }, 
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        shading: { fill: "007934" },
                        children: [
                            new Paragraph({
                                children: hijosLinea2,
                                tabStops: [{ type: TabStopType.RIGHT, position: 10500 + 620 }], 
                                spacing: { before: 200, after: 200 },
                                indent: { left: 620, right: 720 } 
                            })
                        ],
                        borders: {
                            top: { style: BorderStyle.NIL },
                            bottom: { style: BorderStyle.NIL },
                            left: { style: BorderStyle.NIL },
                            right: { style: BorderStyle.NIL }
                        }
                    })
                ]
            })
        ],
        margin: { bottom: 600 }
    });

    seccionesDoc.push(cuadroVerde);

    // Línea 4: Portada
    if (portadaBuffer) {
        const ANCHO_FORZADO = 800;
        seccionesDoc.push(new Paragraph({
            children: [
                new ImageRun({
                    data: portadaBuffer,
                    transformation: {
                        width: ANCHO_FORZADO,
                        height: 470
                    }
                })
            ],
            indent: { left: -800, right: -800 },
            spacing: { before: 0, after: 600 }
        }));
    }

    // Línea 5: Logo
    if (logoBuffer) {
        seccionesDoc.push(new Paragraph({
            children: [
                new ImageRun({
                    data: logoBuffer,
                    transformation: {
                        width: 259,
                        height: 158
                    }
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 350 }
        }));
    }

    // Salto de página a contenido
    seccionesDoc.push(
        new Paragraph({
            children: [],
            pageBreakBefore: true
        })
    );

    // --- 2. GRUPOS Y RESUMEN (PÁGINA 2) ---
    const ORDEN_TIPOS = [
        "Almacenamiento", "Productos químicos", "Mangueras", "Herramientas", 
        "Equipos e instalaciones", "Elementos de seguridad y EPI's", 
        "Zonas de paso y comunes", "Señalización y comunicación", "Residuos"
    ];
    const grupos = {};
    desviaciones.forEach(d => {
        if (!grupos[d.tipo]) grupos[d.tipo] = [];
        grupos[d.tipo].push(d);
    });

    const tiposConDatos = ORDEN_TIPOS.filter(t => grupos[t] && grupos[t].length > 0);

    if (tiposConDatos.length > 0) {
        const col1Paragraphs = [];
        const col2Paragraphs = [];

        tiposConDatos.forEach((t, idx) => {
            const p = new Paragraph({
                children: [
                    new TextRun({ text: `• ${t}: `, bold: true, size: 20 }),
                    new TextRun({ text: `${grupos[t].length}`, size: 20 })
                ],
                spacing: { before: 40, after: 40 },
                indent: { left: 80 }
            });
            if (idx % 2 === 0) col1Paragraphs.push(p);
            else col2Paragraphs.push(p);
        });

        const resumenTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    cantSplit: true,
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            columnSpan: 2,
                            shading: { fill: "F5F5F5" },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "RESUMEN:", bold: true, size: 22 })],
                                    spacing: { before: 120, after: 80 },
                                    indent: { left: 120 }
                                })
                            ],
                            borders: {
                                top: { style: BorderStyle.NIL },
                                bottom: { style: BorderStyle.NIL },
                                left: { style: BorderStyle.NIL },
                                right: { style: BorderStyle.NIL }
                            }
                        })
                    ]
                }),
                new TableRow({
                    cantSplit: true,
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            shading: { fill: "F5F5F5" },
                            children: col1Paragraphs,
                            borders: {
                                top: { style: BorderStyle.NIL },
                                bottom: { style: BorderStyle.NIL },
                                left: { style: BorderStyle.NIL },
                                right: { style: BorderStyle.NIL }
                            }
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            shading: { fill: "F5F5F5" },
                            children: col2Paragraphs.length > 0 ? col2Paragraphs : [new Paragraph("")],
                            borders: {
                                top: { style: BorderStyle.NIL },
                                bottom: { style: BorderStyle.NIL },
                                left: { style: BorderStyle.NIL },
                                right: { style: BorderStyle.NIL }
                            }
                        })
                    ]
                })
            ],
            margin: { bottom: 350 }
        });

        seccionesDoc.push(resumenTable);
    }

    // --- 3. BUCLE DE CONTENIDO POR CATEGORÍAS ---
    for (const t of ORDEN_TIPOS) {
        if (!grupos[t] || grupos[t].length === 0) continue;

        // Encabezado del tipo: fondo verde corporativo y keepWithNext para evitar que quede huérfano
        seccionesDoc.push(new Paragraph({
            keepWithNext: true,
            children: [new TextRun({ text: `${t.toUpperCase()} (${grupos[t].length})`, bold: true, color: "FFFFFF", size: 22 })],
            shading: { fill: "007934" },
            spacing: { before: 300, after: 120 },
            indent: { left: 80, right: 80 }
        }));

        for (const d of grupos[t]) {
            const leftCellChildren = [];

            // Foto
            if (d.foto) {
                const buffer = base64ToBuffer(d.foto);
                if (buffer) {
                    const dim = await getImageDimensions(d.foto);
                    leftCellChildren.push(new Paragraph({
                        children: [new ImageRun({ data: buffer, transformation: { width: dim.width, height: dim.height } })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 60, after: 100 }
                    }));
                }
            }

            // Ubicación (arriba, como en PDF)
            leftCellChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: "Ubicación: ", bold: true, size: 20 }), 
                    new TextRun({ text: d.ubicacion || "—", size: 20 })
                ],
                spacing: { before: 40, after: 40 },
                indent: { left: 120, right: 120 }
            }));

            // Descripción (abajo, como en PDF)
            leftCellChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: "Descripción: ", bold: true, size: 20 }), 
                    new TextRun({ text: d.descripcion || "—", size: 20 })
                ],
                spacing: { before: 40, after: 40 },
                indent: { left: 120, right: 120 }
            }));

            // Fila de la tabla con cantSplit para que no se divida entre páginas
            seccionesDoc.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        cantSplit: true,
                        children: [
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                children: leftCellChildren,
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "C8C8C8" },
                                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "C8C8C8" },
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "C8C8C8" },
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "C8C8C8" }
                                }
                            }),
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                children: [new Paragraph("")],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "C8C8C8" },
                                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "C8C8C8" },
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "C8C8C8" },
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "C8C8C8" }
                                }
                            })
                        ]
                    })
                ],
                margin: { bottom: 250 }
            }));
        }
    }

    // 4. Configuración final y descarga
    const doc = new Document({
        sections: [{
            properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
            children: seccionesDoc
        }]
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${codigoFecha}_Informe_OL_${nombreSeccion.replace(/\s+/g, '_')}.docx`);
    });
}

// Función auxiliar para cargar imagen local como buffer
async function imageToBuffer(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo cargar la imagen: ${url}`);
    const blob = await response.blob();
    return await blob.arrayBuffer();
}
