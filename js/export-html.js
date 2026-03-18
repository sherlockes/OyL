// 1. COMPRESIÓN DE IMÁGENES
// Busca esta función al principio del archivo js/export-html.js
function comprimirBase64(base64Str, calidad = 0.85) { // Subimos calidad a 0.85
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 1600; // Antes 800, ahora 1600 para alta definición
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Generamos un JPEG de alta calidad
            resolve(canvas.toDataURL('image/jpeg', calidad));
        };
        img.onerror = () => resolve(base64Str);
    });
}

// 2. GENERACIÓN DEL INFORME
async function generarHTML(desviaciones, seccionId) {
    const fecha = new Date();
    const codigoFecha = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const totalGlobal = desviaciones.length;
    let nombreSeccion = (seccionId && !seccionId.toLowerCase().includes("informe")) ? seccionId : "GENERAL";

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
            .header-title { font-size: 20px; font-weight: bold; border-bottom: 2px solid rgb(200, 230, 201); padding-bottom: 5px; margin-bottom: 10px; }
            .resumen-box { background: rgb(245, 245, 245); padding: 15px; border-radius: 4px; margin-bottom: 25px; border: 1px solid #eee; }
            .resumen-box h2 { font-size: 14px; margin-top: 0; color: #555; text-decoration: underline; margin-bottom: 8px; }
            .resumen-list { display: grid; grid-template-columns: 1fr 1fr; list-style: none; padding: 0; font-size: 13px; margin: 0; }
            .resumen-list li::before { content: "• "; color: #666; }
            .cont-corr { color: #2e7d32; font-weight: bold; margin-left: 5px; }
            .categoria-header { background: rgb(200, 230, 201); padding: 6px 12px; font-weight: bold; margin-top: 25px; border: 1px solid #ccc; border-bottom: none; font-size: 14px; }
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
            .overlay-msg { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.6); color:white; padding:5px 10px; border-radius:4px; font-size:11px; pointer-events:none; }
            
            @media print { .no-print, .controls-container, .btn-edit, .btn-add, .overlay-msg, input { display: none !important; } }
        </style>
    </head>
    <body>
        <div class="header-title">${codigoFecha} - Informe de O&L de ${nombreSeccion.toUpperCase()} - ${totalGlobal} desviaciones</div>
        <div class="resumen-box">
            <h2>RESUMEN DE HALLAZGOS Y CORRECCIONES:</h2>
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
                        <button class="btn-add" onclick="this.nextElementSibling.click()">➕ AÑADIR SUBSANACIÓN</button>
                        <input type="file" accept="image/*" style="display:none;" onchange="procesarFoto(this)">
                    </div>
                </div>
            </div>`;
        }
    }

    html += `
        </div>
        <script>
            let filtroActivo = false;

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
                const file = input.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const cell = input.closest('.cell');
                    const fotoComp = await comprimirImagen(e.target.result);
                    abrirEditor(cell, fotoComp, "");
                    input.value = "";
                };
                reader.readAsDataURL(file);
            }

            function abrirEditor(cell, foto, texto) {
                cell.querySelector('.upload-zone').style.display = 'none';
                cell.querySelector('.subsanacion-view').style.display = 'none';
                const editZone = cell.querySelector('.subsanacion-edit');
                editZone.querySelector('.img-preview').innerHTML = \`
                    <div class="img-container" style="cursor:pointer; position:relative;" onclick="this.closest('.cell').querySelector('input[type=file]').click()">
                        <img src="\${foto}">
                        <div class="overlay-msg">Click para cambiar imagen</div>
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
                    <div class="info-row"><span class="label">Acción:</span></div>
                    <div class="texto-subsanado">\${texto}</div>
                    <button class="btn-edit" onclick="editarExistente(this)">✏️ Modificar</button>\`;
                
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

            function comprimirImagen(base64) {
                return new Promise(res => {
                    const img = new Image(); img.src = base64;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const MAX_WIDTH = 1200; // Calidad de sobra para la columna de subsanación
                        canvas.width = MAX_WIDTH; 
                        canvas.height = (MAX_WIDTH * img.height) / img.width;
                        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0,0,canvas.width,canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        res(canvas.toDataURL('image/jpeg', 0.8)); // Calidad 80%
                    }
                });
            }

            function descargarVersionEditable() {
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

    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${codigoFecha}_Informe_OL_${nombreSeccion.replace(/\s+/g, '_')}.html`;
    a.click();
}
