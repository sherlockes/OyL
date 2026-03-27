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

    let portadaBuffer = null;
    try {
	// Intentamos cargar la portada
	portadaBuffer = await imageToBuffer("images/portada.jpg");
    } catch (e) {
	console.error("Error cargando la portada:", e);
	// Si falla, el informe se generará sin portada
    }

    const seccionesDoc = [];

    // 1. Título Principal
    seccionesDoc.push(new Paragraph({
        children: [new TextRun({ text: "INFORME DE ORDEN Y LIMPIEZA", bold: true, size: 50, color: "007934" })],
        alignment: AlignmentType.LEFT,
        spacing: { before: 800, after: 600 }
    }));

    // 2. Línea 1: SECCIÓN | FECHA
    seccionesDoc.push(new Paragraph({
        children: [
            new TextRun({ text: `${nombreSeccion.toUpperCase()}`, bold: true, size: 32, color: "007934" }),
            new TextRun({ text: "\t" }), 
            new TextRun({ text: `${fechaManual.toUpperCase()}`, bold: true, size: 32, color: "007934" }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: 10500 }],
        spacing: { after: 300 }
    }));

    // --- C. Línea 2: CUADRO VERDE (Sangrado Total de Borde a Borde) ---
    const hijosLinea2 = [
        new TextRun({ 
            text: `DESVIACIONES: ${desviaciones.length}`, 
            bold: true, size: 35, color: "FFFFFF" 
        })
    ];

    if (notaManual && notaManual.trim() !== "") {
        hijosLinea2.push(new TextRun({ text: "\t" }));
        hijosLinea2.push(new TextRun({ 
            text: `RESULTADO: ${notaManual}`, 
            bold: true, size: 35, color: "FFFFFF" 
        }));
    }

    const cuadroResumen = new Table({
        // 1. FORZAMOS el ancho total del papel A4 (11906 twips)
        width: { size: 11906, type: WidthType.DXA },
        // 2. DESPLAZAMOS a la izquierda para que empiece en el borde físico (margen 720)
        indent: { size: -720, type: WidthType.DXA }, 
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: "007934" },
                        children: [
                            new Paragraph({
                                children: hijosLinea2,
                                // Alineamos el tabulador sumando el margen para que no se mueva
                                tabStops: [{ type: TabStopType.RIGHT, position: 10500 + 620 }], 
                                spacing: { before: 200, after: 200 },
                                // IMPORTANTE: Metemos el texto hacia adentro 720 
                                // para que se alinee con el resto del informe
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

    seccionesDoc.push(cuadroResumen);

    // --- D. PORTADA (Sangrado Total de Borde a Borde) ---
    if (portadaBuffer) {
	seccionesDoc.push(new Paragraph({
            children: [
		new ImageRun({
                    data: portadaBuffer,
                    transformation: {
			// 595 puntos es el ancho exacto de un A4 (21cm)
			width: 595, 
			// Ajusta la altura según tu imagen para que no se vea estirada
			height: 420 
                    }
		})
            ],
            // Empujamos el párrafo hacia la izquierda para ignorar el margen de la página
            // 720 twips es el margen "estrecho" que configuramos (1.27cm)
            indent: { left: -720 }, 
            // Eliminamos el espacio superior para que pegue con el cuadro verde
            spacing: { before: 0, after: 600 } 
	}));
    }
    
    // 4. Bucle de Desviaciones (2 Columnas)
    for (const d of desviaciones) {
        // Encabezado de Tipo
        seccionesDoc.push(new Paragraph({
            children: [new TextRun({ text: `TIPO: ${d.tipo}`, bold: true, color: "FFFFFF", size: 22 })],
            shading: { fill: "007934" },
            spacing: { before: 400, after: 100 },
            indent: { left: 120 }
        }));

        const leftCellChildren = [];
        if (d.foto) {
            const buffer = base64ToBuffer(d.foto);
            if (buffer) {
                leftCellChildren.push(new Paragraph({
                    children: [new ImageRun({ data: buffer, transformation: { width: 320, height: 240 } })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 }
                }));
            }
        }

        leftCellChildren.push(new Paragraph({
            children: [new TextRun({ text: "Descripción: ", bold: true }), new TextRun(d.descripcion || "—")],
            spacing: { before: 100 }, indent: { left: 120 }
        }));
        leftCellChildren.push(new Paragraph({
            children: [new TextRun({ text: "Ubicación: ", bold: true }), new TextRun(d.ubicacion || "—")],
            spacing: { before: 100 }, indent: { left: 120 }
        }));

        if (d.lat && d.lon) {
            leftCellChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: "📍 " }), 
                    new ExternalHyperlink({
                        children: [new TextRun({ text: "Ver en Maps", color: "0000FF", underline: {} })],
                        link: `https://www.google.com/maps?q=${d.lat},${d.lon}`
                    })
                ],
                spacing: { before: 100, after: 100 }, indent: { left: 120 }
            }));
        }

        seccionesDoc.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: leftCellChildren,
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" }
                            }
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph("")],
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" }
                            }
                        })
                    ]
                })
            ],
            margin: { bottom: 400 }
        }));
    }

    // 5. Configuración final y descarga
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
