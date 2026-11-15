// 1. COMPRESIÓN DE IMÁGENES
function comprimirBase64(base64Str, calidad = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_DIM = 640;
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                    height = Math.round((height * MAX_DIM) / width);
                    width = MAX_DIM;
                } else {
                    width = Math.round((width * MAX_DIM) / height);
                    height = MAX_DIM;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', calidad));
        };
        img.onerror = () => resolve(base64Str);
    });
}

// Función auxiliar para cargar imagen local como base64
function cargarImagenBase64(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => resolve("");
        img.src = url;
    });
}

// 2. GENERACIÓN DEL INFORME
async function generarHTML(desviaciones, seccionId, fechaManual, notaManual, opciones = {}) {
    const fecha = new Date();
    const codigoFecha = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const totalGlobal = desviaciones.length;
    let nombreSeccion = (seccionId && !seccionId.toLowerCase().includes("informe")) ? seccionId : "GENERAL";

    const opcionesFecha = { month: 'long', year: 'numeric' };
    let fechaDefecto = fecha.toLocaleDateString('es-ES', opcionesFecha);
    fechaDefecto = fechaDefecto.charAt(0).toUpperCase() + fechaDefecto.slice(1);
    fechaDefecto = fechaDefecto.replace(" de ", " ");

    const fechaFinal = fechaManual || fechaDefecto;
    const notaFinal = (notaManual !== undefined && notaManual !== null) ? String(notaManual).trim() : "";

    const imgPortadaBase64 = await cargarImagenBase64('images/portada.jpg');
    const imgLogoBase64 = await cargarImagenBase64('images/logo.jpg');

    const ORDEN_TIPOS = ["Almacenamiento", "Productos químicos", "Mangueras", "Herramientas", "Equipos e instalaciones", "Elementos de seguridad y EPI's", "Zonas de paso y comunes", "Señalización y comunicación", "Residuos"];
    const grupos = {};
    desviaciones.forEach(d => { if (!grupos[d.tipo]) grupos[d.tipo] = []; grupos[d.tipo].push(d); });
    
    let resumenHTML = "";
    ORDEN_TIPOS.filter(t => grupos[t] && grupos[t].length > 0).forEach(t => {
        const idLimpio = t.replace(/\s+/g, '_');
        resumenHTML += `<li data-tipo="${t}"><strong>${t}:</strong> ${grupos[t].length} <span class="cont-corr" id="corr_${idLimpio}">(0 corregidas)</span></li>`;
    });

    let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Informe O&L - ${nombreSeccion}</title>
        <style>
            body { font-family: Segoe UI, Arial, sans-serif; margin: 40px; color: #333; padding-bottom: 100px; }

            /* --- CONTENEDOR PRINCIPAL DEL INFORME --- */
            .report-wrapper { max-width: 900px; margin: 0 auto; }

            /* --- ESTILOS DE LA PORTADA --- */
            .portada-container { max-width: 900px; margin: 0 auto 50px auto; padding-bottom: 30px; border-bottom: 2px dashed #ddd; }
            .portada-titulo { font-size: 28px; font-weight: bold; color: #007934; margin: 0 0 25px 0; }
            .portada-subtitulo { display: flex; justify-content: space-between; align-items: baseline; font-size: 20px; font-weight: bold; color: #007934; margin-bottom: 20px; }
            .portada-cuadro-verde { background: #007934; color: #ffffff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; font-size: 22px; font-weight: bold; margin-bottom: 25px; border-radius: 4px; }
            .portada-img-wrapper { width: 100%; margin-bottom: 25px; text-align: center; }
            .portada-img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 4px; display: block; }
            .portada-logo-wrapper { text-align: center; margin-top: 25px; margin-bottom: 25px; }
            .portada-logo { max-width: 200px; height: auto; display: inline-block; }

            .header-title { font-size: 20px; font-weight: bold; border-bottom: 2px solid rgb(200, 230, 201); padding-bottom: 5px; margin-bottom: 10px; }
            .resumen-box { background: rgb(245, 245, 245); padding: 15px; border-radius: 4px; margin-bottom: 25px; border: 1px solid #eee; }
            .resumen-box h2 { font-size: 14px; margin-top: 0; color: #555; text-decoration: underline; margin-bottom: 8px; }
            .resumen-list { display: grid; grid-template-columns: 1fr 1fr; list-style: none; padding: 0; font-size: 13px; margin: 0; }
            .resumen-list li::before { content: "• "; color: #666; }
            .cont-corr { color: #2e7d32; font-weight: bold; margin-left: 5px; }
            .categoria-header { background: #007934; color: #ffffff; padding: 6px 12px; font-weight: bold; margin-top: 25px; border: 1px solid #007934; border-bottom: none; font-size: 14px; }
            .fila-desviacion { display: grid; grid-template-columns: 1fr 1fr; gap: 0; page-break-inside: avoid; }
            .cell { border: 0.5px solid #ccc; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; min-height: 150px; position: relative; }
            .cell-subsanacion { background-color: #fafafa; }
            .img-container img { max-width: 100%; max-height: 250px; border-radius: 2px; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;}
            .info-row { font-size: 13px; margin-bottom: 4px; display: flex; }
            .label { font-weight: bold; min-width: 100px; }
            
            /* BOTONES FLOTANTES */
            .controls-container { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 1000; }
            .btn-action { padding: 12px 20px; border-radius: 50px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: none; color: white; display: flex; align-items: center; gap: 8px; font-size: 14px; }
            .btn-save { background: #2e7d32; }
            .btn-filter { background: #1976d2; }
            .btn-filter.active { background: #f57c00; box-shadow: inset 0 2px 5px rgba(0,0,0,0.4); }
            
            .btn-add { background: #1976d2; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; }
            .btn-edit { background: #ffa000; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-top: 5px; align-self: flex-end; }
            textarea { width: 100%; border: 1px solid #ccc; font-family: inherit; font-size: 13px; margin-top: 5px; padding: 5px; box-sizing: border-box; resize: vertical; }
            .texto-subsanado { font-size: 13px; margin-top: 5px; white-space: pre-wrap; }
            .overlay-msg { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.65); color:white; padding:6px 12px; border-radius:4px; font-size:11px; pointer-events:none; text-align:center; }

            /* MODAL SELECTOR FOTO */
            .modal-foto-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.55); z-index: 9999; display: flex; justify-content: center; align-items: center; }
            .modal-foto-sheet { background: #ffffff; width: 90%; max-width: 380px; border-radius: 10px; padding: 20px; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
            .modal-foto-header { text-align: center; margin-bottom: 15px; }
            .modal-foto-header h3 { margin: 0 0 6px 0; font-size: 16px; color: #007934; }
            .modal-foto-header p { margin: 0; font-size: 13px; color: #666; }
            .modal-foto-actions { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
            .btn-sheet { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #ddd; border-radius: 6px; background: #f9f9f9; cursor: pointer; text-align: left; font-family: inherit; width: 100%; box-sizing: border-box; }
            .btn-sheet:active { transform: scale(0.98); }
            .btn-sheet-cam { border-color: #c8e6c9; background: #f1f8e9; }
            .btn-sheet-gal { border-color: #bbdefb; background: #e3f2fd; }
            .sheet-icon { font-size: 22px; line-height: 1; }
            .sheet-text strong { display: block; font-size: 13px; color: #222; }
            .sheet-text small { display: block; font-size: 11px; color: #666; }
            .btn-sheet-cancel { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #eee; color: #555; font-weight: bold; font-size: 13px; cursor: pointer; font-family: inherit; }
            .btn-sheet-cancel:active { background: #ddd; }
            
            @media print {
                .no-print, .controls-container, .btn-edit, .btn-add, .overlay-msg, .modal-foto-overlay, input { display: none !important; }
                body { margin: 15mm; }
                .report-wrapper { max-width: 100%; margin: 0; }
                .portada-container { border-bottom: none; margin-bottom: 0; padding-bottom: 0; page-break-after: always; break-after: page; }
            }
        </style>
    </head>
    <body>
        <div class="report-wrapper">
        <!-- PORTADA -->
        <div class="portada-container">
            <h1 class="portada-titulo">AUDITORIA DE ORDEN Y LIMPIEZA</h1>
            <div class="portada-subtitulo">
                <span class="portada-seccion">${nombreSeccion.toUpperCase()}</span>
                <span class="portada-fecha">${fechaFinal}</span>
            </div>
            <div class="portada-cuadro-verde">
                <span>DESVIACIONES: ${totalGlobal}</span>
                ${notaFinal ? `<span>RESULTADO: ${notaFinal}</span>` : ''}
            </div>
            ${imgPortadaBase64 ? `
            <div class="portada-img-wrapper">
                <img src="${imgPortadaBase64}" class="portada-img" alt="Portada">
            </div>` : ''}
            ${imgLogoBase64 ? `
            <div class="portada-logo-wrapper">
                <img src="${imgLogoBase64}" class="portada-logo" alt="Logo">
            </div>` : ''}
        </div>

        <div class="header-title">${codigoFecha} - Informe de O&L de ${nombreSeccion.toUpperCase()} - ${totalGlobal} desviaciones</div>
        <div class="resumen-box">
            <h2>RESUMEN:</h2>
            <ul class="resumen-list">${resumenHTML}</ul>
        </div>

        <div class="controls-container no-print">
            <button class="btn-action btn-filter" id="btnFiltro" onclick="toggleFiltro()">🔍 VER SOLO PENDIENTES</button>
            <button class="btn-action btn-save" onclick="descargarVersionEditable()">💾 GUARDAR CAMBIOS</button>
        </div>

        <div id="contenido-informe">`;

    for (const t of ORDEN_TIPOS) {
        if (!grupos[t] || grupos[t].length === 0) continue;
        html += `<div class="categoria-header" data-tipo="${t}">${t.toUpperCase()} (${grupos[t].length})</div>`;
        for (const d of grupos[t]) {
            let fotoOriginal = d.foto ? await comprimirBase64(d.foto, 0.5) : "";
            html += `
            <div class="fila-desviacion" data-tipo="${t}" data-corregida="false">
                <div class="cell">
                    ${fotoOriginal ? `<div class="img-container"><img src="${fotoOriginal}"></div>` : ''}
                    <div class="info-row"><span class="label">Ubicación:</span><span>${d.ubicacion || '—'}</span></div>
                    <div class="info-row"><span class="label">Descripción:</span><span>${d.descripcion}</span></div>
                </div>
                <div class="cell cell-subsanacion">
                    <div class="subsanacion-view" style="display:none;"></div>
                    <div class="subsanacion-edit" style="display:none;">
                        <div class="img-preview"></div>
                        <div class="info-row"><span class="label">Acción:</span></div>
                        <textarea rows="3" placeholder="Describe la corrección..."></textarea>
                        <button class="btn-add" onclick="finalizarEdicion(this)" style="background:#2e7d32; margin-top:10px;">✅ ACEPTAR</button>
                    </div>
                    <div class="upload-zone" style="text-align:center; margin:auto;">
                        <button type="button" class="btn-add" onclick="abrirSelectorFoto(this.closest('.cell'))">➕ AÑADIR SUBSANACIÓN</button>
                    </div>
                </div>
            </div>`;
        }
    }

    html += `
        </div>
        </div>

        <!-- Controles para selección de foto en subsanaciones -->
        <input type="file" id="input-camara-subsanacion" accept="image/*" capture="environment" style="display:none;" onchange="procesarFoto(this)">
        <input type="file" id="input-galeria-subsanacion" accept="image/*" style="display:none;" onchange="procesarFoto(this)">

        <div id="modal-origen-foto" class="modal-foto-overlay no-print" style="display:none;" onclick="cerrarModalFoto(event)">
            <div class="modal-foto-sheet" onclick="event.stopPropagation()">
                <div class="modal-foto-header">
                    <h3>📷 Añadir Foto de Subsanación</h3>
                    <p>Selecciona cómo deseas añadir la imagen:</p>
                </div>
                <div class="modal-foto-actions">
                    <button type="button" class="btn-sheet btn-sheet-cam" onclick="seleccionarOrigen('camara')">
                        <span class="sheet-icon">📸</span>
                        <div class="sheet-text">
                            <strong>Tomar foto con la cámara</strong>
                            <small>Abre la cámara del dispositivo para hacer la foto</small>
                        </div>
                    </button>
                    <button type="button" class="btn-sheet btn-sheet-gal" onclick="seleccionarOrigen('galeria')">
                        <span class="sheet-icon">🖼️</span>
                        <div class="sheet-text">
                            <strong>Elegir de la galería</strong>
                            <small>Selecciona una imagen guardada en tu dispositivo</small>
                        </div>
                    </button>
                </div>
                <button type="button" class="btn-sheet-cancel" onclick="cerrarModalFoto()">Cancelar</button>
            </div>
        </div>

        <script>
            let filtroActivo = false;
            let celdaActiva = null;

            function abrirSelectorFoto(cell) {
                celdaActiva = cell;
                const modal = document.getElementById('modal-origen-foto');
                if (modal) modal.style.display = 'flex';
            }

            function cerrarModalFoto(e) {
                if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('btn-sheet-cancel')) return;
                const modal = document.getElementById('modal-origen-foto');
                if (modal) modal.style.display = 'none';
            }

            function seleccionarOrigen(origen) {
                const modal = document.getElementById('modal-origen-foto');
                if (modal) modal.style.display = 'none';
                if (!celdaActiva) return;
                if (origen === 'camara') {
                    document.getElementById('input-camara-subsanacion').click();
                } else {
                    document.getElementById('input-galeria-subsanacion').click();
                }
            }

            function actualizarResumen() {
                const categorias = {};
                document.querySelectorAll('.fila-desviacion').forEach(fila => {
                    const tipo = fila.getAttribute('data-tipo');
                    if (!categorias[tipo]) categorias[tipo] = { total: 0, corr: 0 };
                    categorias[tipo].total++;
                    if (fila.getAttribute('data-corregida') === 'true') {
                        categorias[tipo].corr++;
                    }
                });

                for (const [tipo, stats] of Object.entries(categorias)) {
                    const idLimpio = "corr_" + tipo.replace(/\\s+/g, '_');
                    const span = document.getElementById(idLimpio);
                    if (span) {
                        span.innerText = "(" + stats.corr + " corregidas)";
                        span.style.color = (stats.corr === stats.total) ? "#2e7d32" : "#666";
                    }
                }
                if(filtroActivo) aplicarFiltro();
            }

            function toggleFiltro() {
                filtroActivo = !filtroActivo;
                const btn = document.getElementById('btnFiltro');
                btn.innerText = filtroActivo ? "👁️ VER TODO EL INFORME" : "🔍 VER SOLO PENDIENTES";
                btn.classList.toggle('active', filtroActivo);
                aplicarFiltro();
            }

            function aplicarFiltro() {
                const categoriasIncompletas = new Set();
                
                // 1. Mostrar/Ocultar Filas
                document.querySelectorAll('.fila-desviacion').forEach(fila => {
                    const estaCorregida = fila.getAttribute('data-corregida') === 'true';
                    if (filtroActivo && estaCorregida) {
                        fila.style.display = 'none';
                    } else {
                        fila.style.display = 'grid';
                        categoriasIncompletas.add(fila.getAttribute('data-tipo'));
                    }
                });

                // 2. Mostrar/Ocultar Cabeceras de categoría
                document.querySelectorAll('.categoria-header').forEach(header => {
                    const tipo = header.getAttribute('data-tipo');
                    header.style.display = (filtroActivo && !categoriasIncompletas.has(tipo)) ? 'none' : 'block';
                });
            }

            async function procesarFoto(input) {
                const file = input.files && input.files[0];
                if (!file || !celdaActiva) {
                    input.value = "";
                    return;
                }
                const cell = celdaActiva;
                const uploadZone = cell.querySelector('.upload-zone');
                const prevHTML = uploadZone ? uploadZone.innerHTML : "";
                if (uploadZone) {
                    uploadZone.innerHTML = '<div style="color:#007934; font-weight:bold; font-size:13px; padding:10px;">⏳ Optimizando imagen...</div>';
                }

                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const fotoComp = await comprimirImagen(e.target.result, 800, 0.65);
                        abrirEditor(cell, fotoComp, "");
                    } catch (err) {
                        console.error("Error al procesar imagen:", err);
                        alert("Error al procesar la imagen.");
                        if (uploadZone) uploadZone.innerHTML = prevHTML;
                    } finally {
                        input.value = "";
                        celdaActiva = null;
                    }
                };
                reader.onerror = () => {
                    alert("Error al leer el archivo de imagen.");
                    if (uploadZone) uploadZone.innerHTML = prevHTML;
                    input.value = "";
                    celdaActiva = null;
                };
                reader.readAsDataURL(file);
            }

            function abrirEditor(cell, foto, texto) {
                cell.querySelector('.upload-zone').style.display = 'none';
                cell.querySelector('.subsanacion-view').style.display = 'none';
                const editZone = cell.querySelector('.subsanacion-edit');
                editZone.querySelector('.img-preview').innerHTML = \`
                    <div class="img-container" style="cursor:pointer; position:relative;" onclick="abrirSelectorFoto(this.closest('.cell'))" title="Toca para cambiar la imagen">
                        <img src="\${foto}">
                        <div class="overlay-msg">Toca para cambiar (Cámara o Galería)</div>
                    </div>\`;
                editZone.querySelector('textarea').value = texto;
                editZone.style.display = 'block';
            }

            function finalizarEdicion(btn) {
                const fila = btn.closest('.fila-desviacion');
                const cell = btn.closest('.cell');
                const foto = cell.querySelector('.img-preview img').src;
                const texto = cell.querySelector('textarea').value;
                const viewZone = cell.querySelector('.subsanacion-view');
                
                viewZone.innerHTML = \`
                    <div class="img-container"><img src="\${foto}"></div>
                    <div class="info-row" style="display:flex; align-items:center; justify-content: flex-start; gap: 4px;">
                        <span class="label" style="width: auto; margin-right: 0;">Acción:</span>
                        <button onclick="editarExistente(this)" title="Modificar" style="background:none; border:none; cursor:pointer; font-size:14px; padding:0; display:inline-flex; vertical-align:middle;">✏️</button>
                    </div>
                    <div class="texto-subsanado">\${texto}</div>\`;
                
                cell.querySelector('.subsanacion-edit').style.display = 'none';
                viewZone.style.display = 'block';
                fila.setAttribute('data-corregida', 'true');
                actualizarResumen();
            }

            function editarExistente(btn) {
                const cell = btn.closest('.cell');
                const foto = cell.querySelector('.subsanacion-view img').src;
                const texto = cell.querySelector('.texto-subsanado').innerText;
                abrirEditor(cell, foto, texto);
            }

            function comprimirImagen(base64, maxDim = 800, calidad = 0.65) {
                return new Promise(res => {
                    const img = new Image(); 
                    img.src = base64;
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = "#FFFFFF"; 
                        ctx.fillRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);
                        res(canvas.toDataURL('image/jpeg', calidad));
                    };
                    img.onerror = () => res(base64);
                });
            }

            function descargarVersionEditable() {
                const modal = document.getElementById('modal-origen-foto');
                if (modal) modal.style.display = 'none';
                celdaActiva = null;

                const tituloCompleto = document.querySelector('.header-title').innerText;
                const partes = tituloCompleto.split(' - ');
                const partePrincipal = partes[0] + ' - ' + partes[1];
                const hoy = new Date();
                const fechaCorr = hoy.getFullYear() + String(hoy.getMonth() + 1).padStart(2, '0') + String(hoy.getDate()).padStart(2, '0');
                
                const contenido = '<!DOCTYPE html><html>' + document.documentElement.innerHTML + '</html>';
                const blob = new Blob([contenido], { type: "text/html" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = \`\${partePrincipal} - Corregido \${fechaCorr}.html\`;
                a.click();
            }

            window.onload = () => {
                // Detectar si hay filas ya corregidas al cargar para poner el atributo data-corregida
                document.querySelectorAll('.fila-desviacion').forEach(fila => {
                    if(fila.querySelector('.subsanacion-view').style.display !== 'none') {
                        fila.setAttribute('data-corregida', 'true');
                    }
                });
                actualizarResumen();
            };
        </script>
    </body></html>`;

    const filename = `${codigoFecha}_Informe_OL_${nombreSeccion.replace(/\s+/g, '_')}.html`;
    const blob = new Blob([html], { type: "text/html" });
    if (!opciones.soloBlob) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    }
    return { blob, filename };
}
