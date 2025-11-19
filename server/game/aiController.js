/**
 * Controlador de IA que maneja las acciones automáticas de los bots
 * Este módulo se integra con el sistema de sockets para ejecutar acciones
 */

const { AIPlayer, AI_DIFFICULTY } = require('./aiPlayer');
const { GAME_PHASES } = require('./gameState');

// Almacén de instancias de IA por jugador
const aiInstances = new Map();

// Flag para evitar procesar resultados de votación duplicados
const voteProcessingFlags = new Map();

/**
 * Crea una nueva instancia de IA para un jugador
 */
function createAIInstance(playerId, difficulty = AI_DIFFICULTY.MEDIUM) {
  const ai = new AIPlayer(difficulty);
  aiInstances.set(playerId, ai);
  return ai;
}

/**
 * Obtiene la instancia de IA para un jugador
 */
function getAIInstance(playerId) {
  if (!aiInstances.has(playerId)) {
    createAIInstance(playerId);
  }
  return aiInstances.get(playerId);
}

/**
 * Elimina instancia de IA
 */
function removeAIInstance(playerId) {
  aiInstances.delete(playerId);
}

/**
 * Limpia todas las IAs de una sala
 */
function clearRoomAIs(gameState) {
  if (gameState && gameState.players) {
    gameState.players.filter(p => p.isAI).forEach(p => {
      removeAIInstance(p.id);
    });
  }
}

/**
 * Verifica si el turno actual es de una IA y ejecuta la acción
 */
function handleAITurn(io, roomId, gameState, phase) {
  console.log(`🤖 handleAITurn llamada - Fase: ${phase}`);
  setTimeout(() => {
    try {
      console.log(`⏰ Ejecutando turno IA después del delay - Fase: ${phase}`);
      switch (phase) {
        case GAME_PHASES.NOMINATION:
          console.log('📋 Ejecutando NOMINATION');
          handleAINomination(io, roomId, gameState);
          break;
        
        case GAME_PHASES.ELECTION:
          console.log('🗳️ Ejecutando ELECTION');
          handleAIVoting(io, roomId, gameState);
          break;
        
        case GAME_PHASES.LEGISLATIVE_PRESIDENT:
          console.log('🏛️ Ejecutando LEGISLATIVE_PRESIDENT');
          handleAIPresidentDiscard(io, roomId, gameState);
          break;
        
        case GAME_PHASES.LEGISLATIVE_CABINET:
          console.log('👔 Ejecutando LEGISLATIVE_CABINET');
          handleAICabinetChiefEnact(io, roomId, gameState);
          break;
        
        case GAME_PHASES.EXECUTIVE_POWER:
          console.log('⚡ Ejecutando EXECUTIVE_POWER');
          handleAIExecutivePower(io, roomId, gameState);
          break;
        
        case GAME_PHASES.VETO_DECISION:
          console.log('🚫 Ejecutando VETO_DECISION');
          handleAIVetoResponse(io, roomId, gameState);
          break;
          
        default:
          console.log(`⚠️ Fase desconocida: ${phase}`);
      }
    } catch (error) {
      console.error(`❌ Error en turno de IA: ${error.message}`);
      console.error(error.stack);
    }
  }, 2000 + Math.random() * 2000); // Delay aleatorio 2-4 segundos
}

/**
 * Maneja nominación de IA
 */
function handleAINomination(io, roomId, gameState) {
  const president = gameState.getCurrentPresident();
  
  if (!president.isAI) return;
  
  const ai = getAIInstance(president.id);
  const nomineeId = ai.nominateCabinetChief(gameState, president);
  
  if (nomineeId) {
    const result = gameState.nominateCabinetChief(president.id, nomineeId);
    
    if (result.success) {
      io.to(roomId).emit('cabinet-chief-nominated', {
        gameState: gameState.toJSON()
      });
    }
  }
}

/**
 * Maneja votación de IA
 */
