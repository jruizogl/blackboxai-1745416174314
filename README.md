# Sistema de Gestión de Licencias Microsoft

Sistema completo para gestionar licencias de Microsoft Office 365 con interfaz web moderna, visualización de datos y almacenamiento en Supabase.

## 📋 Características

- 🔑 Gestión integral de licencias de Microsoft Office 365
- 👤 Seguimiento detallado de asignaciones y usuarios
- 📊 Dashboard visual con estadísticas clave
- 📝 Gestión de catálogos (Áreas, Ubicaciones, Bodegas, Puestos)
- 🔍 Búsqueda y filtrado avanzado
- 📱 Diseño responsivo para todos los dispositivos
- 🔄 Sincronización en tiempo real con Supabase
- 📈 Vista detallada con todos los campos requeridos

## 🛠️ Estructura del Sistema

El sistema consta de tres vistas principales:

1. **Dashboard Principal** (index.html)
   - Vista general con estadísticas y datos básicos
   - Gráficos de distribución de licencias

2. **Vista Detallada** (detailed-view.html)
   - Tabla completa con todos los campos solicitados
   - Filtros avanzados por área, ubicación, bodega, etc.
   - Gestión completa de licencias

3. **Gestión de Catálogos** (catalogs.html)
   - Administración de Áreas
   - Administración de Ubicaciones
   - Administración de Bodegas
   - Administración de Puestos

## 📋 Campos de Licencia Incluidos

- Nombre Completo
- Correo/usuario
- Status
- Cuenta
- Puesto
- Área
- Ubicación
- Bodega
- Tipo de Licencia
- Fecha de Renovación
- Costo Mensual
- Notas

## 🔧 Tecnologías Utilizadas

- **Frontend:** HTML, JavaScript moderno, Tailwind CSS
- **Almacenamiento:** Supabase (PostgreSQL)
- **Gráficos:** Chart.js
- **Estilos:** Google Fonts (Inter), Font Awesome para iconos

## 🚀 Configuración

1. **Base de Datos Supabase**
   - Ejecuta el script `crear_tabla.sql` en tu proyecto Supabase
   - Este script creará todas las tablas necesarias y datos de ejemplo

2. **Configuración de Credenciales**
   - Las credenciales ya están configuradas en `config.js` con tu URL y clave API de Supabase

## 📱 Uso del Sistema

1. **Inicio**
   - Abre `index.html` para ver el dashboard principal
   - Navega entre las diferentes vistas usando el menú superior

2. **Gestión de Licencias**
   - Agrega licencias con el botón "Nueva Licencia"
   - Edita licencias existentes haciendo clic en el icono de edición
   - Elimina licencias con el icono de papelera
   - Usa el campo de búsqueda para filtrar licencias

3. **Gestión de Catálogos**
   - Visita la página "Catálogos" para gestionar áreas, ubicaciones, bodegas y puestos
   - Agrega nuevos elementos con el botón "+" en cada sección
   - Edita y elimina elementos según sea necesario

## 🌐 Despliegue

El sistema está listo para ser desplegado en Vercel o cualquier otro servicio de hosting estático:

1. Sube los archivos a un repositorio Git
2. Conecta el repositorio con Vercel
3. Configura las variables de entorno con tus credenciales de Supabase
4. ¡Listo! Tu sistema estará disponible en línea

Consulta `guia-despliegue.md` para instrucciones detalladas de despliegue.

## 🔒 Seguridad

- Los datos se almacenan de forma segura en Supabase
- El sistema funciona con Row Level Security (RLS)
- Las conexiones a la API de Supabase son seguras mediante HTTPS

## 🔄 Modo Demo

Si no hay conexión a Supabase, el sistema cambiará automáticamente a modo demo, almacenando los datos en localStorage del navegador para permitir pruebas sin conexión.
