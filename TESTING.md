# 🧪 Guía de Testing - El Secreto de Kirchner

Esta guía explica cómo probar las mecánicas del juego y verificar que todo funcione correctamente.

## ✅ Checklist de Pruebas Básicas

### 1. Pruebas de Lobby

**Crear Sala:**
- [ ] Se puede crear una sala con nombre válido
- [ ] Se genera un ID de sala único
- [ ] El creador es asignado como host
- [ ] La sala aparece en la lista de salas disponibles

**Unirse a Sala:**
- [ ] Los jugadores pueden unirse usando el ID
- [ ] No se permiten nombres duplicados
- [ ] Se muestra el conteo de jugadores actualizado
- [ ] Se actualiza la lista en tiempo real

**Límites de Jugadores:**
- [ ] No permite iniciar con menos de 5 jugadores
- [ ] No permite iniciar con más de 10 jugadores
- [ ] No permite unirse a sala llena (10 jugadores)

### 2. Pruebas de Roles

**Distribución de Roles:**
- [ ] Con 5 jugadores: 3 Libertarios, 2 Kirchneristas (1 El Jefe)
- [ ] Con 6 jugadores: 4 Libertarios, 2 Kirchneristas (1 El Jefe)
- [ ] Con 7 jugadores: 4 Libertarios, 3 Kirchneristas (1 El Jefe)
- [ ] Con 8 jugadores: 5 Libertarios, 3 Kirchneristas (1 El Jefe)
- [ ] Con 9 jugadores: 5 Libertarios, 4 Kirchneristas (1 El Jefe)
- [ ] Con 10 jugadores: 6 Libertarios, 4 Kirchneristas (1 El Jefe)

**Conocimiento de Roles:**
- [ ] Los Kirchneristas se conocen entre sí
- [ ] Los Kirchneristas conocen a El Jefe
- [ ] En partidas 5-6 jugadores, El Jefe no conoce a los Kirchneristas
- [ ] Los Libertarios no conocen a nadie
- [ ] Cada jugador ve correctamente su rol

### 3. Pruebas de Nominación y Votación

**Nominación:**
- [ ] Solo el Presidente puede nominar
- [ ] No se puede nominar jugadores muertos
- [ ] No se puede nominar al Jefe de Gabinete anterior (con más de 5 jugadores)
- [ ] No se puede nominar al mismo jugador

**Votación:**
- [ ] Todos los jugadores vivos pueden votar
- [ ] Solo se puede votar una vez
- [ ] Los votos se revelan al final
- [ ] Se necesita mayoría simple para aprobar
- [ ] El conteo de votos es correcto

**Victoria Automática Kirchnerista:**
- [ ] Si El Jefe es elegido Jefe de Gabinete con 3+ decretos K, los Kirchneristas ganan
- [ ] Se detecta correctamente la condición de victoria
- [ ] Se muestra el mensaje de victoria apropiado

### 4. Pruebas de Legislación

**Fase Presidente:**
- [ ] El Presidente recibe 3 cartas
- [ ] Solo el Presidente puede descartar
- [ ] Se descarta exactamente 1 carta
- [ ] Las 2 cartas restantes van al Jefe de Gabinete

**Fase Jefe de Gabinete:**
- [ ] El Jefe de Gabinete recibe 2 cartas
- [ ] Solo el Jefe de Gabinete puede elegir
- [ ] Se promulga exactamente 1 carta
- [ ] La otra carta se descarta

**Mazo de Cartas:**
- [ ] Comienza con 11 Kirchneristas y 6 Libertarios
- [ ] Si quedan menos de 3 cartas, se mezcla el descarte
- [ ] El conteo de cartas en mazo es correcto
- [ ] Las cartas son aleatorias

### 5. Pruebas de Poderes Presidenciales

**Intervenir INDEC (Peek):**
- [ ] Solo funciona si hay 3+ cartas en el mazo
- [ ] Muestra las próximas 3 cartas solo al Presidente
- [ ] No modifica el orden del mazo

**Investigar con AFIP:**
- [ ] Se revela la lealtad del jugador objetivo
- [ ] No se puede investigar jugadores muertos
- [ ] No se puede investigar el mismo jugador dos veces
- [ ] Solo se revela el equipo, no el rol específico

**Sesión Especial del Congreso:**
- [ ] El Presidente elige al próximo Presidente
- [ ] No se puede elegir a sí mismo
- [ ] No se puede elegir jugadores muertos
- [ ] El orden presidencial se altera correctamente

**Operación Traslado:**
- [ ] Se elimina al jugador seleccionado
- [ ] No se puede eliminar jugadores ya muertos
- [ ] Si se elimina a El Jefe, los Libertarios ganan
- [ ] Se actualiza la lista de jugadores vivos

### 6. Pruebas de Veto