function handleAIVoting(io, roomId, gameState) {
  const aiPlayers = gameState.players.filter(p => p.isAI && !p.isDead);
  
  console.log(`🗳️ Votación IA - Jugadores IA: ${aiPlayers.length}`);
  
  aiPlayers.forEach((aiPlayer, index) => {
    setTimeout(() => {
      const ai = getAIInstance(aiPlayer.id);
      const vote = ai.voteOnGovernment(gameState, aiPlayer);
      
      console.log(`📊 ${aiPlayer.name} vota: ${vote ? 'Sí' : 'No'}`);
      
      const result = gameState.castVote(aiPlayer.id, vote);
      
      if (result.success) {
        const voteCount = Object.keys(gameState.votes).length;
        
        io.to(roomId).emit('vote-cast', {
          playerName: aiPlayer.name,
          voteCount: voteCount,
          totalPlayers: gameState.alivePlayers.length,
          gameState: gameState.toJSON()
        });
        
        // Si todos votaron, procesar resultado
        if (voteCount === gameState.alivePlayers.length) {
          console.log('✅ Todos han votado, procesando resultado...');
          processVotingResult(io, roomId, gameState);
        }
      }
    }, index * 1000); // Escalonar votos
  });
}

/**
 * Procesa el resultado de una votación
 */
function processVotingResult(io, roomId, gameState) {
  // Verificar si ya está procesando
  if (voteProcessingFlags.get(roomId)) {
    console.log('⚠️ Ya se está procesando el resultado de votación, ignorando llamada duplicada');
    return;
  }
  
  // Marcar como en proceso
  voteProcessingFlags.set(roomId, true);
  
  console.log('🔍 Procesando resultado de votación...');
  const voteResult = gameState.countVotes();
  console.log(`📊 Resultado: Aprobado=${voteResult.approved}, Caos=${voteResult.chaos}`);
  
  io.to(roomId).emit('vote-result', {
    result: voteResult,
    gameState: gameState.toJSON()
  });
  
  // Si fue caos
  if (voteResult.chaos) {
    io.to(roomId).emit('chaos-triggered', {
      revealedPolicy: voteResult.revealedPolicy,
      gameState: gameState.toJSON()
    });
    voteProcessingFlags.delete(roomId);
    return;
  }
  
  // Si el gobierno fue aprobado, continuar con fase legislativa
  if (voteResult.approved) {
    console.log('✅ Gobierno aprobado, iniciando fase legislativa...');
    
    // Robar 3 cartas del mazo para el presidente
    const drawResult = gameState.presidentDrawCards();
    const president = gameState.getCurrentPresident();
    
    if (!president) {
      console.error('❌ No se encontró al presidente');
      voteProcessingFlags.delete(roomId);
      return;
    }
    
    io.to(roomId).emit('game-update', {
      gameState: gameState.toJSON(),
      message: 'Gobierno aprobado - Iniciando legislación'
    });
    
    // Iniciar fase legislativa del presidente
    setTimeout(() => {
      if (president.isAI) {
        handleAITurn(io, roomId, gameState, GAME_PHASES.LEGISLATIVE_PRESIDENT);
      } else {
        // Enviar las 3 cartas al presidente humano
        const presidentSocket = io.sockets.sockets.get(president.socketId);
        if (presidentSocket) {
          presidentSocket.emit('receive-policies', {
            cards: drawResult.cards
          });
          console.log(`📤 3 cartas enviadas al Presidente humano: ${president.name}`);
        } else {
          console.error(`❌ Socket del Presidente no encontrado: ${president.socketId}`);
        }
      }
    }, 1000);
  } else {
    // Gobierno rechazado, continuar con siguiente nominación
    console.log('❌ Gobierno rechazado, siguiente presidente...');
    io.to(roomId).emit('game-update', {
      gameState: gameState.toJSON(),
      message: 'Gobierno rechazado - Siguiente presidente'
    });
    
    // Iniciar siguiente nominación
    setTimeout(() => {
      const president = gameState.getCurrentPresident();
      if (president && president.isAI) {
        handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
      }
    }, 1000);
  }
  
  // Liberar el flag
  voteProcessingFlags.delete(roomId);
}

/**
 * Maneja descarte del presidente IA
 */
