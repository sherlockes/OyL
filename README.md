# 📋 Sistema de Informe de Desviaciones O&L

Una aplicación web ligera y funcional diseñada para la captura de desviaciones en campo, generación de informes técnicos en HTML para responsables y exportación final en PDF. 

Optimizada para uso en dispositivos móviles con captura directa de cámara y gestión de versiones para evitar problemas de caché.

## ✨ Características principalas

-   **Captura en movilidad**: Interfaz responsive optimizada para smartphones.
-   **Gestión de imágenes**: Compresión automática de fotos para equilibrar calidad y peso del archivo.
-   **Persistencia local**: Los datos no se pierden al cerrar el navegador (uso de LocalStorage).
-   **Exportación dual**:
    -   **HTML**: Formato interactivo para que los responsables marquen subsanaciones.
    -   **PDF**: Formato cerrado y profesional para archivo final.
-   **Carga inteligente**: Sistema de *Cache Busting* que asegura que el móvil siempre cargue la última versión del código.

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
├── index.html          # Interfaz principal y lógica de la App
├── css/
│   └── style.css       # Estilos y diseño responsive
├── js/
│   ├── export-html.js  # Lógica de generación de informe HTML
│   └── export-pdf.js   # Lógica de generación de PDF (jsPDF)
└── README.md           # Documentación
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
