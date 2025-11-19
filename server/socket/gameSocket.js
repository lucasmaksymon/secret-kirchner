/**
 * Manejo de Socket.IO para El Secreto de Kirchner
 * Gestiona toda la comunicación en tiempo real
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

// Almacenamiento de salas en memoria
const rooms = new Map();

/**
 * Inicializa Socket.IO con todos los event handlers
 */
function initializeSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Jugador conectado: ${socket.id}`);

    // ==================== LOBBY ====================

    // Crear sala
    socket.on('create-room', (data) => {
      const { roomName, playerName } = data;
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
        
        console.log(`🎮 Sala creada: ${roomName} (${roomId})`);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // Unirse a sala
    socket.on('join-room', (data) => {
      const { roomId, playerName } = data;
      const gameState = rooms.get(roomId);
      
      if (!gameState) {
        socket.emit('error', { message: 'Sala no encontrada' });
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
        
        // Notificar a todos
        io.to(roomId).emit('player-joined', {
          player: result.player,
          gameState: gameState.toJSON()
        });
        
        console.log(`👤 ${playerName} se unió a ${roomId}`);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // Reconectar a sala existente
    socket.on('rejoin-room', (data) => {
      const { roomId, playerId } = data;
      const gameState = rooms.get(roomId);
      
      if (!gameState) {
        socket.emit('error', { message: 'Sala no encontrada o ya no existe' });
        return;
      }

      // Buscar al jugador por su ID original
      const player = gameState.getPlayerById(playerId);
      
      if (!player) {
        socket.emit('error', { message: 'Jugador no encontrado en esta sala' });
        return;
      }

      // Actualizar el socketId del jugador
      player.socketId = socket.id;
      socket.data.roomId = roomId;
      socket.data.playerId = playerId;
      socket.join(roomId);

      // Preparar datos de respuesta
      const responseData = {
        playerId: player.id,
        gameState: gameState.toJSON()
      };

      // Si el juego ya comenzó, enviar también el rol y jugadores conocidos
      if (gameState.gameStarted && player.role) {
        responseData.role = player.role;
        
        // Calcular jugadores conocidos
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

      // Notificar a otros jugadores
      socket.to(roomId).emit('player-reconnected', {
        playerName: player.name,
        message: `${player.name} se reconectó`
      });

      console.log(`🔄 Jugador ${player.name} se reconectó a sala ${roomId}`);
    });

    // Agregar IA a la sala
    socket.on('add-ai', (data) => {
      const { difficulty } = data || {};
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      console.log(`🤖 Intentando agregar IA. Jugadores actuales: ${gameState?.players.length || 0}`);
      
      if (!gameState) {
        socket.emit('error', { message: 'Sala no encontrada' });
        return;
      }
      
      // Verificar que es el host
      const player = gameState.getPlayerById(socket.data.playerId);
      if (!player || gameState.hostId !== player.id) {
        console.log(`❌ Permiso denegado: No es el host`);
        socket.emit('error', { message: 'Solo el host puede agregar IAs' });
        return;
      }
      
      if (gameState.gameStarted) {
        console.log(`❌ Juego ya iniciado`);
        socket.emit('error', { message: 'No se pueden agregar IAs una vez iniciado el juego' });
        return;
      }
      
      // Generar nombre único para la IA
      let aiName;
      let aiIndex = 0;
      let nameExists = true;
      
      // Buscar un nombre que no exista
      while (nameExists && aiIndex < 50) {
        aiName = generateAIName(aiIndex);
        nameExists = gameState.players.some(p => p.name === aiName);
        if (nameExists) {
          aiIndex++;
        }
      }
      
      // Si todos los nombres están ocupados, usar timestamp
      if (nameExists) {
        aiName = `Bot IA ${Date.now() % 10000}`;
      }
      
      console.log(`🎲 Intentando agregar IA "${aiName}". Total jugadores: ${gameState.players.length}/${gameState.settings.maxPlayers}`);
      
      const result = gameState.addPlayer(`ai-${Date.now()}`, aiName, true);
      
      if (result.success) {
        // Crear instancia de IA con dificultad especificada
        const aiDifficulty = difficulty || AI_DIFFICULTY.MEDIUM;
        createAIInstance(result.player.id, aiDifficulty);
        
        console.log(`✅ IA ${aiName} agregada exitosamente. Total jugadores: ${gameState.players.length}`);
        
        // Notificar a todos
        io.to(roomId).emit('player-joined', {
          player: result.player,
          gameState: gameState.toJSON()
        });
        
        socket.emit('ai-added', {
          player: result.player,
          gameState: gameState.toJSON(),
          message: `IA ${aiName} agregada`
        });
        
        console.log(`🤖 IA ${aiName} agregada a ${roomId}`);
      } else {
        console.log(`❌ Error al agregar IA: ${result.message}`);
        socket.emit('error', { message: result.message });
      }
    });

    // Remover IA de la sala
    socket.on('remove-ai', (data) => {
      const { aiPlayerId } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      console.log(`🗑️ Intentando remover IA: ${aiPlayerId}`);
      
      if (!gameState) {
        socket.emit('error', { message: 'Sala no encontrada' });
        return;
      }
      
      console.log(`📊 Jugadores antes de remover: ${gameState.players.length}`);
      console.log(`👥 Lista de jugadores: ${gameState.players.map(p => `${p.name} (${p.isAI ? 'IA' : 'Humano'})`).join(', ')}`);
      
      // Verificar que es el host
      const player = gameState.getPlayerById(socket.data.playerId);
      if (!player || gameState.hostId !== player.id) {
        console.log(`❌ Permiso denegado: No es el host`);
        socket.emit('error', { message: 'Solo el host puede remover IAs' });
        return;
      }
      
      const aiPlayer = gameState.getPlayerById(aiPlayerId);
      if (!aiPlayer) {
        console.log(`❌ Jugador no encontrado: ${aiPlayerId}`);
        socket.emit('error', { message: 'Jugador no encontrado' });
        return;
      }
      
      if (!aiPlayer.isAI) {
        console.log(`❌ El jugador no es una IA: ${aiPlayer.name}`);
        socket.emit('error', { message: 'El jugador no es una IA' });
        return;
      }
      
      console.log(`🎯 Removiendo IA: ${aiPlayer.name} (socketId: ${aiPlayer.socketId})`);
      
      const removedPlayer = gameState.removePlayer(aiPlayer.socketId);
      if (removedPlayer) {
        removeAIInstance(aiPlayerId);
        
        console.log(`✅ IA removida exitosamente. Total jugadores: ${gameState.players.length}`);
        console.log(`👥 Lista de jugadores después: ${gameState.players.map(p => `${p.name} (${p.isAI ? 'IA' : 'Humano'})`).join(', ')}`);
        
        io.to(roomId).emit('player-left', {
          playerName: removedPlayer.name,
          gameState: gameState.toJSON()
        });
        
        console.log(`🤖 IA ${removedPlayer.name} removida de ${roomId}`);
      } else {
        console.log(`❌ No se pudo remover la IA`);
        socket.emit('error', { message: 'No se pudo remover la IA' });
      }
    });

    // Obtener lista de salas
    socket.on('get-rooms', () => {
      const roomList = Array.from(rooms.values())
        .filter(room => !room.gameStarted)
        .map(room => ({
          roomId: room.roomId,
          roomName: room.roomName,
          playerCount: room.players.length,
          maxPlayers: room.settings.maxPlayers
        }));
      
      socket.emit('rooms-list', roomList);
    });

    // Iniciar juego
    socket.on('start-game', () => {
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) {
        socket.emit('error', { message: 'Sala no encontrada' });
        return;
      }
      
      // Verificar que es el host
      const player = gameState.getPlayerById(socket.data.playerId);
      if (!player || gameState.hostId !== player.id) {
        socket.emit('error', { message: 'Solo el host puede iniciar el juego' });
        return;
      }
      
      const result = gameState.startGame();
      
      if (result.success) {
        // Enviar roles a cada jugador (información privada)
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
        
        // Iniciar automáticamente la fase de nominación
        gameState.startNominationPhase();
        io.to(roomId).emit('game-update', {
          gameState: gameState.toJSON(),
          message: 'Fase de nominación'
        });
        
        // Si el presidente es IA, iniciar su turno
        setTimeout(() => {
          const president = gameState.getCurrentPresident();
          if (president && president.isAI) {
            handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
          }
        }, 1000);
        
        console.log(`🎮 Juego iniciado en sala ${roomId}`);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // ==================== NOMINACIÓN ====================

    // Nominar Jefe de Gabinete
    socket.on('nominate-cabinet-chief', (data) => {
      const { cabinetChiefId } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const result = gameState.nominateCabinetChief(socket.data.playerId, cabinetChiefId);
      
      if (result.success) {
        io.to(roomId).emit('cabinet-chief-nominated', {
          cabinetChiefId: result.cabinetChiefId,
          gameState: gameState.toJSON(),
          message: result.message
        });
        
        // Iniciar votación de IAs
        handleAITurn(io, roomId, gameState, GAME_PHASES.ELECTION);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // ==================== VOTACIÓN ====================

    socket.on('cast-vote', (data) => {
      const { vote } = data; // true = Ja!, false = Nein!
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) return;
      
      const result = gameState.castVote(socket.data.playerId, vote);
      
      if (result.success) {
        const voteCount = Object.keys(gameState.votes).length;
        
        // Notificar que se emitió un voto (sin revelar cuál)
        io.to(roomId).emit('vote-cast', {
          playerId: socket.data.playerId,
          voteCount: voteCount,
          totalVoters: gameState.alivePlayers.length
        });
        
        console.log(`📊 Votos: ${voteCount}/${gameState.alivePlayers.length}`);
        
        // Si todos ya votaron, procesar resultado inmediatamente
        if (voteCount === gameState.alivePlayers.length) {
          console.log('✅ Todos han votado después del jugador humano, procesando...');
          const { processVotingResult } = require('../game/aiController');
          processVotingResult(io, roomId, gameState);
        } else {
          // Procesar votos de IAs si hay alguna que no haya votado
          handleAITurn(io, roomId, gameState, GAME_PHASES.ELECTION);
        }
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // ==================== LEGISLACIÓN ====================

    socket.on('president-discard', (data) => {
      const { cardIndex } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) {
        console.error('❌ GameState no encontrado en president-discard');
        return;
      }
      
      console.log(`📋 Presidente descartando carta ${cardIndex}`);
      
      const result = gameState.presidentDiscardCard(cardIndex);
      
      if (result.success) {
        // Notificar a todos que el presidente descartó
        io.to(roomId).emit('president-discarded', {
          gameState: gameState.toJSON(),
          message: 'El Presidente descartó una carta'
        });
        
        const cabinetChief = gameState.getPlayerById(gameState.cabinetChiefId);
        
        console.log(`👔 Jefe de Gabinete: ${cabinetChief.name} (IA: ${cabinetChief.isAI})`);
        
        // Si el Jefe de Gabinete es IA, manejarlo automáticamente
        if (cabinetChief.isAI) {
          console.log('🤖 Jefe de Gabinete IA tomará decisión automática');
          handleAITurn(io, roomId, gameState, GAME_PHASES.LEGISLATIVE_CABINET);
        } else {
          // Enviar las 2 cartas restantes al Jefe de Gabinete humano
          const cabinetChiefSocket = io.sockets.sockets.get(cabinetChief.socketId);
          
          if (cabinetChiefSocket) {
            cabinetChiefSocket.emit('receive-policies', {
              cards: gameState.currentPolicyCards,
              vetoUnlocked: gameState.vetoUnlocked
            });
            console.log(`📤 2 cartas enviadas al Jefe de Gabinete humano: ${cabinetChief.name}`);
          } else {
            console.error(`❌ Socket del Jefe de Gabinete no encontrado: ${cabinetChief.socketId}`);
          }
        }
      } else {
        console.error(`❌ Error al descartar carta: ${result.message}`);
        socket.emit('error', { message: result.message });
      }
    });

    socket.on('cabinet-chief-enact', (data) => {
      const { cardIndex } = data;
      const roomId = socket.data.roomId;
      const gameState = rooms.get(roomId);
      
      if (!gameState) {
        console.error('❌ GameState no encontrado en cabinet-chief-enact');
        return;
      }
      
      console.log(`📜 Jefe de Gabinete promulgando carta ${cardIndex}`);
      
      const result = gameState.cabinetChiefEnactPolicy(cardIndex);
      
      if (result.success) {
        console.log(`✅ Decreto promulgado: ${result.enactedPolicy.type}`);
        
        io.to(roomId).emit('policy-enacted', {
          policy: result.enactedPolicy,
          kirchneristaPolicies: gameState.kirchneristaPolicies,
          libertarianPolicies: gameState.libertarianPolicies,
          gameState: gameState.toJSON()
        });
        
        // Verificar game over
        if (result.gameOver) {
          console.log(`🏁 Game Over: ${result.winner} gana`);
          io.to(roomId).emit('game-over', {
            winner: result.winner,
            reason: result.winReason,
            gameState: gameState.toJSON()
          });
          return;
        }
        
        // Completar ronda automáticamente
        console.log('✅ Decreto promulgado, completando ronda...');
        gameState.completeRound();
        
        io.to(roomId).emit('game-update', {
          gameState: gameState.toJSON(),
          message: 'Decreto promulgado - Siguiente presidente'
        });
        
        // Continuar con el siguiente presidente si es IA
        setTimeout(() => {
          const president = gameState.getCurrentPresident();
          if (president && president.isAI) {
            handleAITurn(io, roomId, gameState, GAME_PHASES.NOMINATION);
          }
        }, 1000);
      } else {
        console.error(`❌ Error al promulgar decreto: ${result.message}`);
        socket.emit('error', { message: result.message });
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
      
      console.log(`🎤 ${player.name} se unió al chat de voz en ${roomId}`);
    });

    // Usuario deja el chat de voz
    socket.on('voice-leave', (data) => {
      const { roomId, playerId } = data;
      
      socket.to(roomId).emit('voice-user-left', {
        playerId: playerId
      });
      
      socket.data.voiceRoomId = null;
      socket.data.voicePlayerId = null;
      
      console.log(`🔇 Usuario ${playerId} dejó el chat de voz`);
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
              console.log(`🗑️ Sala ${roomId} eliminada (vacía)`);
            }
          }
        }
      }
      
      console.log(`🔌 Jugador desconectado: ${socket.id}`);
    });
  });

  console.log('✅ Socket.IO inicializado');
}

/**
 * Genera un ID único para las salas
 */
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = { initializeSocket };