**Condiciones:**
- [ ] El veto se desbloquea con 5 decretos Kirchneristas
- [ ] Solo el Jefe de Gabinete puede solicitar el veto
- [ ] El Presidente debe aceptar o rechazar

**Funcionamiento:**
- [ ] Si se acepta, ambas cartas se descartan
- [ ] Si se acepta, aumenta el contador de gobiernos fallidos
- [ ] Si se rechaza, el Jefe de Gabinete debe elegir una carta
- [ ] Se maneja correctamente el límite de 3 gobiernos fallidos

### 7. Pruebas de Caos Electoral

**Trigger:**
- [ ] Se activa con 3 gobiernos fallidos consecutivos
- [ ] Se revela la carta superior del mazo
- [ ] La carta revelada se promulga automáticamente
- [ ] El contador de gobiernos fallidos se resetea

**Condiciones de Victoria:**
- [ ] Si el caos promulga el 5to decreto Libertario, los Libertarios ganan
- [ ] Si el caos promulga el 6to decreto Kirchnerista, los Kirchneristas ganan

### 8. Pruebas de Condiciones de Victoria

**Libertarios Ganan:**
- [ ] Con 5 decretos libertarios promulgados
- [ ] Al eliminar a El Jefe

**Kirchneristas Ganan:**
- [ ] Con 6 decretos kirchneristas promulgados
- [ ] Al elegir a El Jefe como Jefe de Gabinete (con 3+ decretos K)

**Finalización:**
- [ ] Se muestra la pantalla de victoria
- [ ] Se revelan todos los roles
- [ ] Se muestra el motivo de la victoria
- [ ] Los jugadores pueden volver al inicio

### 9. Pruebas de UI/UX

**Responsividad:**
- [ ] Funciona en desktop (1920x1080)
- [ ] Funciona en tablet (768x1024)
- [ ] Funciona en móvil (375x667)
- [ ] Los elementos se adaptan correctamente

**Feedback Visual:**
- [ ] Los botones cambian al hacer hover
- [ ] Se muestran indicadores de carga
- [ ] Los errores se muestran claramente
- [ ] Las animaciones son fluidas

**Accesibilidad:**
- [ ] Los textos son legibles
- [ ] Los colores tienen buen contraste
- [ ] Los botones tienen tamaño adecuado
- [ ] Los mensajes de error son claros

### 10. Pruebas de Conectividad

**Socket.IO:**
- [ ] La conexión se establece correctamente
- [ ] Los eventos se sincronizan en tiempo real
- [ ] Las desconexiones se manejan apropiadamente
- [ ] La reconexión funciona correctamente

**Múltiples Clientes:**
- [ ] Varios jugadores pueden conectarse simultáneamente
- [ ] Los estados se sincronizan entre todos los clientes
- [ ] No hay race conditions en las votaciones
- [ ] El estado del juego es consistente

## 🎮 Escenarios de Prueba Recomendados

### Escenario 1: Juego Completo con 5 Jugadores
1. Crear sala con 5 jugadores
2. Verificar distribución de roles
3. Jugar hasta victoria Libertaria (5 decretos)
4. Verificar pantalla final

### Escenario 2: Victoria por Eliminación de El Jefe
1. Crear sala con 7 jugadores
2. Llegar a tener el poder de Operación Traslado
3. Eliminar a El Jefe
4. Verificar victoria Libertaria inmediata

### Escenario 3: Victoria Kirchnerista por Elección
1. Crear sala con 6 jugadores
2. Promulgar 3 decretos Kirchneristas
3. Elegir a El Jefe como Jefe de Gabinete
4. Verificar victoria Kirchnerista inmediata

### Escenario 4: Caos Electoral
1. Rechazar 3 gobiernos consecutivos
2. Verificar que se revela una carta
3. Verificar que se promulga automáticamente
4. Verificar reset del contador

### Escenario 5: Uso del Veto
1. Promulgar 5 decretos Kirchneristas
2. El Jefe de Gabinete solicita veto
3. El Presidente acepta
4. Verificar que aumenta gobiernos fallidos

## 🐛 Bugs Conocidos a Verificar

- [ ] El estado se mantiene al refrescar la página
- [ ] No hay memory leaks con múltiples partidas
- [ ] El chat no rompe con caracteres especiales
- [ ] No hay duplicación de eventos al reconectar

## 📊 Métricas de Balance

**Tiempos Promedio:**
- Partida de 5 jugadores: ~15-20 minutos
- Partida de 10 jugadores: ~30-40 minutos

**Tasa de Victoria (esperada):**
- Libertarios: ~45-50%
- Kirchneristas: ~50-55%

Si los porcentajes se desvían mucho, puede indicar desbalance en las mecánicas.

## 🔍 Herramientas de Testing

### Manual Testing
- Usa perfiles de Chrome/Firefox separados
- Prueba con diferentes navegadores
- Simula conexiones lentas (Network throttling)

