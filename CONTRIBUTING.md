# 🤝 Contribuir a El Secreto de Kirchner

¡Gracias por tu interés en contribuir! Este es un proyecto de código abierto con fines educativos y satíricos.

## 🎯 Tipos de Contribuciones

### 1. Reportar Bugs
- Usa el sistema de issues
- Describe el problema claramente
- Incluye pasos para reproducirlo
- Especifica tu sistema operativo y versión de Node.js

### 2. Sugerir Mejoras
- Ideas para nuevas mecánicas de juego
- Mejoras en la interfaz
- Textos satíricos adicionales
- Optimizaciones de código

### 3. Contribuir Código
- Corregir bugs
- Implementar nuevas features
- Mejorar la documentación
- Agregar tests

### 4. Diseño y Arte
- Diseños para cartas de decretos
- Iconos y gráficos temáticos
- Mejoras visuales en la UI
- Animaciones

## 📝 Guía de Estilo

### JavaScript/TypeScript
- Usa ES6+ cuando sea posible
- Nombres descriptivos para variables y funciones
- Comentarios para lógica compleja
- Mantén funciones cortas y enfocadas

### Angular
- Sigue las convenciones de Angular
- Componentes pequeños y reutilizables
- Usa servicios para lógica compartida
- Observables para manejo de estado

### CSS/SCSS
- Usa variables CSS para colores
- Nombres de clases descriptivos
- Evita !important
- Diseño responsive

### Mensajes de Commit
- Usa español
- Sé descriptivo pero conciso
- Ejemplos:
  - ✅ `feat: Agregar poder presidencial de veto`
  - ✅ `fix: Corregir conteo de votos en sala`
  - ✅ `style: Mejorar diseño del tablero`
  - ✅ `docs: Actualizar guía de instalación`

## 🔧 Proceso de Desarrollo

1. **Fork el repositorio**

2. **Crea una rama para tu feature**
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```

3. **Realiza tus cambios**
   - Escribe código limpio
   - Prueba localmente
   - Asegúrate de que no rompes nada

4. **Commit tus cambios**
   ```bash
   git add .
   git commit -m "feat: descripción del cambio"
   ```

5. **Push a tu fork**
   ```bash
   git push origin feature/nombre-descriptivo
   ```

6. **Crea un Pull Request**
   - Describe claramente los cambios
   - Referencia issues relacionados
   - Incluye capturas de pantalla si aplica

## 🎨 Ideas para Contribuir

### Fácil
- Agregar más textos satíricos
- Mejorar mensajes de error
- Corregir typos
- Actualizar documentación

### Medio
- Implementar sistema de replay
- Agregar estadísticas de jugadores
- Mejorar animaciones
- Optimizar rendimiento

### Difícil
- Sistema de cuentas persistentes
- Base de datos para historial
- Modo torneo
- IA para jugar contra bots

## 📋 Checklist antes de PR

- [ ] El código funciona localmente
- [ ] No hay errores en consola
- [ ] El código sigue las convenciones del proyecto
- [ ] Los mensajes de commit son claros
- [ ] La documentación está actualizada (si aplica)
- [ ] Se probó en diferentes navegadores (si aplica)

## ⚖️ Licencia

Al contribuir, aceptas que tus contribuciones se licenciarán bajo CC BY-NC-SA 4.0, la misma licencia del proyecto.

## 🙏 Reconocimientos

Todos los contribuidores serán reconocidos en el README del proyecto.

## ❓ Preguntas

Si tienes dudas sobre cómo contribuir:
- Abre un issue con tu pregunta
- Usa el tag `pregunta`
- La comunidad estará encantada de ayudar

---

## 🚀 Configuración de Git

### Primer Commit

**Opción Rápida:**
```bash
git add .
git commit -m "feat: descripción del cambio"
```

**Opción Organizada (recomendado):**
```bash
# Commits separados por área
git add server/
git commit -m "feat: cambios en backend"

git add client/
git commit -m "feat: cambios en frontend"

git add *.md
git commit -m "docs: actualizar documentación"
```

### Convenciones de Commits

Usa prefijos estándares:

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Formato (no afectan código)
- `refactor:` - Refactorización
- `test:` - Tests
- `chore:` - Mantenimiento

**Ejemplos:**
```bash
git commit -m "feat: agregar poder presidencial de veto"
git commit -m "fix: corregir conteo de votos con IAs"
git commit -m "docs: actualizar guía de instalación"
git commit -m "style: mejorar diseño del tablero"
git commit -m "refactor: extraer lógica a servicio"
```

### Workflow de Desarrollo

```bash
# 1. Actualizar rama principal
git checkout main
git pull origin main

# 2. Crear rama de feature
git checkout -b feature/nombre-descriptivo

# 3. Hacer cambios y commits
git add .
git commit -m "feat: descripción"

# 4. Subir la feature
git push -u origin feature/nombre-descriptivo

# 5. Crear Pull Request en GitHub
```

### Subir a GitHub (Primera Vez)

```bash
# 1. Crear repositorio en GitHub (no agregues README ni .gitignore)

# 2. Conectar repositorio local
git remote add origin https://github.com/TU_USUARIO/SecretKirchner.git

# 3. Subir código
git branch -M main
git push -u origin main
```

### Comandos Útiles

```bash
# Ver estado
git status

# Ver historial
git log --oneline --graph

# Ver cambios
git diff

# Descartar cambios
git checkout -- archivo.js

# Ver qué ignora .gitignore
git status --ignored
```

### Versionado (SemVer)

Formato: **MAJOR.MINOR.PATCH** (ej. 1.2.3)

- **MAJOR**: Cambios incompatibles
- **MINOR**: Nuevas funcionalidades
- **PATCH**: Bug fixes

```bash
# Crear tag de versión
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

¡Gracias por hacer de "El Secreto de Kirchner" un mejor proyecto! 🎭🇦🇷

