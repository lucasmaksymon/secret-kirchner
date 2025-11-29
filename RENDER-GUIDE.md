# 🚀 Guía Paso a Paso: Deploy en Render

Esta es la guía completa y detallada para subir **El Secreto de Kirchner** a Render.

---

## 📋 Pre-requisitos

- ✅ Código en GitHub (repositorio público o privado)
- ✅ Cuenta en [render.com](https://render.com) (gratis)

---

## 🎯 Paso 1: Preparar el Código

### 1.1 Verificar que todo esté listo

Los siguientes archivos ya están creados:
- ✅ `Procfile` - Para el backend
- ✅ `render.yaml` - Configuración opcional (puedes usar la UI de Render)
- ✅ `client/scripts/replace-env.js` - Script para variables de entorno

### 1.2 Subir a GitHub

Si aún no has subido tu código:

```bash
# Asegúrate de estar en la raíz del proyecto
git add .
git commit -m "Preparar para deployment en Render"
git push origin main
```

---

## 🎯 Paso 2: Crear Cuenta en Render

1. Ve a [render.com](https://render.com)
2. Click en **"Get Started for Free"**
3. Regístrate con GitHub (recomendado) o email
4. Confirma tu email si es necesario

---

## 🎯 Paso 3: Deploy del Backend

### 3.1 Crear Web Service (Backend)

1. En el dashboard de Render, click en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio:
   - Si usas GitHub, autoriza Render
   - Selecciona el repositorio `SecretKirchner`
   - Selecciona la rama `main`

### 3.2 Configurar el Backend

Completa los siguientes campos:

**Información Básica:**
- **Name**: `secreto-kirchner-backend`
- **Region**: Elige la más cercana (ej: `Oregon (US West)` o `Frankfurt (EU Central)`)
- **Branch**: `main`
- **Root Directory**: (deja vacío)

**Build & Deploy:**
- **Environment**: `Node`
- **Build Command**: 
  ```
  npm install && cd client && npm install && npm run build
  ```
- **Start Command**: 
  ```
  node server/server.js
  ```

**Environment Variables** (click en "Advanced"):
Agrega estas variables (las actualizarás después con la URL del frontend):

```
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://secreto-kirchner-frontend.onrender.com
CLIENT_URL=https://secreto-kirchner-frontend.onrender.com
```

**Plan:**
- Selecciona **"Free"** (gratis)

### 3.3 Crear el Servicio

1. Click en **"Create Web Service"**
2. Render comenzará a construir y deployar tu backend
3. ⏳ Espera 5-10 minutos (primera vez puede tardar más)
4. Cuando termine, verás una URL como: `https://secreto-kirchner-backend.onrender.com`
5. **¡Copia esta URL!** La necesitarás para el frontend

---

## 🎯 Paso 4: Actualizar CORS del Backend

Una vez que tengas la URL del backend:

1. Ve a tu servicio backend en Render
2. Click en **"Environment"** (en el menú lateral)
3. Actualiza las variables:
   ```
   CORS_ORIGIN=https://secreto-kirchner-frontend.onrender.com
   CLIENT_URL=https://secreto-kirchner-frontend.onrender.com
   ```
4. Click en **"Save Changes"**
5. Render redeployará automáticamente

---

## 🎯 Paso 5: Deploy del Frontend

### 5.1 Crear Static Site (Frontend)

1. En el dashboard de Render, click en **"New +"**
2. Selecciona **"Static Site"**
3. Conecta el mismo repositorio:
   - Selecciona `SecretKirchner`
   - Branch: `main`

### 5.2 Configurar el Frontend

**Información Básica:**
- **Name**: `secreto-kirchner-frontend`
- **Branch**: `main`
- **Root Directory**: (deja vacío)

**Build & Deploy:**
- **Build Command**: 
  ```
  cd client && npm install && node scripts/replace-env.js && ./node_modules/.bin/ng build --configuration production
  ```
  
  **Explicación:** Usamos el path directo a `ng` porque en Render a veces npm no resuelve correctamente los binarios en el PATH.
- **Publish Directory**: 
  ```
  client/dist/secreto-kirchner-client
  ```

**Environment Variables** (click en "Advanced"):
Agrega estas variables con la URL de tu backend:

```
SERVER_URL=https://secreto-kirchner-backend.onrender.com
SOCKET_URL=https://secreto-kirchner-backend.onrender.com
```

**Plan:**
- Selecciona **"Free"** (gratis)

### 5.3 Crear el Static Site

1. Click en **"Create Static Site"**
2. ⏳ Espera 5-10 minutos
3. Cuando termine, tendrás una URL como: `https://secreto-kirchner-frontend.onrender.com`
4. **¡Esta es la URL de tu juego!** 🎉

---

## 🎯 Paso 6: Actualizar CORS (Segunda vez)

Ahora que tienes la URL del frontend:

1. Ve al servicio **backend** en Render
2. Click en **"Environment"**
3. Actualiza las variables con la URL real del frontend:
   ```
   CORS_ORIGIN=https://secreto-kirchner-frontend.onrender.com
   CLIENT_URL=https://secreto-kirchner-frontend.onrender.com
   ```
4. Click en **"Save Changes"**
5. Espera a que se redeploye

---

## ✅ Paso 7: Probar el Juego

1. Abre la URL del frontend: `https://secreto-kirchner-frontend.onrender.com`
2. Si es la primera vez después de que el servicio "durmió", espera ~30 segundos
3. Prueba:
   - ✅ Crear una sala
   - ✅ Unirse a una sala
   - ✅ Iniciar un juego
   - ✅ Verificar que los WebSockets funcionen

---

## 🔧 Solución de Problemas

### Error: "CORS policy blocked"

**Solución:**
1. Verifica que `CORS_ORIGIN` en el backend coincida EXACTAMENTE con la URL del frontend
2. Debe incluir `https://` y no terminar en `/`
3. Ejemplo correcto: `https://secreto-kirchner-frontend.onrender.com`
4. Ejemplo incorrecto: `https://secreto-kirchner-frontend.onrender.com/`

### Error: "Socket.IO connection failed"

**Solución:**
1. Verifica que el backend esté corriendo (ve a la URL del backend + `/api/health`)
2. Verifica que `SERVER_URL` y `SOCKET_URL` en el frontend sean correctas
3. Espera ~30 segundos si el servicio acaba de "despertar"

### El servicio está "dormido"

**Normal:** Los servicios gratuitos de Render se duermen después de 15 minutos de inactividad.

**Solución:**
- La primera petición después de dormir tarda ~30 segundos
- Las siguientes peticiones son instantáneas
- Si necesitas que esté siempre activo, considera Railway (ver DEPLOYMENT.md)

### Build falla

**Solución:**
1. Revisa los logs en Render (click en "Logs")
2. Verifica que todas las dependencias estén en `package.json`
3. Asegúrate de que el comando de build sea correcto

---

## 📝 Resumen de URLs

Después del deployment, tendrás:

- **Backend**: `https://secreto-kirchner-backend.onrender.com`
- **Frontend**: `https://secreto-kirchner-frontend.onrender.com` ← **Esta es la URL del juego**

---

## 🎉 ¡Listo!

Tu juego está online. Comparte la URL del frontend con tus amigos y ¡a jugar!

---

## 💡 Tips Adicionales

1. **Monitoreo**: Render te enviará emails si el servicio falla
2. **Logs**: Puedes ver los logs en tiempo real en el dashboard
3. **Redeploy**: Cada push a `main` redeployará automáticamente
4. **Custom Domain**: Puedes agregar un dominio personalizado (requiere plan de pago)

---

¿Problemas? Revisa los logs en Render o abre un issue en GitHub.

