# 🎭 El Secreto de Kirchner

Una adaptación satírica argentina del juego de deducción social "Secret Hitler", ambientado en el contexto político argentino.

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/angular-17.0.0-red.svg)](https://angular.io/)

---

## 🎮 Descripción

**"El Secreto de Kirchner"** es un juego dramático de intriga política y traición para 5-10 jugadores. Los jugadores se dividen secretamente en dos equipos: **Libertarios** y **Kirchneristas**. 

Los Kirchneristas se conocen entre sí y buscan aprobar decretos kirchneristas o elegir a "El Jefe" como Jefe de Gabinete. Los Libertarios deben encontrar y detener a El Jefe antes de que sea demasiado tarde.

### ✨ Características Principales

- 🎲 Juego multijugador en tiempo real (5-10 jugadores)
- 🤖 **Jugadores IA con 3 niveles de dificultad**
- 🎨 Interfaz moderna y responsive
- 💬 Chat integrado
- 🔄 Sincronización automática entre jugadores
- 🎭 Textos satíricos sobre política argentina
- 🏛️ Mecánicas de deducción social y estrategia

---

## 🎯 Equipos y Objetivos

### 🦅 Libertarios (Equipo Democrático)
**Objetivo:** Salvar a Argentina del intervencionismo estatal
- ✅ Aprobar 5 decretos libertarios, **O**
- ✅ Descubrir y eliminar a "El Jefe"

**Características:**
- No conocen a otros jugadores
- Deben usar deducción y lógica
- Mayoría al inicio del juego

### ✊ Kirchneristas (Equipo Secreto)
**Objetivo:** Consolidar el poder y el modelo
- ✅ Aprobar 6 decretos kirchneristas, **O**
- ✅ Elegir a "El Jefe" como Jefe de Gabinete (después de 3 decretos K)

**Características:**
- Se conocen entre sí
- Conocen quién es El Jefe
- Pueden mentir y engañar
- Minoría pero coordinados

### 👤 El Jefe (Rol Especial)
- Líder secreto de los Kirchneristas
- Si es eliminado, los Libertarios ganan
- Si es elegido Jefe de Gabinete con 3+ decretos K, los Kirchneristas ganan
- En partidas de 5-6 jugadores, no conoce a los otros Kirchneristas

---

## 🃏 Mecánicas del Juego

### 📜 Flujo de una Ronda

1. **🎩 Nominación**: El Presidente nomina a un Jefe de Gabinete
2. **🗳️ Votación**: Todos votan "Ja!" (sí) o "Nein!" (no) al gobierno propuesto
3. **📋 Legislación**: Si se aprueba, el gobierno promulga un decreto
   - Presidente recibe 3 cartas, descarta 1
   - Jefe de Gabinete recibe 2 cartas, promulga 1
4. **💼 Poderes**: Poderes presidenciales según decretos kirchneristas
5. **🔄 Siguiente**: Rotar al siguiente Presidente

### 💼 Poderes Presidenciales

| Poder | Nombre | Descripción | Trigger |
|-------|--------|-------------|---------|
| 📊 | **Intervenir INDEC** | Ver las próximas 3 cartas del mazo | 1er decreto K |
| 🕵️ | **Investigar con AFIP** | Conocer la lealtad de un jugador | 2do decreto K |
| 🏛️ | **Sesión Especial del Congreso** | Elegir al próximo Presidente | 3er decreto K |
| 💀 | **Operación Traslado** | Eliminar a un jugador del juego | 4to/5to decreto K |
| 🚫 | **Veto Presidencial** | Rechazar ambas cartas (requiere acuerdo) | Después de 5 decretos K |

### ⚡ Caos Electoral

Si 3 gobiernos son rechazados consecutivamente:
- Se revela y promulga automáticamente la carta superior del mazo
- El contador de gobiernos fallidos se resetea
- Puede resultar en victoria inmediata

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

- Node.js 18+ ([Descargar](https://nodejs.org/))
- npm (viene con Node.js)

### Instalación Rápida

```bash
# 1. Instalar dependencias del backend
npm install

# 2. Instalar dependencias del frontend
cd client
npm install
cd ..
```

### Ejecutar en Modo Desarrollo

**Opción 1 - Comando único (recomendado):**
```bash
npm run dev:all
```
Este comando levanta tanto el backend como el frontend en una sola terminal.

**Opción 2 - Terminales separadas:**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
```

El servidor correrá en `http://localhost:3000` y el cliente en `http://localhost:4200`

### 🎮 ¡A Jugar!

1. Abre tu navegador en `http://localhost:4200`
2. Ingresa tu nombre
3. Crea una sala o únete a una existente
4. **🤖 ¡NUEVO!** Agrega jugadores IA con botones "IA Fácil/Media/Difícil"
5. Invita a amigos (humanos + IAs = 5-10 jugadores)
6. ¡Que comience el juego!

#### 🤖 Jugadores IA

Puedes agregar bots con diferentes niveles de dificultad:

- **IA Fácil**: Decisiones casi aleatorias, ideal para aprender
- **IA Media**: Balance entre estrategia y aleatoriedad (recomendado)
- **IA Difícil**: Estrategia avanzada con sistema de confianza/sospecha

Las IAs jugarán automáticamente:
- Nominan Jefe de Gabinete según estrategia
- Votan considerando contexto del juego
- Legislan según su equipo (Kirchnerista/Libertario)
- Ejecutan poderes presidenciales inteligentemente
- Responden con delays de 2-4 segundos (simulan pensamiento)

---

## 🛠️ Stack Tecnológico

### Frontend
- **Angular 17**: Framework de UI moderno
- **TypeScript**: Lenguaje tipado
- **RxJS**: Programación reactiva
- **SCSS**: Estilos avanzados
- **Socket.IO Client**: WebSockets

### Backend
- **Node.js**: Runtime de JavaScript
- **Express**: Framework web minimalista
- **Socket.IO**: WebSockets en tiempo real
- **JavaScript ES6+**: Lógica del servidor

### Arquitectura
- Cliente-Servidor
- Comunicación bidireccional en tiempo real
- Estado sincronizado entre todos los clientes
- Sin base de datos (almacenamiento en memoria)

---

## 📁 Estructura del Proyecto

```
SecretKirchner/
├── 📂 server/                      # Backend Node.js
│   ├── 📂 game/                    # Lógica del juego
│   │   ├── roles.js               # Sistema de roles
│   │   ├── policies.js            # Decretos y mazo
│   │   ├── powers.js              # Poderes presidenciales
│   │   ├── gameState.js           # Estado del juego
│   │   └── satirical-texts.js     # Textos satíricos
│   ├── 📂 socket/
│   │   └── gameSocket.js          # Eventos Socket.IO
│   └── server.js                  # Entrada del servidor
│
├── 📂 client/                      # Frontend Angular
│   ├── 📂 src/
│   │   ├── 📂 app/
│   │   │   ├── 📂 components/     # 10 componentes
│   │   │   ├── 📂 services/       # Servicios
│   │   │   └── 📂 models/         # Interfaces TypeScript
│   │   ├── styles.scss            # Estilos globales
│   │   └── index.html
│   ├── angular.json
│   └── package.json
│
├── 📄 README.md                    # Documentación principal
├── 📄 LICENSE                      # Licencia CC BY-NC-SA 4.0
├── 📄 package.json                 # Dependencias backend
└── 📄 .gitignore                   # Archivos ignorados por Git
```

---

## 📸 Capturas de Pantalla

*(Aquí se pueden agregar capturas de pantalla del juego en el futuro)*

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este es un proyecto de código abierto.

### Cómo Contribuir
1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nombre-descriptivo`
3. Realiza tus cambios y commit: `git commit -m "feat: descripción"`
4. Push a tu fork: `git push origin feature/nombre-descriptivo`
5. Crea un Pull Request

### Ideas para Contribuir
- 🐛 Reportar bugs
- ✨ Sugerir nuevas features
- 🎨 Mejorar el diseño
- 📝 Agregar más textos satíricos
- 🧪 Escribir tests
- 📚 Mejorar la documentación

### Guía de Estilo
- Usa ES6+ cuando sea posible
- Nombres descriptivos para variables y funciones
- Comentarios JSDoc para funciones públicas
- Mensajes de commit en español con prefijos: `feat:`, `fix:`, `docs:`, `style:`

---

## 🎭 Créditos

### Juego Original
**Secret Hitler** diseñado por:
- Max Temkin (Cards Against Humanity)
- Mike Boxleiter (Solipskier)
- Tommy Maranges (Philosophy Bro)
- Ilustrado por Mackenzie Schubert

Licencia original: CC BY-NC-SA 4.0

### Adaptación Argentina
- **Concepto**: Adaptación satírica al contexto político argentino
- **Desarrollo**: Proyecto de código abierto
- **Propósito**: Educativo y entretenimiento
- **Tono**: Sátira política con humor

---

## ⚖️ Licencia

Este proyecto está licenciado bajo **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.

Esto significa:
- ✅ **Compartir**: Puedes copiar y redistribuir el material
- ✅ **Adaptar**: Puedes remezclar, transformar y crear a partir del material
- ⚠️ **Atribución**: Debes dar crédito apropiado
- ❌ **No Comercial**: No puedes usar el material con fines comerciales
- ✅ **Compartir Igual**: Si remezclas, debes distribuir bajo la misma licencia

Para más detalles: [Ver licencia completa](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 🚀 Deployment (Subir a Internet)

¿Quieres subir el juego para que otros puedan jugarlo? Tenemos una **guía paso a paso completa** para deployment gratuito:

👉 **[Guía Completa de Deployment en Render](RENDER-GUIDE.md)**

**Render** es la opción recomendada porque:
- ✅ Tier gratuito permanente
- ✅ Soporte para WebSockets (Socket.IO)
- ✅ Deploy automático desde GitHub
- ✅ HTTPS/SSL automático
- ✅ Configuración muy sencilla

**Nota:** El servicio se "duerme" después de 15 minutos de inactividad, pero se despierta automáticamente en ~30 segundos.

---

## 📞 Contacto y Soporte

- 🐛 **Bugs**: Abre un issue en GitHub
- 💡 **Sugerencias**: Abre un issue con el tag "enhancement"
- ❓ **Preguntas**: Usa el tag "question" en los issues

---

## 🌟 Estado del Proyecto

**Versión**: 1.0.0  
**Estado**: ✅ Funcional y jugable  
**Última actualización**: Noviembre 2025

### Funcionalidades Completas
- ✅ Sistema completo de juego
- ✅ Multiplayer en tiempo real
- ✅ Todas las mecánicas implementadas
- ✅ Interfaz responsiva
- ✅ Textos satíricos argentinos

### Próximas Mejoras
- 🔜 Sistema de cuentas
- 🔜 Historial de partidas
- 🔜 Sonidos y música
- 🔜 Animaciones mejoradas
- 🔜 Tutorial interactivo

---

## 💝 Agradecimientos

- Al equipo original de Secret Hitler por crear un juego brillante
- A la comunidad de código abierto
- A todos los que contribuyan a este proyecto

---

## 🇦🇷 Hecho en Argentina

Con mate, humor y mucha política 🧉

---

**¿Te gustó el proyecto? ¡Dale una ⭐ en GitHub!**