function handleAIPresidentDiscard(io, roomId, gameState) {
  console.log('🎯 handleAIPresidentDiscard llamada');
  const president = gameState.getCurrentPresident();
  console.log(`👤 Presidente: ${president.name} (IA: ${president.isAI})`);
  
  if (!president.isAI) {
    console.log('⚠️ El presidente no es IA, saliendo...');
    return;
  }
  
  // Las cartas ya fueron robadas en processVotingResult
  console.log(`🃏 Cartas actuales: ${JSON.stringify(gameState.currentPolicyCards)}`);
  
  if (!gameState.currentPolicyCards || gameState.currentPolicyCards.length === 0) {
    console.error('❌ No hay cartas disponibles para el presidente');
    return;
  }
  
  const ai = getAIInstance(president.id);
  const cardIndex = ai.presidentDiscard(gameState.currentPolicyCards, president, gameState);
  console.log(`🗑️ IA descarta carta en índice: ${cardIndex}`);
  
  const result = gameState.presidentDiscardCard(cardIndex);
  console.log(`✅ Resultado del descarte: ${JSON.stringify(result)}`);
  
  if (result.success) {
    io.to(roomId).emit('president-discarded', {
      gameState: gameState.toJSON(),
      message: 'El Presidente descartó una carta'
    });
    
    // Continuar con Jefe de Gabinete
    const cabinetChief = gameState.getPlayerById(gameState.cabinetChiefId);
    console.log(`👔 Jefe de Gabinete: ${cabinetChief.name} (IA: ${cabinetChief.isAI})`);
    
    if (cabinetChief.isAI) {
      console.log('🤖 Jefe de Gabinete es IA, continuando...');
      handleAITurn(io, roomId, gameState, GAME_PHASES.LEGISLATIVE_CABINET);
    } else {
      // Enviar cartas al jugador humano
      console.log('👨 Jefe de Gabinete es humano, enviando cartas...');
      const cabinetChiefSocket = io.sockets.sockets.get(cabinetChief.socketId);
      if (cabinetChiefSocket) {
        cabinetChiefSocket.emit('receive-policies', {
          cards: gameState.currentPolicyCards,
          vetoUnlocked: gameState.vetoUnlocked
        });
      }
    }
  } else {
    console.error(`❌ Error al descartar: ${result.message}`);
  }
}


/**
 * Maneja promulgación del Jefe de Gabinete IA
 */
function handleAICabinetChiefEnact(io, roomId, gameState) {
  console.log('🎯 handleAICabinetChiefEnact llamada');
  const cabinetChief = gameState.getPlayerById(gameState.cabinetChiefId);
  console.log(`👔 Jefe de Gabinete: ${cabinetChief ? cabinetChief.name : 'undefined'} (IA: ${cabinetChief ? cabinetChief.isAI : 'N/A'})`);
  
  if (!cabinetChief || !cabinetChief.isAI) {
    console.log('⚠️ El jefe de gabinete no es IA, saliendo...');
    return;
  }
  
  console.log(`🃏 Cartas disponibles: ${JSON.stringify(gameState.currentPolicyCards)}`);
  
  const ai = getAIInstance(cabinetChief.id);
  
  // Verificar si debe solicitar veto
  const shouldVeto = ai.shouldRequestVeto(gameState.currentPolicyCards, cabinetChief, gameState);
  console.log(`🤔 ¿Debe solicitar veto? ${shouldVeto}, Veto desbloqueado: ${gameState.vetoUnlocked}`);
  
  if (shouldVeto && gameState.vetoUnlocked) {
    console.log('🚫 Solicitando veto...');
    const result = gameState.requestVeto(cabinetChief.id);
    
    if (result.success) {
      io.to(roomId).emit('veto-requested', {
        gameState: gameState.toJSON()
      });
      
      // Esperar respuesta del presidente
      const president = gameState.getCurrentPresident();
      if (president.isAI) {
        console.log('🤖 Presidente IA responderá al veto');
        handleAITurn(io, roomId, gameState, GAME_PHASES.VETO_DECISION);
      } else {
        console.log('👨 Notificando presidente humano sobre veto');
        const presidentSocket = io.sockets.sockets.get(president.socketId);
        if (presidentSocket) {
          presidentSocket.emit('veto-requested', {
            message: 'El Jefe de Gabinete solicita el Veto Presidencial'
          });
        }
      }
      return;
    }
  }
  
  // No veto, promulgar carta
  console.log('📜 Promulgando política...');
  const cardIndex = ai.cabinetChiefEnact(gameState.currentPolicyCards, cabinetChief, gameState);
  console.log(`✅ IA promulga carta en índice: ${cardIndex}`);
  
  const result = gameState.cabinetChiefEnactPolicy(cardIndex);
  console.log(`📊 Resultado de promulgación: ${JSON.stringify(result)}`);
  
  if (result.success) {
    io.to(roomId).emit('policy-enacted', {
      policyType: result.policyType,
      gameState: gameState.toJSON(),
      satiricalText: result.satiricalText,
      message: `Se promulgó una política ${result.policyType === 'libertario' ? 'Libertaria' : 'Kirchnerista'}`
    });
    
    // Verificar condición de victoria
    if (result.gameOver) {
      console.log(`🎮 GAME OVER: ${result.winner} gana`);
      io.to(roomId).emit('game-over', {
        winner: result.winner,
        reason: result.reason,
        gameState: gameState.toJSON()
      });
      return;
    }
    
    // Si hay poder presidencial
    if (result.power) {
      console.log(`💼 Poder presidencial disponible: ${result.power}`);
      io.to(roomId).emit('executive-power-available', {
        power: result.power,
        gameState: gameState.toJSON()
      });
      
      // Si el presidente es IA, ejecutar poder
      const president = gameState.getCurrentPresident();
      if (president.isAI) {
        console.log('🤖 Presidente IA ejecutará poder automáticamente');
        handleAITurn(io, roomId, gameState, GAME_PHASES.EXECUTIVE_POWER);
      } else {
        console.log('👤 Esperando que presidente humano ejecute poder');
      }
    } else {
      // No hay poder, completar ronda y continuar con siguiente presidente
      console.log('⏭️ No hay poder presidencial. Completando ronda...');
      gameState.completeRound();
      
      io.to(roomId).emit('round-completed', {
        gameState: gameState.toJSON(),
        message: 'Ronda completada. Siguiente presidente.'
      });
      
      // Continuar con siguiente turno de nominación
      setTimeout(() => {
        console.log('🔄 Iniciando nueva ronda de nominación');
        handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
      }, 2000);
    }
  } else {
    console.error(`❌ Error al promulgar: ${result.message}`);
  }
}

