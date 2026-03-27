# 📋 Sistema de Informe de Desviaciones O&L

Una aplicación web ligera y funcional diseñada para la captura de desviaciones en campo, generación de informes técnicos en HTML para responsables y exportación final en PDF. 

Optimizada para uso en dispositivos móviles con captura directa de cámara y gestión de versiones para evitar problemas de caché.

## ✨ Características principales

- 📱 **Captura en movilidad**: Interfaz *responsive* optimizada para smartphones y tablets.
- 🗂️ **Gestión por Secciones**: Organización de hallazgos por áreas (ej. Almacén, Taller, Oficinas) con capacidad de crear y renombrar secciones al vuelo.
- 📸 **Optimización de Imágenes**: Redimensionamiento automático (800px) y compresión (calidad 0.6) mediante Canvas API para generar PDFs ligeros.
- 💾 **Persistencia Local**: Los datos se guardan automáticamente en el navegador (`LocalStorage`), permitiendo continuar el trabajo más tarde. Capacidad de exportar e importar secciones individuales en formato JSON para facilitar el intercambio de datos entre dispositivos sin sobrescribir todo el sistema.
- 📊 **Monitor de Almacenamiento**: Barra de progreso en tiempo real para controlar el uso de la cuota de memoria (5MB) del navegador.
- 📄 **Exportación Dual**:
    - **HTML**: Formato interactivo ideal para que los responsables marquen las subsanaciones.
    - **PDF**: Documento profesional y cerrado generado en el cliente mediante jsPDF. Portada automatizada con logotipos corporativos, cálculo de resultados y resumen ejecutivo por categorías.
- ⚡ **Carga Inteligente**: Sistema de *Cache Busting* que garantiza que el dispositivo siempre ejecute la última versión del código.
- 🔒 **Privacidad Total**: Diseño *offline-first*. Los datos y fotografías nunca se suben a servidores externos; la privacidad es absoluta.


## 📖 Guía de Uso: Cómo realizar una Auditoría de O&L

Sigue estos pasos para completar una inspección profesional utilizando la aplicación:

### 1. Preparación de la Inspección
* **Selección del Área:** Elige una sección existente en el menú desplegable o crea una nueva con el botón **"+"**. 
    * *Nota:* Ahora puedes usar nombres con espacios, tildes y eñes (ej: "Planta de Producción - Línea 1").
* **Verificación de Espacio:** Comprueba la barra de almacenamiento en la parte inferior. Si está cerca del 100%, considera exportar y borrar secciones antiguas para liberar espacio.

### 2. Captura de Desviaciones en Campo
* **Añadir Hallazgo:** Pulsa el botón principal para abrir el formulario.
* **Fotografía:** Captura la imagen directamente con la cámara. La app la redimensionará automáticamente para optimizar el peso del informe.
* **Categorización:** Clasifica la desviación (Almacenamiento, Residuos, EPIs, etc.). Esto es vital para el **Resumen Ejecutivo** automático del PDF.
* **Ubicación y Descripción:** Sé específico. Esta información aparecerá alineada y organizada en el informe final.

### 3. Gestión de Datos y Backups
* **Exportación de Sección:** Antes de terminar, puedes pulsar **"Exportar Datos"** en el bloque de "ESTA SECCIÓN". Esto generará un archivo `.json` que puedes enviar por email como copia de seguridad de ese trabajo específico.
* **Importación:** Si necesitas continuar una auditoría empezada por un compañero, usa **"Importar Datos"** y selecciona su archivo `.json`.

### 4. Generación del Informe Final (PDF)
Cuando hayas terminado la inspección, pulsa **"Descargar PDF"**. Se te solicitarán dos datos clave para la portada profesional:
1.  **Fecha del Informe:** Por defecto aparecerá el mes y año actual (ej: *Marzo 2026*), pero puedes editarlo manualmente.
2.  **Resultado de la Auditoría:** Introduce la nota o valoración global (ej: *85%*, *FAVORABLE* o *Pendiente de Acción*).

### 5. Contenido del Documento Generado
El PDF resultante tendrá la siguiente estructura:
* **Portada:** Título corporativo, nombre de la sección, fecha, resultado y número total de desviaciones sobre un fondo verde corporativo e imágenes de marca.
* **Resumen Ejecutivo:** Una tabla resumen con el conteo de hallazgos por cada categoría técnica.
* **Detalle Técnico:** Lista de desviaciones con su foto, ubicación y descripción perfectamente alineadas en celdas de doble columna (una para datos y otra para anotaciones manuales tras la impresión).


## 🚀 Instalación y Uso Local

Para probar o desarrollar la aplicación en tu ordenador, es necesario ejecutarla a través de un servidor local debido a las políticas de seguridad de los navegadores (CORS) al cargar módulos de JavaScript.

### Lanzar servidor con Python

Si tienes Python instalado (Windows, Mac o Linux), sigue estos pasos:

1.  Abre una terminal o CMD.
2.  Navega hasta la carpeta del proyecto:
    ```bash
    cd ruta/de/tu/proyecto
    ```
3.  Ejecuta el servidor:
    -   **Python 3.x:**
        ```bash
        python3 -m http.server 8000
        ```
4.  Abre tu navegador y entra en: `http://localhost:8000`

## 📁 Estructura del Proyecto

```text
├── index.html          # Interfaz principal
├── ai.sh               # Script de contexto para IA
├── ai_context.txt      # Archivo generado para la IA (ignorar en git)
├── logo.jpg            # Logo para informes
├── portada.jpg         # Imagen de carátula PDF
├── css/
│   └── style.css       # Estilos responsive
└── js/
    ├── export-html.js  # Generador de informes HTML
    └── export-pdf.js   # Generador de informes PDF (jsPDF)
```

## 🛠️ Tecnologías utilizadas
HTML5 / CSS3: Diseño mediante Flexbox y Media Queries.

JavaScript (Vanilla): Lógica pura sin dependencias pesadas.

jsPDF: Librería para la generación de documentos PDF en el cliente.

GitHub Pages: Recomendado para el despliegue rápido.

## 📱 Notas para el uso en móvil
Para garantizar que los cambios de estilo o lógica se apliquen en el dispositivo móvil inmediatamente después de un despliegue en GitHub:

La aplicación utiliza un sistema automático que añade un timestamp (?v=YYYYMMDDHHMMSS) a los archivos JS y CSS.

Simplemente refresca la página en el navegador del móvil para forzar la descarga de la nueva versión.

## 🤖 Desarrollo asistido por IA
Este repositorio incluye un script para facilitar el mantenimiento mediante modelos de lenguaje (LLMs):

ai.sh: Ejecuta este script en Linux para generar un archivo ai_context.txt que contiene toda la estructura y código del proyecto listo para ser procesado por una IA.

``` sh
./ai.sh
```
