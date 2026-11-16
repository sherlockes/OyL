# 📋 Sistema de Informe de Desviaciones de Orden y Limpieza (O&L) v2.0

[![Versión](https://img.shields.io/badge/Versi%C3%B3n-2.0-007934.svg)](README.md)
[![Privacidad](https://img.shields.io/badge/Privacidad-100%25%20Offline--First-blue.svg)](README.md)
[![Almacenamiento](https://img.shields.io/badge/Motor-LocalForage%20(IndexedDB)-orange.svg)](README.md)
[![Exportaci%C3%B3n](https://img.shields.io/badge/Formatos-HTML%20%7C%20PDF%20%7C%20DOCX%20%7C%20ZIP-green.svg)](README.md)

Una aplicación web progresiva, ligera y completamente autónoma diseñada para la captura de desviaciones en campo durante **auditorías de Orden y Limpieza (5S)**, seguridad industrial e inspecciones técnicas. 

Permite registrar hallazgos con fotografías comprimidas al vuelo, coordenadas GPS, clasificación normalizada y generar informes técnicos en múltiples formatos (**HTML interactivo para subsanación, PDF formal para dirección, DOCX para edición y paquete ZIP completo**), todo ejecutado en el cliente sin depender de servidores en la nube.

---

## 📑 Tabla de Contenidos

1. [✨ Características Principales](#-características-principales)
2. [📖 Guía de Usuario: Cómo Realizar una Auditoría O&L](#-guía-de-usuario-cómo-realizar-una-auditoría-ol)
   - [Paso 1: Preparación y Selección de Sección](#1-preparación-y-selección-de-sección)
   - [Paso 2: Captura de Desviaciones en Campo](#2-captura-de-desviaciones-en-campo)
   - [Paso 3: Revisión, Edición y Visor de Fotos](#3-revisión-edición-y-visor-de-fotos)
   - [Paso 4: Generación y Exportación de Informes](#4-generación-y-exportación-de-informes)
3. [🤝 Trabajo Colaborativo y Gestión de Datos](#-trabajo-colaborativo-y-gestión-de-datos)
   - [Exportación e Importación de Secciones (.json)](#exportación-e-importación-de-secciones-json)
   - [Fusión de Auditorías ("Añadir a esta sección")](#fusión-de-auditorías-añadir-a-esta-sección)
   - [Compartir Directamente desde el Smartphone](#compartir-directamente-desde-el-smartphone)
   - [Control de Memoria LocalForage (50 MB)](#control-de-memoria-localforage-50-mb)
4. [🏷️ Categorías Técnicas y Nube de Sugerencias](#️-categorías-técnicas-y-nube-de-sugerencias)
5. [📄 Formatos de Informes Generados](#-formatos-de-informes-generados)
6. [💡 Buenas Prácticas para el Inspector](#-buenas-prácticas-para-el-inspector)
7. [🚀 Instalación y Servidor de Desarrollo](#-instalación-y-servidor-de-desarrollo)
8. [📁 Estructura del Proyecto](#-estructura-del-proyecto)
9. [🛠️ Tecnologías y Librerías Utilizadas](#️-tecnologías-y-librerías-utilizadas)

---

## ✨ Características Principales

- 📱 **Diseño Móvil & Tablet**: Optimizado para su uso en campo con smartphones y tablets, con acceso rápido a la cámara frontal/trasera (`capture="environment"`).
- 🗂️ **Gestión Dinámica de Secciones**: Organización de auditorías por zonas (Almacén, Taller, Línea 1, etc.) con soporte para nombres con espacios, tildes y caracteres en español. Permite renombrar y cambiar de área al vuelo.
- 📸 **Optimización Automática de Fotos**: Redimensionamiento a 500 px y compresión JPEG (calidad 0.6) mediante HTML5 Canvas API. Reduce imágenes de 5-10 MB a tan solo 40-70 KB sin pérdida de nitidez visual en los informes.
- 🖼️ **Previsualización y Lightbox**: Vista previa en el propio formulario antes de guardar y visor a pantalla completa con fondo difuminado al tocar cualquier miniatura en el listado.
- 🏷️ **Nube de Sugerencias Inteligente**: Modal con etiquetas rápidas clasificadas por categoría para autocompletar el tipo de desviación con un solo toque.
- 📍 **Geolocalización GPS Satelital**: Captura automática de coordenadas con indicador visual de estado (`🌎` con posición fijada, `🚫` sin señal GPS).
- 💾 **Persistencia Avanzada con LocalForage (IndexedDB)**: Supera las limitaciones de 5 MB de LocalStorage ofreciendo una cuota de hasta 50 MB en el dispositivo con monitor de uso en tiempo real y limpieza automática de claves residuales.
- 📑 **Exportación Cuádruple**:
  - **HTML**: Interactivo, responsive, con casillas de verificación para marcar subsanaciones, fechas y responsables, y estilos para imprimir.
  - **PDF**: Documento formal de alta calidad generado con `jsPDF`, portada corporativa con logotipos, resultado de auditoría, resumen ejecutivo y fichas técnicas a 2 columnas.
  - **DOCX**: Documento nativo de Microsoft Word generado en el cliente con `docx.js`, completamente editable con el mismo diseño que el PDF.
  - **ZIP**: Empaquetado instantáneo con `JSZip` de los tres formatos en un solo archivo descargable con código cronológico homogéneo (`YYYYMM_Informes_OL_<Seccion>.zip`).
- 🤝 **Fusión Colaborativa**: Múltiples inspectores pueden auditar simultáneamente diferentes zonas y luego fusionar sus hallazgos en un único informe consolidado sin sobrescribir datos.
- 📲 **Compartir Nativo**: Integración con la Web Share API en dispositivos móviles para enviar los datos por WhatsApp, Telegram, correo o Drive en formato compatible `.txt`.
- 🔒 **100% Privado y Offline-First**: No se transmiten datos ni imágenes a servidores de terceros. Todo el procesamiento y almacenamiento se realiza en el propio navegador del usuario.
- ⚡ **Cache Busting Automático**: Inyección dinámica de scripts y hojas de estilo con timestamp para garantizar que los navegadores móviles ejecuten siempre la versión más reciente.

---

## 📖 Guía de Usuario: Cómo Realizar una Auditoría O&L

### 1. Preparación y Selección de Sección
1. **Seleccionar el Área**: Escoge una sección existente en el menú desplegable superior.
2. **Crear una Nueva Área**: Pulsa el botón **"Nueva sección"**, introduce el nombre descriptivo (ej: *Planta Embalaje - Línea 2*) y pulsa Aceptar.
3. **Renombrar Sección**: Si necesitas ajustar el nombre del área activa, pulsa **"Renombrar Sección"**, introduce el nuevo título y confirma. Tus desviaciones se mantendrán intactas.
4. **Verificar Almacenamiento**: Comprueba la barra de memoria en la sección de *Ajustes Avanzados*. Si está en zona naranja o roja (>80%), exporta tus auditorías antiguas y bórralas de la aplicación.

### 2. Captura de Desviaciones en Campo
1. **Fotografía**: Pulsa sobre el selector de foto o icono de cámara. Al tomarla o seleccionarla:
   - La aplicación la procesa y comprime en segundos.
   - Aparecerá una **previsualización en miniatura**.
   - Puedes tocar la miniatura para ampliarla o pulsar **"🗑️ Quitar"** si deseas repetir la toma.
2. **Categoría / Tipo**:
   - Despliega el selector y elige una de las 9 categorías oficiales.
   - O pulsa el botón **"🏷️ Sugerencias"** para abrir la nube de anomalías comunes y seleccionar la adecuada con un solo toque.
3. **Descripción**: Redacta una explicación concisa y específica del problema detectado (ej: *"Fuga de aceite hidráulico bajo bancada principal"* o *"Caja eléctrica con tapa abierta y cables expuestos"*).
4. **Ubicación**: Detalla la referencia física o máquina (ej: *"Pilar 14 - Frente a Torno 2"*).
5. **GPS**: Si tu dispositivo tiene el GPS activo y has concedido permisos, la posición se registrará en segundo plano.
6. **Guardar**: Pulsa **"Añadir desviación"**. El contador del encabezado se actualizará automáticamente.

### 3. Revisión, Edición y Visor de Fotos
- **Listado Dinámico**: Los hallazgos aparecen en orden cronológico inverso (lo último registrado arriba).
- **Visor Lightbox**: Toca la miniatura de cualquier desviación en la lista para ver la fotografía a gran tamaño con fondo difuminado. Pulsa la `×`, haz clic fuera o presiona `Escape` para cerrar.
- **Editar Hallazgo**: Pulsa el botón **"Editar"** en una fila. El formulario recuperará los datos y la foto existente, y la pantalla subirá de forma suave para facilitar la edición. Pulsa **"Guardar cambios"** o **"Cancelar edición"**.
- **Borrar Hallazgo**: Pulsa **"Borrar"** y confirma en el aviso emergente para eliminarlo de la base de datos.

### 4. Generación y Exportación de Informes
Una vez concluida la inspección en planta:
1. Pulsa sobre el botón del formato deseado (**🌐 HTML**, **📕 PDF**, **📝 DOCX** o **📦 Exportar todos (.zip)**).
2. Se te solicitarán dos datos clave:
   - **Fecha del informe**: Por defecto sugiere el mes y año en curso (ej: *Noviembre 2026*), con opción de edición manual.
   - **Resultado de la auditoría**: Valoración o nota global (ej: *85%*, *FAVORABLE*, *Con observaciones* o *Acción inmediata requerida*).
3. El archivo se generará en pocos segundos directamente en tu navegador y se iniciará la descarga.

---

## 🤝 Trabajo Colaborativo y Gestión de Datos

La aplicación incluye un potente módulo en **Ajustes Avanzados** pensado para auditorías conjuntas y seguridad de la información:

### Exportación e Importación de Secciones (.json)
- **📤 Exportar**: Descarga un archivo estructurado `.json` con todas las desviaciones, fotos y coordenadas de la sección actual. Guárdalo como respaldo o envíalo a tu ordenador.
- **📥 Importar**: Permite cargar un archivo `.json` de otra sección. Para proteger tu trabajo, **el sistema bloquea la importación si ya existe una sección con el mismo nombre**, evitando sobrescrituras involuntarias.

### Fusión de Auditorías ("Añadir a esta sección")
Cuando un equipo de dos o más inspectores audita a la vez diferentes naves o líneas:
1. Cada auditor registra sus hallazgos en su propio dispositivo móvil.
2. Cada auditor pulsa **"📤 Exportar"** o **"📲 Compartir"** para enviar su archivo a un coordinador.
3. El coordinador abre su aplicación y pulsa **"➕ Añadir a esta sección"**.
4. Selecciona el archivo recibido y un menú modal le permite elegir:
   - Sumar los hallazgos a la sección actual.
   - Sumarlos a otra sección existente.
   - O crear automáticamente una sección nueva combinada.
5. El informe final contendrá la suma de todos los hallazgos sin duplicidades ni pérdidas.

### Compartir Directamente desde el Smartphone
En teléfonos móviles aparece el botón verde **"📲 Compartir sección"**:
- Utiliza la API nativa de Android/iOS para abrir el diálogo del sistema (WhatsApp, Telegram, Gmail, Bluetooth, Drive...).
- **Compatibilidad con Chromium**: Debido a que los navegadores móviles bloquean el envío de archivos `.json` por motivos de seguridad del sistema operativo, la app exporta automáticamente en formato de texto `.txt` (`text/plain`), permitiendo compartir sin restricciones.

### Control de Memoria LocalForage (50 MB)
- Motor basado en **IndexedDB** con capacidad configurada de hasta 50 MB (equivalente a cientos de fotografías comprimidas).
- Barra de estado con tres rangos cromáticos:
  - 🔵 **Azul (<50%)**: Espacio holgado.
  - 🟠 **Naranja (50%-80%)**: Recomendable exportar secciones cerradas.
  - 🔴 **Rojo (>80%)**: Alerta de capacidad; exportar y eliminar secciones antiguas.
- El sistema cuenta con **limpieza automática de claves huérfanas**: cualquier residuo de secciones borradas se purga al calcular la memoria.

---

## 🏷️ Categorías Técnicas y Nube de Sugerencias

Las 9 categorías normalizadas y sus etiquetas rápidas integradas en `tags.json`:

| Categoría | Descripción y Etiquetas de Sugerencia Frecuentes |
| :--- | :--- |
| **📦 Almacenamiento** | Señalización de pasillos, Carga descompensada, Estanterías dañadas o sin fijar. |
| **🧪 Productos químicos** | Fichas de seguridad ausentes, Cubetos de retención sucios/llenos, Duchas lavaojos tapadas. |
| **🚰 Mangueras** | Falta de soporte mural, Fugas de aire o agua, Deformaciones y aplastamientos. |
| **🔧 Herramientas** | Bancos de trabajo desordenados, Herramientas sin recoger tras turno, Útiles deteriorados. |
| **⚙️ Equipos e instalaciones** | Fugas de fluidos, Protecciones mecánicas ausentes, Cuadros eléctricos abiertos. |
| **🦺 Elementos de seguridad y EPI's** | EPIs dañados, No uso de protección obligatoria, Extintores y mangueras bloqueados. |
| **🚶 Zonas de paso y comunes** | Obstáculos en vías de evacuación, Suelo resbaladizo con grasa/aceite, Chatarra. |
| **📢 Señalización y comunicación** | Cartelería informativa rota, Paneles 5S desactualizados, Marcas viales borradas. |
| **🗑️ Residuos** | Contenedores desbordados, Mezcla indebida de residuos, Falta de identificación. |

---

## 📄 Formatos de Informes Generados

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MATRIZ DE INFORMES O&L v2.0                           │
├───────────────┬──────────────────────────────┬──────────────────────────────┤
│ Formato       │ Destinatario Ideal           │ Características Clave        │
├───────────────┼──────────────────────────────┼──────────────────────────────┤
│ 🌐 HTML       │ Mandos intermedios y Jefes   │ Interactivo, checkboxes de   │
│               │ de Área                      │ subsanación, fotos zoom,     │
│               │                              │ listo para imprimir.         │
├───────────────┼──────────────────────────────┼──────────────────────────────┤
│ 📕 PDF        │ Dirección, Gerencia y        │ Documento formal cerrado,    │
│               │ Comités de Seguridad         │ portada corporativa, resumen │
│               │                              │ ejecutivo, fichas 2 columnas.│
├───────────────┼──────────────────────────────┼──────────────────────────────┤
│ 📝 DOCX       │ Auditores y Redactores       │ Microsoft Word editable,     │
│               │ Técnicos                     │ portada, tablas idénticas al │
│               │                              │ PDF para personalizar texto. │
├───────────────┼──────────────────────────────┼──────────────────────────────┤
│ 📦 ZIP        │ Archivo Técnico e Histórico  │ Agrupa PDF + DOCX + HTML en  │
│               │                              │ una descarga única con fecha │
│               │                              │ normalizada (YYYYMM).        │
└───────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

## 💡 Buenas Prácticas para el Inspector

1. **Fotografías con contexto**: Toma la foto a una distancia suficiente para que se aprecie tanto el defecto como la máquina o estantería que lo rodea.
2. **Ubicaciones precisas**: Añade referencias inequívocas (número de máquina, columna, pasillo) para que el operario localice el punto sin pérdida de tiempo.
3. **Gestión de subsanaciones en HTML**: Facilita el archivo HTML a los responsables para que ellos mismos marquen las casillas digitales al resolver cada desviación.
4. **Respaldos regulares**: Antes de inspecciones muy largas o al final de cada jornada de auditoría, pulsa **"📤 Exportar"** para guardar una copia de seguridad en tu dispositivo.
5. **Cierre de modales con Escape**: Puedes cerrar en cualquier momento la guía de ayuda, el visor de fotos ampliadas y la nube de sugerencias pulsando la tecla `Esc` en el teclado o tocando fuera del modal.

---

## 🚀 Instalación y Servidor de Desarrollo

Debido a las políticas de seguridad de los navegadores (CORS) para módulos JavaScript y lecturas de archivos locales, la web debe servirse a través de un servidor HTTP local.

### 1. Servidor de desarrollo integrado (Python)
El proyecto incluye un servidor especializado en `servidor.py` con:
- Detección automática de la IP privada en redes **ZeroTier** para conectarte desde tu smartphone en red local.
- Cabeceras `No-Cache` para evitar que el navegador móvil almacene archivos en caché durante el desarrollo.
- Temporizador automático de 2 horas para liberar recursos del sistema.

Ejecución directa:
```bash
python3 servidor.py 8080
```

O a través del script de control en segundo plano:
```bash
./servidor_dev.sh start    # Inicia el servidor
./servidor_dev.sh status   # Consulta el estado y muestra las IPs de acceso
./servidor_dev.sh log      # Muestra los logs en tiempo real
./servidor_dev.sh stop     # Detiene el servidor
```

### 2. Acceso desde el móvil
Una vez iniciado el servidor, abre el navegador en tu teléfono y accede a:
- En la misma red ZeroTier / LAN: `http://<TU_IP_ZEROTIER>:8080`
- En el propio equipo: `http://localhost:8080`

### 3. Despliegue en Producción
La aplicación es 100% estática. Para producción puede alojarse sin costes en:
- **GitHub Pages**
- **Vercel**
- Cualquier servidor web estático (Nginx, Apache, Caddy, Cloudflare Pages).

---

## 📁 Estructura del Proyecto

```text
oyl/
├── OyL/
│   ├── index.html          # Interfaz principal de la aplicación y modales
│   ├── tags.json           # Configuración de categorías y nube de sugerencias
│   ├── README.md           # Guía de usuario y documentación técnica (este archivo)
│   ├── images/
│   │   ├── logo.jpg        # Logotipo corporativo para encabezados de informe
│   │   └── portada.jpg     # Imagen corporativa para carátulas PDF y DOCX
│   ├── css/
│   │   └── style.css       # Estilos responsive, tarjetas, modales y guía
│   └── js/
│       ├── export-html.js  # Motor de generación de informe interactivo HTML
│       ├── export-pdf.js   # Motor de generación de PDF mediante jsPDF
│       ├── export-docx.js  # Motor de generación de Word mediante docx.js
│       └── jszip.min.js    # Librería local JSZip para empaquetado ZIP
├── servidor.py             # Servidor Python de desarrollo con ZeroTier y no-cache
└── servidor_dev.sh         # Script bash de control del servidor (start/stop/status)
```

---

## 🛠️ Tecnologías y Librerías Utilizadas

- **HTML5 & CSS3**: Diseño responsive con Flexbox, CSS Grid y Media Queries adaptadas a móviles y tablets.
- **JavaScript (Vanilla ECMAScript moderno)**: Lógica rápida y sin frameworks pesados.
- **LocalForage (1.10.0)**: Capa de almacenamiento IndexedDB asíncrona y transparente para superar el límite de 5 MB de localStorage.
- **jsPDF (2.5.1)**: Generación de documentos PDF completos en el navegador del cliente.
- **docx.js (7.1.0)**: Construcción programática de documentos Microsoft Word `.docx`.
- **JSZip (3.10.1)**: Compresión y empaquetado de archivos en formato `.zip`.
- **FileSaver.js (2.0.5)**: Gestión fluida de descargas de blobs en todos los navegadores.
- **HTML5 Canvas API**: Procesado, reescalado y compresión adaptativa de fotografías en tiempo real.
- **Web Share API**: Integración con las opciones nativas de compartir del sistema operativo móvil.