/**
 * Maneja respuesta al veto del presidente IA
 */
function handleAIVetoResponse(io, roomId, gameState) {
  const president = gameState.getCurrentPresident();
  
  if (!president.isAI) return;
  
  const ai = getAIInstance(president.id);
  const agrees = ai.presidentAgreeVeto(gameState, president);
  
  if (agrees) {
    gameState.failedGovernments++;
    gameState.phase = GAME_PHASES.NOMINATION;
    io.to(roomId).emit('veto-approved', {
      gameState: gameState.toJSON()
    });
  } else {
    gameState.phase = GAME_PHASES.LEGISLATIVE_CABINET;
    const cabinetChief = gameState.getPlayerById(gameState.cabinetChiefId);
    if (cabinetChief) {
      io.to(roomId).emit('veto-rejected', {
        message: 'El presidente rechazó el veto. El Jefe de Gabinete debe promulgar',

        gameState: gameState.toJSON()
      });
    }
  }
}

/**
 * Maneja poderes ejecutivos de IA
 */
function handleAIExecutivePower(io, roomId, gameState) {
  const president = gameState.getCurrentPresident();
  
  if (!president || !president.isAI) {
    console.log('⚠️ Presidente no es IA o no existe');
    return;
  }
  
  const ai = getAIInstance(president.id);
  const power = gameState.currentPower;
  
  console.log(`⚡ Ejecutando poder: ${power} para presidente ${president.name}`);
  
  if (power === 'peek') {
    // IA ve las 3 cartas (solo para su lógica)
    const topThree = gameState.deck.slice(0, 3);
    ai.updateAfterPeek(topThree);
    
    console.log(`👀 Poder PEEK ejecutado por IA`);
    
    io.to(roomId).emit('power-executed', {
      power: 'peek',
      gameState: gameState.toJSON(),
      message: 'Poder ejecutado por IA'
    });
    
    // Completar ronda y continuar
    gameState.completeRound();
    io.to(roomId).emit('game-update', {
      gameState: gameState.toJSON(),
      message: 'Poder ejecutado - Siguiente presidente'
    });
    
    setTimeout(() => {
      const president = gameState.getCurrentPresident();
      if (president && president.isAI) {
        handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
      }
    }, 1000);
  } 
  else if (power === 'investigate') {
    const targetId = ai.chooseInvestigationTarget(gameState, president);
    console.log(`🕵️ Poder INVESTIGATE: target=${targetId}`);
    if (targetId) {
      const targetPlayer = gameState.getPlayerById(targetId);
      targetPlayer.wasInvestigated = true;
      
      // IA "aprende" del resultado
      const loyalty = targetPlayer.role.team;
      ai.updateAfterInvestigation(targetId, loyalty);
      
      io.to(roomId).emit('power-executed', {
        power: 'investigate',
        targetPlayerName: targetPlayer.name,
        gameState: gameState.toJSON()
      });
      
      // Completar ronda y continuar
      gameState.completeRound();
      io.to(roomId).emit('game-update', {
        gameState: gameState.toJSON(),
        message: 'Investigación completada - Siguiente presidente'
      });
      
      setTimeout(() => {
        const president = gameState.getCurrentPresident();
        if (president && president.isAI) {
          handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
        }
      }, 1000);
    }
  }
  else if (power === 'special-election') {
    const targetId = ai.chooseSpecialElectionTarget(gameState, president);
    console.log(`🗳️ Poder SPECIAL ELECTION: target=${targetId}`);
    if (targetId) {
      const targetPlayer = gameState.getPlayerById(targetId);
      gameState.specialElectionActive = true;
      const nextPresidentIndex = gameState.players.findIndex(p => p.id === targetId);
      gameState.presidentIndex = nextPresidentIndex - 1;
      
      io.to(roomId).emit('power-executed', {
        power: 'special-election',
        nextPresidentName: targetPlayer.name,
        message: `${targetPlayer.name} será el próximo Presidente`,
        gameState: gameState.toJSON()
      });
      
      // Completar ronda y continuar con el nuevo presidente
      gameState.completeRound();
      io.to(roomId).emit('game-update', {
        gameState: gameState.toJSON(),
        message: 'Sesión Especial - Nuevo presidente elegido'
      });
      
      setTimeout(() => {
        const president = gameState.getCurrentPresident();
        if (president && president.isAI) {
          handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
        }
      }, 1000);
    }
  }
  else if (power === 'execution') {
    const targetId = ai.chooseExecutionTarget(gameState, president);
    console.log(`💀 Poder EXECUTION: target=${targetId}`);
    if (targetId) {
      const targetPlayer = gameState.getPlayerById(targetId);
      targetPlayer.isDead = true;
      gameState.alivePlayers = gameState.players.filter(p => !p.isDead);
      
      const wasElJefe = targetPlayer.role.name === 'El Jefe';
      
      io.to(roomId).emit('power-executed', {
        power: 'execution',
        executedPlayerName: targetPlayer.name,
        wasElJefe: wasElJefe,
        message: `${targetPlayer.name} ha sido ejecutado`,
        gameState: gameState.toJSON()
      });
      
      // Verificar game over (si mataron a El Jefe)
      if (wasElJefe) {
        io.to(roomId).emit('game-over', {
          winner: 'libertarian',
          reason: '¡El Jefe fue ejecutado!',
          gameState: gameState.toJSON()
        });
      } else {
        // Completar ronda y continuar
        gameState.completeRound();
        io.to(roomId).emit('game-update', {
          gameState: gameState.toJSON(),
          message: 'Jugador ejecutado - Siguiente presidente'
        });
        
        setTimeout(() => {
          const president = gameState.getCurrentPresident();
          if (president && president.isAI) {
            handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
          }
        }, 1000);
      }
    }
  }
}

/**
 * Actualiza niveles de confianza después de votación
 */
function updateAITrustLevels(gameState, voteResult) {
  gameState.getAIPlayers().forEach(aiPlayer => {
    const ai = getAIInstance(aiPlayer.id);
    ai.updateTrustLevels(gameState, gameState.presidentId, gameState.cabinetChiefId, voteResult.enactedPolicy);
  });
}

module.exports = {
  createAIInstance,
  getAIInstance,
  removeAIInstance,
  clearRoomAIs,
  handleAITurn,
  updateAITrustLevels,
  processVotingResult
};
