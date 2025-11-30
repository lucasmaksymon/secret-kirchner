/**
 * @fileoverview Manejo de Socket.IO para El Secreto de Kirchner
 * @module socket/gameSocket
 */

const { GameState, GAME_PHASES } = require('../game/gameState');
const { 
  executePeekPower, 
  executeInvestigatePower, 
  executeSpecialElectionPower, 
  executeExecutionPower 
} = require('../game/powers');
const { 
  createAIInstance, 
  removeAIInstance, 
  clearRoomAIs, 
  handleAITurn 
} = require('../game/aiController');
const { generateAIName, AI_DIFFICULTY } = require('../game/aiPlayer');
const { GAME_CONFIG, SOCKET_EVENTS, ERROR_MESSAGES } = require('../config/constants');
const { createLogger } = require('../utils/logger');

const logger = createLogger('Socket');

/** @type {Map<string, GameState>} Almacenamiento de salas en memoria */
const rooms = new Map();

/**
 * Inicializa Socket.IO con todos los event handlers
 * @param {import('socket.io').Server} io - Instancia de Socket.IO server
 */
function initializeSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`Jugador conectado: ${socket.id}`);

    /**
     * Crea una nueva sala de juego
     * @param {Object} data - Datos de la sala
     * @param {string} data.roomName - Nombre de la sala
     * @param {string} data.playerName - Nombre del jugador host
     */
    socket.on(SOCKET_EVENTS.CREATE_ROOM, (data) => {
      try {
        const { roomName, playerName } = data || {};
        
        if (!roomName || !playerName) {
          socket.emit('error', { message: 'Nombre de sala y jugador son requeridos' });
          return;
        }

        const roomId = generateRoomId();
        const gameState = new GameState(roomId, roomName, null);
        const result = gameState.addPlayer(socket.id, playerName);
        
        if (result.success) {
          gameState.hostId = result.player.id;
          rooms.set(roomId, gameState);
          socket.join(roomId);
          socket.data.roomId = roomId;
          socket.data.playerId = result.player.id;
          
          socket.emit('room-created', {
            roomId: roomId,
            playerId: result.player.id,
            gameState: gameState.toJSON()
          });
          
          logger.info(`Sala creada: ${roomName} (${roomId})`);
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error al crear sala:', error);
        socket.emit('error', { message: 'Error al crear la sala' });
      }
    });

    /**
     * Permite a un jugador unirse a una sala existente
     * @param {Object} data - Datos de unión
     * @param {string} data.roomId - ID de la sala
     * @param {string} data.playerName - Nombre del jugador
     */
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
      try {
        const { roomId, playerName } = data || {};
        
        if (!roomId || !playerName) {
          socket.emit('error', { message: 'ID de sala y nombre de jugador son requeridos' });
          return;
        }

        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        const result = gameState.addPlayer(socket.id, playerName, false);
        
        if (result.success) {
          socket.join(roomId);
          socket.data.roomId = roomId;
          socket.data.playerId = result.player.id;
          
          socket.emit('room-joined', {
            playerId: result.player.id,
            gameState: gameState.toJSON()
          });
          
          io.to(roomId).emit('player-joined', {
            player: result.player,
            gameState: gameState.toJSON()
          });
          
          logger.info(`${playerName} se unió a ${roomId}`);
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error al unirse a sala:', error);
        socket.emit('error', { message: 'Error al unirse a la sala' });
      }
    });

    /**
     * Permite a un jugador reconectarse a una sala existente
     * @param {Object} data - Datos de reconexión
     * @param {string} data.roomId - ID de la sala
     * @param {string} data.playerId - ID del jugador
     */
    socket.on('rejoin-room', (data) => {
      const { roomId, playerId } = data;
      const gameState = rooms.get(roomId);
      
      if (!gameState) {
        socket.emit('error', { message: 'Sala no encontrada o ya no existe' });
        return;
      }

      const player = gameState.getPlayerById(playerId);
      
      if (!player) {
        socket.emit('error', { message: 'Jugador no encontrado en esta sala' });
        return;
      }

      player.socketId = socket.id;
      socket.data.roomId = roomId;
      socket.data.playerId = playerId;
      socket.join(roomId);

      const responseData = {
        playerId: player.id,
        gameState: gameState.toJSON()
      };

      if (gameState.gameStarted && player.role) {
        responseData.role = player.role;
        
        if (player.role.initialKnowledge) {
          const knownPlayers = player.role.initialKnowledge
            .map((knownId) => {
              const knownPlayer = gameState.getPlayerById(knownId);
              if (knownPlayer && knownPlayer.role) {
                return {
                  id: knownPlayer.id,
                  name: knownPlayer.name,
                  team: knownPlayer.role.team,
                  type: knownPlayer.role.type
                };
              }
              return null;
            })
            .filter((p) => p !== null);
          
          responseData.knownPlayers = knownPlayers;
        }
      }

      socket.emit('room-rejoined', responseData);

      socket.to(roomId).emit('player-reconnected', {
        playerName: player.name,
        message: `${player.name} se reconectó`
      });

      logger.info(`Jugador ${player.name} se reconectó a sala ${roomId}`);
    });

    /**
     * Agrega un jugador IA a la sala
     * @param {Object} data - Datos de la IA
     * @param {string} [data.difficulty] - Dificultad de la IA ('easy' | 'medium' | 'hard')
     */
    socket.on(SOCKET_EVENTS.ADD_AI, (data) => {
      try {
        const { difficulty } = data || {};
        const roomId = socket.data.roomId;
        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        // Verificar que es el host
        const player = getValidatedPlayer(gameState, socket.data.playerId);
        if (!player || !isHost(gameState, player.id)) {
          socket.emit('error', { message: ERROR_MESSAGES.NOT_HOST });
          return;
        }
        
        if (gameState.gameStarted) {
          socket.emit('error', { message: ERROR_MESSAGES.CANNOT_ADD_AI_AFTER_START });
          return;
        }
        
        let aiName;
        let aiIndex = 0;
        let nameExists = true;
        
        while (nameExists && aiIndex < GAME_CONFIG.MAX_AI_NAME_ATTEMPTS) {
          aiName = generateAIName(aiIndex);
          nameExists = gameState.players.some(p => p.name === aiName);
          if (nameExists) {
            aiIndex++;
          }
        }
        
        if (nameExists) {
          aiName = `Bot IA ${Date.now() % 10000}`;
        }
        
        const result = gameState.addPlayer(`ai-${Date.now()}`, aiName, true);
        
        if (result.success) {
          const aiDifficulty = difficulty || AI_DIFFICULTY.MEDIUM;
          createAIInstance(result.player.id, aiDifficulty);
          
          io.to(roomId).emit('player-joined', {
            player: result.player,
            gameState: gameState.toJSON()
          });
          
          socket.emit('ai-added', {
            player: result.player,
            gameState: gameState.toJSON(),
            message: `IA ${aiName} agregada`
          });
          
          logger.info(`IA ${aiName} agregada a ${roomId}`);
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error al agregar IA:', error);
        socket.emit('error', { message: 'Error al agregar IA' });
      }
    });

    /**
     * Remueve un jugador IA de la sala
     * @param {Object} data - Datos de la IA
     * @param {string} data.aiPlayerId - ID del jugador IA a remover
     */
    socket.on(SOCKET_EVENTS.REMOVE_AI, (data) => {
      try {
        const { aiPlayerId } = data || {};
        const roomId = socket.data.roomId;
        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        if (!aiPlayerId) {
          socket.emit('error', { message: 'ID de jugador IA requerido' });
          return;
        }
        
        // Verificar que es el host
        const player = getValidatedPlayer(gameState, socket.data.playerId);
        if (!player || !isHost(gameState, player.id)) {
          socket.emit('error', { message: ERROR_MESSAGES.NOT_HOST });
          return;
        }
        
        const aiPlayer = gameState.getPlayerById(aiPlayerId);
        if (!aiPlayer) {
          socket.emit('error', { message: ERROR_MESSAGES.AI_NOT_FOUND });
          return;
        }
        
        if (!aiPlayer.isAI) {
          socket.emit('error', { message: ERROR_MESSAGES.NOT_AI });
          return;
        }
        
        const removedPlayer = gameState.removePlayer(aiPlayer.socketId);
        if (removedPlayer) {
          removeAIInstance(aiPlayerId);
          
          io.to(roomId).emit('player-left', {
            playerName: removedPlayer.name,
            gameState: gameState.toJSON()
          });
          
          logger.info(`IA ${removedPlayer.name} removida de ${roomId}`);
        } else {
          socket.emit('error', { message: 'No se pudo remover la IA' });
        }
      } catch (error) {
        logger.error('Error al remover IA:', error);
        socket.emit('error', { message: 'Error al remover IA' });
      }
    });

    /**
     * Obtiene la lista de salas disponibles
     */
    socket.on(SOCKET_EVENTS.GET_ROOMS, () => {
      try {
        const roomList = Array.from(rooms.values())
          .filter(room => !room.gameStarted)
          .map(room => ({
            roomId: room.roomId,
            roomName: room.roomName,
            playerCount: room.players.length,
            maxPlayers: room.settings.maxPlayers
          }));
        
        socket.emit('rooms-list', roomList);
      } catch (error) {
        logger.error('Error al obtener lista de salas:', error);
        socket.emit('error', { message: 'Error al obtener lista de salas' });
      }
    });

    /**
     * Inicia el juego en la sala actual
     */
    socket.on(SOCKET_EVENTS.START_GAME, () => {
      try {
        const roomId = socket.data.roomId;
        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        // Verificar que es el host
        const player = getValidatedPlayer(gameState, socket.data.playerId);
        if (!player || !isHost(gameState, player.id)) {
          socket.emit('error', { message: ERROR_MESSAGES.NOT_HOST });
          return;
        }
        
        const result = gameState.startGame();
        
        if (result.success) {
          gameState.players.forEach(p => {
            const playerSocket = io.sockets.sockets.get(p.socketId);
            if (playerSocket) {
              const knownPlayers = result.knowledge[p.id].knows;
              playerSocket.emit('role-assigned', {
                role: p.role,
                knownPlayers: knownPlayers
              });
            }
          });
          
          io.to(roomId).emit('game-started', {
            gameState: gameState.toJSON(),
            message: result.message
          });
          
          gameState.startNominationPhase();
          io.to(roomId).emit('game-update', {
            gameState: gameState.toJSON(),
            message: 'Fase de nominación'
          });
          
          setTimeout(() => {
            const president = gameState.getCurrentPresident();
            if (president && president.isAI) {
              handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
            }
          }, 1000);
          
          logger.info(`Juego iniciado en sala ${roomId}`);
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error al iniciar juego:', error);
        socket.emit('error', { message: 'Error al iniciar el juego' });
      }
    });

    /**
     * Nomina un Jefe de Gabinete
     * @param {Object} data - Datos de nominación
     * @param {string} data.cabinetChiefId - ID del jugador a nominar
     */
    socket.on(SOCKET_EVENTS.NOMINATE_CABINET_CHIEF, (data) => {
      try {
        const { cabinetChiefId } = data || {};
        const roomId = socket.data.roomId;
        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        if (!cabinetChiefId) {
          socket.emit('error', { message: 'ID de Jefe de Gabinete requerido' });
          return;
        }
        
        const result = gameState.nominateCabinetChief(socket.data.playerId, cabinetChiefId);
        
        if (result.success) {
          io.to(roomId).emit('cabinet-chief-nominated', {
            cabinetChiefId: result.cabinetChiefId,
            gameState: gameState.toJSON(),
            message: result.message
          });
          
          handleAITurn(io, roomId, gameState, GAME_PHASES.ELECTION);
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error al nominar Jefe de Gabinete:', error);
        socket.emit('error', { message: 'Error al nominar Jefe de Gabinete' });
      }
    });

    /**
     * Emite un voto en la elección actual
     * @param {Object} data - Datos del voto
     * @param {boolean} data.vote - true para "Ja!" (sí), false para "Nein!" (no)
     */
    socket.on(SOCKET_EVENTS.CAST_VOTE, (data) => {
      try {
        const { vote } = data || {};
        const roomId = socket.data.roomId;
        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        if (typeof vote !== 'boolean') {
          socket.emit('error', { message: 'Voto inválido' });
          return;
        }
        
        const result = gameState.castVote(socket.data.playerId, vote);
        
        if (result.success) {
          const voteCount = Object.keys(gameState.votes).length;
          
          io.to(roomId).emit('vote-cast', {
            playerId: socket.data.playerId,
            voteCount: voteCount,
            totalVoters: gameState.alivePlayers.length,
            gameState: gameState.toJSON()
          });
          
          if (voteCount === gameState.alivePlayers.length) {
            // Todos votaron, emitir evento para que el cliente muestre botón "Continuar"
            io.to(roomId).emit('all-votes-cast', {
              gameState: gameState.toJSON(),
              message: 'Todos los jugadores han votado'
            });
          } else {
            handleAITurn(io, roomId, gameState, GAME_PHASES.ELECTION);
          }
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error al emitir voto:', error);
        socket.emit('error', { message: 'Error al emitir voto' });
      }
    });

    /**
     * Procesa el resultado de la votación cuando todos han votado
     */
    socket.on(SOCKET_EVENTS.PROCESS_VOTE_RESULT, () => {
      try {
        const roomId = socket.data.roomId;
        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        if (gameState.phase !== GAME_PHASES.ELECTION) {
          socket.emit('error', { message: 'No hay una votación en curso' });
          return;
        }
        
        const voteCount = Object.keys(gameState.votes).length;
        if (voteCount !== gameState.alivePlayers.length) {
          socket.emit('error', { message: 'No todos los jugadores han votado' });
          return;
        }
        
        const { processVotingResult } = require('../game/aiController');
        processVotingResult(io, roomId, gameState);
      } catch (error) {
        logger.error('Error al procesar resultado de votación:', error);
        socket.emit('error', { message: 'Error al procesar resultado de votación' });
      }
    });

    /**
     * El presidente descarta una carta de las 3 recibidas
     * @param {Object} data - Datos de descarte
     * @param {number} data.cardIndex - Índice de la carta a descartar (0-2)
     */
    socket.on(SOCKET_EVENTS.PRESIDENT_DISCARD, (data) => {
      try {
        const { cardIndex } = data || {};
        const roomId = socket.data.roomId;
        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        if (typeof cardIndex !== 'number' || cardIndex < 0) {
          socket.emit('error', { message: 'Índice de carta inválido' });
          return;
        }
        
        const result = gameState.presidentDiscardCard(cardIndex);
        
        if (result.success) {
          io.to(roomId).emit('president-discarded', {
            gameState: gameState.toJSON(),
            message: 'El Presidente descartó una carta'
          });
          
          const cabinetChief = gameState.getPlayerById(gameState.cabinetChiefId);
          
          if (cabinetChief && cabinetChief.isAI) {
            handleAITurn(io, roomId, gameState, GAME_PHASES.LEGISLATIVE_CABINET);
          } else if (cabinetChief) {
            const cabinetChiefSocket = io.sockets.sockets.get(cabinetChief.socketId);
            
            if (cabinetChiefSocket) {
              cabinetChiefSocket.emit('receive-policies', {
                cards: gameState.currentPolicyCards,
                vetoUnlocked: gameState.vetoUnlocked
              });
            } else {
              logger.warn(`Socket del Jefe de Gabinete no encontrado: ${cabinetChief.socketId}`);
            }
          }
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error al descartar carta:', error);
        socket.emit('error', { message: 'Error al descartar carta' });
      }
    });

    /**
     * El Jefe de Gabinete promulga una de las 2 cartas restantes
     * @param {Object} data - Datos de promulgación
     * @param {number} data.cardIndex - Índice de la carta a promulgar (0-1)
     */
    socket.on(SOCKET_EVENTS.CABINET_CHIEF_ENACT, (data) => {
      try {
        const { cardIndex } = data || {};
        const roomId = socket.data.roomId;
        const gameState = rooms.get(roomId);
        
        if (!gameState) {
          socket.emit('error', { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
          return;
        }
        
        if (typeof cardIndex !== 'number' || cardIndex < 0) {
          socket.emit('error', { message: 'Índice de carta inválido' });
          return;
        }
        
        const result = gameState.cabinetChiefEnactPolicy(cardIndex);
        
        if (result.success) {
          io.to(roomId).emit('policy-enacted', {
            policy: result.enactedPolicy,
            kirchneristaPolicies: gameState.kirchneristaPolicies,
            libertarianPolicies: gameState.libertarianPolicies,
            satiricalText: result.satiricalText,
            gameState: gameState.toJSON(),
            message: `Se promulgó una política ${result.enactedPolicy.type === 'libertario' ? 'Libertaria' : 'Kirchnerista'}`
          });
          
          if (result.gameOver) {
            io.to(roomId).emit('game-over', {
              winner: result.winner,
              reason: result.winReason,
              gameState: gameState.toJSON()
            });
            return;
          }
          
          // Si hay poder presidencial, activarlo
          if (result.power) {
            io.to(roomId).emit('executive-power-available', {
              power: result.power,
              gameState: gameState.toJSON()
            });
            
            // Si el presidente es IA, ejecutar poder automáticamente
            const president = gameState.getCurrentPresident();
            if (president && president.isAI) {
              handleAITurn(io, roomId, gameState, GAME_PHASES.EXECUTIVE_POWER);
            }
            // Si es humano, esperar a que ejecute el poder (no completar ronda aún)
          } else {
            // No hay poder, completar ronda y continuar con siguiente presidente
            gameState.completeRound();
            
            io.to(roomId).emit('round-completed', {
              gameState: gameState.toJSON(),
              message: 'Ronda completada. Siguiente presidente.'
            });
            
            setTimeout(() => {
              const president = gameState.getCurrentPresident();
              if (president && president.isAI) {
                handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
              }
            }, 1000);
          }
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error al promulgar decreto:', error);
        socket.emit('error', { message: 'Error al promulgar decreto' });
      }
    });

    // ==================== VETO ====================

    socket.on('request-veto', () => {
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const result = gameState.requestVeto(socket.data.playerId);
      
      if (result.success) {
        io.to(roomId).emit('veto-requested', {
          gameState: gameState.toJSON()
        });
        
        const president = gameState.getCurrentPresident();
        
        // Si el presidente es IA, responder automáticamente
        if (president.isAI) {
          handleAITurn(io, roomId, gameState, GAME_PHASES.VETO_DECISION);
        } else {
          // Notificar al Presidente humano
          const presidentSocket = io.sockets.sockets.get(president.socketId);
          
          if (presidentSocket) {
            presidentSocket.emit('veto-requested', {
              message: 'El Jefe de Gabinete solicita el Veto Presidencial'
            });
          }
        }
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    socket.on('respond-veto', (data) => {
      const { accepts } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const result = gameState.respondToVeto(socket.data.playerId, accepts);
      
      if (result.success) {
        io.to(roomId).emit('veto-result', {
          vetoAccepted: result.vetoAccepted,
          vetoRejected: result.vetoRejected,
          failedGovernments: result.failedGovernments,
          chaos: result.chaos,
          gameState: gameState.toJSON()
        });
        
        if (result.chaos) {
          io.to(roomId).emit('chaos-triggered', {
            revealedPolicy: result.revealedPolicy,
            gameState: gameState.toJSON()
          });
        }
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // ==================== PODERES PRESIDENCIALES ====================

    socket.on('execute-peek', () => {
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const result = executePeekPower(gameState.deck);
      
      if (result.success) {
        socket.emit('peek-result', {
          cards: result.cards,
          message: result.message
        });
        
        io.to(roomId).emit('power-executed', {
          power: 'peek',
          gameState: gameState.toJSON()
        });
        
        // Completar ronda automáticamente
        gameState.completeRound();
        io.to(roomId).emit('game-update', {
          gameState: gameState.toJSON(),
          message: 'Poder ejecutado - Siguiente presidente'
        });
        
        handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
      }
    });

    socket.on('execute-investigate', (data) => {
      const { targetPlayerId } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const targetPlayer = gameState.getPlayerById(targetPlayerId);
      const result = executeInvestigatePower(targetPlayer);
      
      if (result.success) {
        targetPlayer.wasInvestigated = true;
        
        socket.emit('investigate-result', {
          playerId: result.playerId,
          playerName: result.playerName,
          loyalty: result.loyalty,
          message: result.message
        });
        
        io.to(roomId).emit('power-executed', {
          power: 'investigate',
          targetPlayerName: result.playerName,
          gameState: gameState.toJSON()
        });
        
        // Completar ronda automáticamente
        gameState.completeRound();
        io.to(roomId).emit('game-update', {
          gameState: gameState.toJSON(),
          message: 'Investigación completada - Siguiente presidente'
        });
        
        handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    socket.on('execute-special-election', (data) => {
      const { targetPlayerId } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const targetPlayer = gameState.getPlayerById(targetPlayerId);
      const currentPresident = gameState.getCurrentPresident();
      const result = executeSpecialElectionPower(targetPlayer, currentPresident);
      
      if (result.success) {
        // Establecer al jugador elegido como próximo presidente
        gameState.specialElectionActive = true;
        const nextPresidentIndex = gameState.players.findIndex(p => p.id === targetPlayerId);
        gameState.presidentIndex = nextPresidentIndex - 1; // Será incrementado en completeRound
        
        io.to(roomId).emit('power-executed', {
          power: 'special-election',
          nextPresidentName: result.nextPresidentName,
          message: result.message,
          gameState: gameState.toJSON()
        });
        
        // Completar ronda automáticamente
        gameState.completeRound();
        io.to(roomId).emit('game-update', {
          gameState: gameState.toJSON(),
          message: 'Sesión Especial - Nuevo presidente elegido'
        });
        
        handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    socket.on('execute-execution', (data) => {
      const { targetPlayerId } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const targetPlayer = gameState.getPlayerById(targetPlayerId);
      const result = executeExecutionPower(targetPlayer, gameState.players);
      
      if (result.success) {
        // Actualizar lista de jugadores vivos
        gameState.alivePlayers = gameState.players.filter(p => !p.isDead);
        
        io.to(roomId).emit('power-executed', {
          power: 'execution',
          executedPlayerName: result.executedPlayerName,
          wasElJefe: result.wasElJefe,
          message: result.message,
          gameState: gameState.toJSON()
        });
        
        // Verificar game over
        if (result.gameOver) {
          io.to(roomId).emit('game-over', {
            winner: result.gameOver.winner,
            reason: result.gameOver.reason,
            gameState: gameState.toJSON()
          });
        } else {
          // Completar ronda automáticamente
          gameState.completeRound();
          io.to(roomId).emit('game-update', {
            gameState: gameState.toJSON(),
            message: 'Jugador ejecutado - Siguiente presidente'
          });
          
          handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
        }
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // ==================== CHAT ====================

    socket.on('send-message', (data) => {
      const { message } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const player = gameState.getPlayerById(socket.data.playerId);
      if (player) {
        io.to(roomId).emit('chat-message', {
          playerName: player.name,
          playerId: player.id,
          message: message,
          timestamp: Date.now()
        });
      }
    });

    // ==================== CHAT DE VOZ ====================

    // Usuario se une al chat de voz
    socket.on('voice-join', (data) => {
      const { roomId, playerId } = data;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const player = gameState.getPlayerById(playerId);
      if (!player) return;

      socket.data.voiceRoomId = roomId;
      socket.data.voicePlayerId = playerId;
      
      // Notificar a todos los demás usuarios en la sala
      socket.to(roomId).emit('voice-user-joined', {
        playerId: playerId,
        playerName: player.name
      });
      
      logger.debug(`${player.name} se unió al chat de voz en ${roomId}`);
    });

    // Usuario deja el chat de voz
    socket.on('voice-leave', (data) => {
      const { roomId, playerId } = data;
      
      socket.to(roomId).emit('voice-user-left', {
        playerId: playerId
      });
      
      socket.data.voiceRoomId = null;
      socket.data.voicePlayerId = null;
      
      logger.debug(`Usuario ${playerId} dejó el chat de voz`);
    });

    // Señalización WebRTC - Oferta
    socket.on('voice-offer', (data) => {
      const { roomId, to, offer } = data;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const fromPlayer = gameState.getPlayerById(socket.data.playerId);
      if (!fromPlayer) return;

      // Encontrar el socket del destinatario
      const toPlayer = gameState.getPlayerById(to);
      if (!toPlayer) return;

      const toSocket = io.sockets.sockets.get(toPlayer.socketId);
      if (toSocket) {
        toSocket.emit('voice-offer', {
          from: socket.data.playerId,
          playerName: fromPlayer.name,
          offer: offer
        });
      }
    });

    // Señalización WebRTC - Respuesta
    socket.on('voice-answer', (data) => {
      const { roomId, to, answer } = data;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;

      const toPlayer = gameState.getPlayerById(to);
      if (!toPlayer) return;

      const toSocket = io.sockets.sockets.get(toPlayer.socketId);
      if (toSocket) {
        toSocket.emit('voice-answer', {
          from: socket.data.playerId,
          answer: answer
        });
      }
    });

    // Señalización WebRTC - Candidato ICE
    socket.on('voice-ice-candidate', (data) => {
      const { roomId, to, candidate } = data;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;

      const toPlayer = gameState.getPlayerById(to);
      if (!toPlayer) return;

      const toSocket = io.sockets.sockets.get(toPlayer.socketId);
      if (toSocket) {
        toSocket.emit('voice-ice-candidate', {
          from: socket.data.playerId,
          candidate: candidate
        });
      }
    });

    // Estado de mute del usuario
    socket.on('voice-mute-status', (data) => {
      const { roomId, playerId, isMuted } = data;
      
      socket.to(roomId).emit('voice-user-muted', {
        playerId: playerId,
        isMuted: isMuted
      });
    });

    // ==================== DESCONEXIÓN ====================

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        const gameState = rooms.get(roomId);
        if (gameState) {
          const player = gameState.removePlayer(socket.id);
          
          if (player) {
            io.to(roomId).emit('player-left', {
              playerName: player.name,
              gameState: gameState.toJSON()
            });
            
            // Si la sala queda vacía, eliminarla
            if (gameState.players.length === 0) {
              clearRoomAIs(gameState);
              rooms.delete(roomId);
              logger.info(`Sala ${roomId} eliminada (vacía)`);
            }
          }
        }
      }
      
      logger.info(`Jugador desconectado: ${socket.id}`);
    });
  });

  logger.info('Socket.IO inicializado');
}

/**
 * Genera un ID único para las salas
 * @returns {string} ID de sala único de 6 caracteres alfanuméricos
 */
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  for (let i = 0; i < GAME_CONFIG.ROOM_ID_LENGTH; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomId;
}

/**
 * Valida que el jugador sea el host de la sala
 * @param {GameState} gameState - Estado del juego
 * @param {string} playerId - ID del jugador a validar
 * @returns {boolean} True si el jugador es el host
 */
function isHost(gameState, playerId) {
  return gameState.hostId === playerId;
}

/**
 * Obtiene el jugador y valida su existencia
 * @param {GameState} gameState - Estado del juego
 * @param {string} playerId - ID del jugador a obtener
 * @returns {Object|null} Objeto jugador o null si no existe
 */
function getValidatedPlayer(gameState, playerId) {
  if (!gameState) return null;
  return gameState.getPlayerById(playerId) || null;
}

module.exports = { initializeSocket };

