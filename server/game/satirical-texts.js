/**
 * Textos satíricos para El Secreto de Kirchner
 * Referencias políticas argentinas con humor
 */

const SATIRICAL_MESSAGES = {
  // Mensajes de inicio de juego
  gameStart: [
    '🎭 ¡Que comience el circo político!',
    '🏛️ Bienvenidos al Congreso de la Nación... versión caótica',
    '💼 ¿Quién será el que mueve los hilos esta vez?',
    '🎪 Prepárense para la mejor función política del año'
  ],

  // Mensajes de votación
  voteApproved: [
    '✅ El gobierno fue aprobado. ¿Será una buena decisión?',
    '👍 Ja! La mayoría confía... o al menos eso dicen',
    '🗳️ Gobierno aprobado. Que los juegos comiencen',
    '✓ El pueblo ha hablado... algunos con convicción, otros por las dudas'
  ],

  voteRejected: [
    '❌ El gobierno fue rechazado. ¡Crisis política!',
    '👎 Nein! La desconfianza reina en el Congreso',
    '🚫 Otro gobierno que no prospera. ¿Cuántos van?',
    '✗ La oposición se impuso. Plot twist: nadie lo esperaba'
  ],

  chaos: [
    '💥 ¡CAOS ELECTORAL! Tres gobiernos fallidos. La democracia está en piloto automático',
    '🌪️ ¡ANARQUÍA! Se promulga una carta al azar. Nadie sabe qué pasará',
    '⚡ ¡CRISIS INSTITUCIONAL! El sistema colapsa y decide por su cuenta',
    '🎲 ¡DESCONTROL TOTAL! Los dados políticos están en el aire'
  ],

  // Mensajes de decretos promulgados
  libertarianPolicy: [
    '🦅 ¡Decreto Libertario promulgado! La motosierra avanza',
    '💰 ¡Libre mercado intensifies! Un decreto libertario ve la luz',
    '📉 ¡Desregulación activa! Los libertarios festejan',
    '🔓 ¡Libertad económica! Otro decreto liberal en el tablero'
  ],

  kirchneristaPolicy: [
    '✊ ¡Decreto Kirchnerista promulgado! El modelo sigue vigente',
    '🏛️ ¡Intervencionismo estatal! Los K avanzan en su estrategia',
    '💼 ¡El Estado presente! Otro decreto kirchnerista aprobado',
    '📊 ¡INDEC mode ON! Las políticas K se multiplican'
  ],

  // Mensajes de poderes presidenciales
  peekPower: [
    '📊 El Presidente "ajustó las estadísticas" y vio las próximas cartas',
    '🔍 Intervención del INDEC completada. Números alternativos desbloqueados',
    '📈 El Presidente consultó a los técnicos... del INDEC',
    '🎯 Datos sensibles revelados. El Presidente ahora sabe qué viene'
  ],

  investigatePower: [
    '🕵️ La AFIP hizo su trabajo. Un jugador fue investigado',
    '💼 Inspección sorpresa completada. La lealtad fue revelada',
    '📋 El Estado investigó y ahora tiene información valiosa',
    '🔎 Auditoría ejecutada. Alguien está en la mira'
  ],

  specialElectionPower: [
    '🏛️ ¡Sesión Especial convocada! El próximo Presidente fue elegido',
    '⚖️ El Congreso se reunió de urgencia. Hay nuevo candidato',
    '📜 Decreto presidencial: el próximo líder ya está decidido',
    '🎯 Plot twist: el Presidente eligió al sucesor'
  ],

  executionPower: [
    '💀 OPERACIÓN TRASLADO ejecutada. Un jugador fue... relocali zado',
    '🚁 Helicóptero despegó. Alguien tuvo un pequeño accidente',
    '⚰️ La política se puso heavy. Eliminación ejecutada',
    '💼 "Renuncia voluntaria" aceptada. Uno menos en el juego'
  ],

  // Victoria
  libertarianVictory: [
    '🦅 ¡VICTORIA LIBERTARIA! La motosierra triunfó sobre el aparato estatal',
    '🏆 ¡Los Libertarios ganaron! El libre mercado prevalece',
    '💰 ¡GAME OVER K! Los libertarios se impusieron',
    '🎉 ¡Triunfo Liberal! Milei estaría orgulloso'
  ],

  kirchneristaVictory: [
    '✊ ¡VICTORIA KIRCHNERISTA! El modelo vuelve recargado',
    '🏆 ¡Los K ganaron! La hegemonía continúa',
    '🎊 ¡GAME OVER NEOLIBERALISMO! Los kirchneristas se imponen',
    '🎉 ¡Triunfo K! Néstor y Cristina aprobarían'
  ],

  // Muerte de El Jefe
  elJefeKilled: [
    '💀 ¡EL JEFE FUE ELIMINADO! Los Libertarios destaparon la olla',
    '⚰️ ¡PLOT TWIST! El Jefe fue descubierto y eliminado',
    '🎯 ¡BINGO! Encontraron y eliminaron a El Jefe. Victoria Libertaria',
    '💥 ¡FIN DEL RÉGIMEN! El Jefe cayó en la Operación Traslado'
  ],

  // El Jefe elegido
  elJefeElected: [
    '👤 ¡EL JEFE ES JEFE DE GABINETE! Los Kirchneristas ganan automáticamente',
    '💼 ¡MASTER PLAN COMPLETADO! El Jefe llegó al poder',
    '🎭 ¡LA JUGADA PERFECTA! El Jefe fue elegido y los K festejan',
    '🏛️ ¡JAQUE MATE! El Jefe consolidó el poder kirchnerista'
  ]
};

/**
 * Obtiene un mensaje aleatorio de una categoría
 */
function getRandomMessage(category) {
  const messages = SATIRICAL_MESSAGES[category];
  if (!messages || messages.length === 0) {
    return 'Algo político está pasando...';
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Mensajes de flavor según el contexto
 */
const FLAVOR_TEXTS = {
  waitingPlayers: [
    '⏳ Esperando a que lleguen más diputados...',
    '🪑 Faltan legisladores para el quórum...',
    '📞 Llamando a los que están en el bar del Congreso...',
    '💤 Algunos diputados todavía están en sesiones... en sus casas'
  ],

  presidentNominating: [
    '🤔 El Presidente está eligiendo a su candidato...',
    '💭 Decisión estratégica en progreso...',
    '🎯 ¿A quién nombrará el Presidente?',
    '🤝 El Presidente busca su aliado... o su chivo expiatorio'
  ],

  voting: [
    '🗳️ La tensión se siente en el recinto...',
    '👀 Todos miran, nadie confía...',
    '🎲 Los votos definirán el futuro...',
    '⚖️ La democracia en acción... más o menos'
  ],

  legislative: [
    '📜 La legislación está en curso...',
    '🏛️ El Congreso trabaja... eso creen...',
    '💼 Negociaciones de pasillo intensificándose...',
    '🤐 ¿Qué cartas se están jugando?'
  ]
};

module.exports = {
  SATIRICAL_MESSAGES,
  FLAVOR_TEXTS,
  getRandomMessage
};

