# 📥 Guía de Instalación - El Secreto de Kirchner

Esta guía te ayudará a instalar y ejecutar "El Secreto de Kirchner" en tu máquina local.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
  - Descarga desde: https://nodejs.org/
  - Verifica la instalación: `node --version`

- **npm** (viene con Node.js)
  - Verifica la instalación: `npm --version`

## 🚀 Instalación Paso a Paso

### 1. Clonar o Descargar el Proyecto

Si tienes Git instalado:
```bash
git clone <tu-repositorio>
cd SecretKirchner
```

O simplemente descarga el proyecto y descomprímelo.

### 2. Instalar Dependencias del Backend

En la raíz del proyecto:

```bash
npm install
```

Esto instalará todas las dependencias necesarias para el servidor:
- Express
- Socket.IO
- CORS
- uuid

### 3. Instalar Dependencias del Frontend

Navega a la carpeta del cliente:

```bash
cd client
npm install
```

Esto instalará Angular y todas sus dependencias:
- Angular 17
- RxJS
- Socket.IO cliente
- TypeScript

### 4. Verificar la Instalación

Vuelve a la raíz del proyecto:

```bash
cd ..
```

## ▶️ Ejecutar el Juego

### Opción 1: Modo Desarrollo (Recomendado para desarrollo)

Necesitarás **dos terminales** abiertas:

**Terminal 1 - Backend:**
```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

El cliente Angular se ejecutará en `http://localhost:4200`

### Opción 2: Modo Producción

**Paso 1:** Construir el frontend
```bash
cd client
npm run build
cd ..
```

**Paso 2:** Iniciar el servidor
```bash
npm start
```

Luego abre tu navegador en `http://localhost:3000`

## 🎮 Empezar a Jugar

1. Abre tu navegador en `http://localhost:4200` (desarrollo) o `http://localhost:3000` (producción)

2. Ingresa tu nombre

3. Crea una sala nueva o únete a una existente

4. Necesitas entre 5 y 10 jugadores para comenzar

5. El host inicia el juego cuando todos estén listos

## 🔧 Solución de Problemas

### El servidor no inicia

**Error de puerto ocupado:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solución:** 
- Cambia el puerto en `server/server.js` línea: `const PORT = process.env.PORT || 3000;`
- O mata el proceso que está usando el puerto 3000

### El cliente Angular no inicia

**Error de dependencias:**
```
npm ERR! peer dependency
```

**Solución:**
```bash
cd client
rm -rf node_modules
rm package-lock.json
npm install --legacy-peer-deps
```

### No se conecta el frontend con el backend

**Problema:** Los jugadores no pueden unirse a las salas

**Solución:**
- Verifica que ambos (frontend y backend) estén corriendo
- Revisa la URL del servidor en `client/src/app/services/socket.service.ts`
- Asegúrate de que sea `http://localhost:3000`

### Error de CORS

**Solución:**
- Verifica que el origen esté permitido en `server/server.js`:
```javascript
cors: {
  origin: "http://localhost:4200",
  methods: ["GET", "POST"]
}
```

## 📱 Jugar con Amigos en Red Local

### Configuración del Host

1. Encuentra tu IP local:
   - **Windows:** `ipconfig` en cmd
   - **Mac/Linux:** `ifconfig` en terminal
   - Busca algo como `192.168.x.x`

2. Modifica `client/src/app/services/socket.service.ts`:
```typescript
private readonly SERVER_URL = 'http://TU_IP_LOCAL:3000';
```

3. Modifica `server/server.js` en la configuración de CORS:
```javascript
origin: "*",  // Permite todas las conexiones
```

4. Reinicia el servidor y el cliente

5. Comparte tu IP con tus amigos: `http://TU_IP_LOCAL:4200`

## 🎯 Próximos Pasos

¡Todo listo! Ahora puedes:
- Crear una sala
- Invitar amigos
- Disfrutar de "El Secreto de Kirchner"

## 📞 Soporte

Si tienes problemas:
1. Revisa esta guía completa
2. Verifica los logs de la consola del navegador (F12)
3. Revisa los logs del servidor en la terminal
4. Asegúrate de tener las versiones correctas de Node.js

## 📝 Notas Importantes

- El juego usa almacenamiento en memoria, las salas se borran al reiniciar el servidor
- Se recomienda usar Chrome o Firefox para mejor compatibilidad
- Necesitas conexión estable para evitar desconexiones

¡Disfruta del juego! 🎭

