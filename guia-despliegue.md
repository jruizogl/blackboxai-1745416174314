# Guía de Despliegue: Sistema de Gestión de Licencias Microsoft

Esta guía te ayudará a configurar el sistema en Supabase y desplegarlo en Vercel.

## Paso 1: Configurar Supabase

1. **Crear una cuenta en Supabase**:
   - Ve a [https://supabase.com](https://supabase.com) y regístrate o inicia sesión
   - Crea un nuevo proyecto con el nombre "microsoft-licenses" o el que prefieras

2. **Configurar la base de datos**:
   - Ve a la sección "SQL Editor" en Supabase (https://yoggndevscherwfxmijg.supabase.co)
   - Copia y pega el contenido del archivo `crear_tabla.sql` (incluido en este proyecto)
   - Haz clic en "Run" o "Ejecutar" para crear la tabla `ms_licenses` y los datos de ejemplo
   - Esto creará la estructura necesaria y añadirá algunos datos de muestra

3. **Obtener las credenciales de API**:
   - Ve a "Settings" > "API" en tu proyecto de Supabase
   - Copia la "URL" y la "anon/public key"

4. **Actualizar las credenciales en el proyecto**:
   - Opción 1 - Editar el archivo `config.js`:
     ```javascript
     // Busca esta sección en config.js y actualiza las credenciales
     return {
         supabaseUrl: window.SUPABASE_URL || 'tu-url-de-supabase',
         supabaseKey: window.SUPABASE_KEY || 'tu-clave-anon-public',
         // ...otros valores
     };
     ```
   
   - Opción 2 - Usar variables de entorno en Vercel (recomendado):
     * No modifiques nada en el código
     * Configura las variables directamente en Vercel (explicado más adelante)

## Paso 2: Desplegar en Vercel

1. **Crear repositorio Git**:
   - Crea un nuevo repositorio en GitHub, GitLab o BitBucket
   - Sube todos los archivos del proyecto a tu repositorio

2. **Preparar el proyecto para Vercel**:
   - Crea un archivo `vercel.json` (ya incluido en este proyecto) que configura la aplicación como sitio estático

3. **Crear cuenta en Vercel**:
   - Ve a [https://vercel.com](https://vercel.com) y regístrate o inicia sesión
   - Conecta tu cuenta con el proveedor de Git (GitHub, GitLab o BitBucket)

4. **Importar proyecto**:
   - En el dashboard de Vercel, haz clic en "Import Project"
   - Selecciona tu repositorio Git con el proyecto
   - En la configuración del proyecto:
     - Framework Preset: Selecciona "Other"
     - Root Directory: Deja en blanco si el proyecto está en la raíz del repositorio
     - Build Command: Deja en blanco (no se requiere compilación)
     - Output Directory: Deja en blanco (la raíz)

5. **Desplegar**:
   - Haz clic en "Deploy"
   - Vercel desplegará automáticamente tu aplicación

6. **Configurar variables de entorno** (recomendado):
   - Ve a "Settings" > "Environment Variables" en tu proyecto de Vercel
   - Agrega las siguientes variables con los valores de tu proyecto Supabase:
     
     | Nombre | Valor | Entornos |
     |--------|-------|----------|
     | `SUPABASE_URL` | `https://tu-proyecto.supabase.co` | Production, Preview, Development |
     | `SUPABASE_KEY` | `tu-clave-anon-public` | Production, Preview, Development |
   
   - Estas variables serán automáticamente cargadas por el archivo `config.js` incluido
   - Haz clic en "Save" para guardar las variables
   
   ![Configuración de variables de entorno en Vercel](https://i.imgur.com/XYZ123.png)

## Paso 3: Configuración avanzada (opcional)

### Dominio personalizado
1. Ve a la configuración de tu proyecto en Vercel
2. Selecciona "Domains"
3. Agrega tu dominio personalizado siguiendo las instrucciones

### Configuración de RLS en Supabase
Si deseas agregar autenticación:
1. Ve a "Authentication" > "Providers" en Supabase
2. Habilita los métodos de autenticación deseados (email, Google, etc.)
3. Modifica las políticas RLS en Supabase para proteger tus datos
4. Actualiza el código para incluir autenticación

## Estructura de archivos para Vercel

```
/
├── index.html           # Página principal 
├── script.js            # Lógica principal
├── vercel.json          # Configuración para Vercel
├── setup.sql            # Script SQL para Supabase
└── README.md            # Documentación
```

## Soporte

Si necesitas ayuda adicional:
- Visita la [documentación de Supabase](https://supabase.com/docs)
- Consulta la [documentación de Vercel](https://vercel.com/docs)