### Console Logs
- Verifica errores en la consola del navegador (F12)
- Revisa logs del servidor en la terminal
- Usa `console.log` para debugging

### Testing de Carga
- Prueba con 10 jugadores simultáneos
- Verifica que no haya lag
- Monitorea uso de memoria

## ✅ Criterios de Aceptación

Para considerar el juego listo para jugar:
- [ ] Todas las pruebas básicas pasan
- [ ] No hay errores críticos en consola
- [ ] La experiencia de usuario es fluida
- [ ] El juego es balanceado y justo
- [ ] Funciona en los navegadores principales

---

## 🤖 Testing del Sistema de IAs

### Configuración Inicial

**1. Iniciar el Servidor:**
```bash
npm run dev
```

**2. Iniciar el Cliente:**
```bash
cd client
npm start
```

**3. Crear una Sala:**
- Abre http://localhost:4200
- Ingresa tu nombre
- Crea una nueva sala

### Agregar Jugadores IA

En el lobby, como host, verás una sección "🤖 Agregar Jugadores IA" con tres botones:

- **+ IA Fácil**: Decisiones casi aleatorias (ideal para aprender)
- **+ IA Media**: Balance de estrategia (recomendado)
- **+ IA Difícil**: Estrategia avanzada con sistema de confianza

**Pruebas con IAs:**
- [ ] Se pueden agregar IAs desde el lobby
- [ ] Las IAs aparecen con badge "🤖 IA"
- [ ] Se muestra notificación al agregar IA
- [ ] Solo el host puede agregar/remover IAs
- [ ] Las IAs cuentan para el mínimo de 5 jugadores
- [ ] No se pueden agregar más de 10 jugadores total
- [ ] No se pueden agregar IAs después de iniciar

### Comportamiento de las IAs Durante el Juego

**Durante Nominación:**
- [ ] IA Presidente nomina en 2-4 segundos
- [ ] Selección basada en rol y estrategia
- [ ] No se nomina a sí misma
- [ ] Respeta restricciones (no nominar Jefe anterior)

**Durante Votación:**
- [ ] Todas las IAs votan automáticamente
- [ ] Consideran: gobiernos fallidos, decretos, amenazas
- [ ] Votan coherentemente con su rol
- [ ] IA Fácil vota casi aleatoriamente
- [ ] IA Media/Difícil votan estratégicamente

**Durante Legislación:**
- [ ] IA Presidente descarta carta según su equipo
- [ ] IA Jefe de Gabinete promulga según estrategia
- [ ] Pueden solicitar veto si conviene
- [ ] Decisiones coherentes con rol secreto

**Durante Poderes Presidenciales:**
- [ ] IAs ejecutan poderes automáticamente
- [ ] Eligen targets estratégicamente
- [ ] Poder de peek: Considera información
- [ ] Poder de investigate: Elige jugadores sospechosos
- [ ] Poder de execution: Elimina amenazas
- [ ] Poder de special election: Elige estratégicamente

### Verificación en Logs del Servidor

Al agregar IAs, deberías ver en la consola:
```
🤖 IA Bot [Nombre] agregada a [ROOM_ID]
👤 Bot [Nombre] nominó a Bot [Otro]
🗳️ Bot [Nombre] votó
```

### Problemas Comunes

**Las IAs no aparecen:**
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador (F12)
- Verifica que seas el host de la sala

**Los botones no funcionan:**
- Solo el host puede agregar IAs
- No se pueden agregar después de iniciar
- Máximo 10 jugadores total

**Error: "Sala no encontrada":**
- Recarga la página
- Crea una nueva sala

### Niveles de Dificultad de IA

#### IA Fácil
- 70% decisiones aleatorias
- 30% estrategia básica
- Ideal para: Aprender mecánicas

#### IA Media (Recomendado)
- 50% estrategia
- 50% aleatoriedad
- Balance realista
- Ideal para: Partidas normales

#### IA Difícil
- 80-90% estrategia avanzada
- Sistema de confianza/sospecha
- Memoria de eventos pasados
- Ideal para: Desafío

### Casos de Prueba Específicos

**Partida Solo con IAs:**
- [ ] Crear sala con 1 humano + 4 IAs
- [ ] Verificar que el juego fluye correctamente
- [ ] Las IAs juegan toda la partida hasta el final
- [ ] Se detectan condiciones de victoria

**Partida Mixta:**
- [ ] 3 humanos + 2 IAs
- [ ] IAs no rompen el flujo del juego
- [ ] Sincronización correcta entre humanos e IAs

**Estrés con IAs:**
- [ ] Partida con 9 IAs + 1 humano
- [ ] Verificar rendimiento
- [ ] No hay lag ni delays excesivos

---

¡Buen testing! 🧪

