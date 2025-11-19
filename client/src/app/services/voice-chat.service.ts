import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SocketService } from './socket.service';

export interface VoiceUser {
  playerId: string;
  playerName: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceChatService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNodes: Map<string, AnalyserNode> = new Map();
  
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();
  
  private isMutedSubject = new BehaviorSubject<boolean>(false);
  public isMuted$ = this.isMutedSubject.asObservable();
  
  private voiceUsersSubject = new BehaviorSubject<Map<string, VoiceUser>>(new Map());
  public voiceUsers$ = this.voiceUsersSubject.asObservable();
  
  private errorSubject = new Subject<string>();
  public error$ = this.errorSubject.asObservable();
  
  private currentRoomId: string | null = null;
  private currentPlayerId: string | null = null;
  
  // Configuración de ICE servers (STUN)
  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor(private socketService: SocketService) {
    this.initializeVoiceSignaling();
  }

  /**
   * Inicializa la señalización de voz a través de Socket.IO
   */
  private initializeVoiceSignaling(): void {
    // Recibir oferta de otro peer
    this.socketService.on('voice-offer').subscribe((data: any) => {
      this.handleVoiceOffer(data.from, data.offer, data.playerName);
    });

    // Recibir respuesta de otro peer
    this.socketService.on('voice-answer').subscribe((data: any) => {
      this.handleVoiceAnswer(data.from, data.answer);
    });

    // Recibir candidato ICE
    this.socketService.on('voice-ice-candidate').subscribe((data: any) => {
      this.handleIceCandidate(data.from, data.candidate);
    });

    // Nuevo usuario se une al chat de voz
    this.socketService.on('voice-user-joined').subscribe((data: any) => {
      this.handleUserJoined(data.playerId, data.playerName);
    });

    // Usuario deja el chat de voz
    this.socketService.on('voice-user-left').subscribe((data: any) => {
      this.handleUserLeft(data.playerId);
    });

    // Estado de mute de usuario cambió
    this.socketService.on('voice-user-muted').subscribe((data: any) => {
      this.updateUserMuteStatus(data.playerId, data.isMuted);
    });
  }

  /**
   * Inicia el chat de voz
   */
  async startVoiceChat(roomId: string, playerId: string): Promise<void> {
    try {
      this.currentRoomId = roomId;
      this.currentPlayerId = playerId;

      // Solicitar acceso al micrófono
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Crear contexto de audio para análisis
      this.audioContext = new AudioContext();

      // Notificar al servidor que nos unimos
      this.socketService.emit('voice-join', { roomId, playerId });

      this.isConnectedSubject.next(true);
      console.log('✅ Chat de voz iniciado');
    } catch (error: any) {
      console.error('❌ Error al iniciar chat de voz:', error);
      if (error.name === 'NotAllowedError') {
        this.errorSubject.next('Debes permitir el acceso al micrófono para usar el chat de voz');
      } else if (error.name === 'NotFoundError') {
        this.errorSubject.next('No se encontró micrófono. Conecta un micrófono para usar el chat de voz');
      } else {
        this.errorSubject.next('Error al iniciar el chat de voz. Verifica los permisos del navegador.');
      }
      throw error;
    }
  }

  /**
   * Detiene el chat de voz
   */
  stopVoiceChat(): void {
    // Cerrar todas las conexiones peer
    this.peerConnections.forEach((pc, peerId) => {
      pc.close();
    });
    this.peerConnections.clear();

    // Detener el stream local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Cerrar contexto de audio
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyserNodes.clear();

    // Notificar al servidor
    if (this.currentRoomId && this.currentPlayerId) {
      this.socketService.emit('voice-leave', { 
        roomId: this.currentRoomId, 
        playerId: this.currentPlayerId 
      });
    }

    this.isConnectedSubject.next(false);
    this.voiceUsersSubject.next(new Map());
    this.currentRoomId = null;
    this.currentPlayerId = null;
    
    console.log('🔇 Chat de voz detenido');
  }

  /**
   * Activa/desactiva el mute del micrófono
   */
  toggleMute(): void {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const isMuted = !audioTrack.enabled;
      this.isMutedSubject.next(isMuted);

      // Notificar a otros usuarios
      if (this.currentRoomId && this.currentPlayerId) {
        this.socketService.emit('voice-mute-status', {
          roomId: this.currentRoomId,
          playerId: this.currentPlayerId,
          isMuted: isMuted
        });
      }

      console.log(isMuted ? '🔇 Micrófono muteado' : '🎤 Micrófono activo');
    }
  }

  /**
   * Maneja cuando un nuevo usuario se une al chat de voz
   */
  private async handleUserJoined(peerId: string, playerName: string): Promise<void> {
    if (peerId === this.currentPlayerId) return;

    console.log(`👤 ${playerName} se unió al chat de voz`);

    // Crear conexión peer
    const pc = this.createPeerConnection(peerId);
    this.peerConnections.set(peerId, pc);

    // Agregar nuestro stream local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Crear y enviar oferta
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socketService.emit('voice-offer', {
        roomId: this.currentRoomId,
        to: peerId,
        offer: offer
      });
    } catch (error) {
      console.error('Error al crear oferta:', error);
    }

    // Agregar a la lista de usuarios
    const users = this.voiceUsersSubject.value;
    users.set(peerId, {
      playerId: peerId,
      playerName: playerName,
      isSpeaking: false,
      isMuted: false
    });
    this.voiceUsersSubject.next(users);
  }

  /**
   * Maneja cuando un usuario deja el chat de voz
   */
  private handleUserLeft(peerId: string): void {
    console.log(`👤 Usuario ${peerId} dejó el chat de voz`);

    // Cerrar conexión
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }

    // Remover del analyser
    this.analyserNodes.delete(peerId);

    // Remover de la lista
    const users = this.voiceUsersSubject.value;
    users.delete(peerId);
    this.voiceUsersSubject.next(users);
  }

  /**
   * Maneja una oferta recibida de otro peer
   */
  private async handleVoiceOffer(peerId: string, offer: RTCSessionDescriptionInit, playerName: string): Promise<void> {
    console.log(`📞 Recibiendo oferta de ${playerName}`);

    // Crear conexión si no existe
    let pc = this.peerConnections.get(peerId);
    if (!pc) {
      pc = this.createPeerConnection(peerId);
      this.peerConnections.set(peerId, pc);

      // Agregar a la lista de usuarios
      const users = this.voiceUsersSubject.value;
      users.set(peerId, {
        playerId: peerId,
        playerName: playerName,
        isSpeaking: false,
        isMuted: false
      });
      this.voiceUsersSubject.next(users);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Agregar nuestro stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          pc!.addTrack(track, this.localStream!);
        });
      }

      // Crear respuesta
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Enviar respuesta
      this.socketService.emit('voice-answer', {
        roomId: this.currentRoomId,
        to: peerId,
        answer: answer
      });
    } catch (error) {
      console.error('Error al manejar oferta:', error);
    }
  }

  /**
   * Maneja una respuesta recibida de otro peer
   */
  private async handleVoiceAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      console.error('No se encontró peer connection para', peerId);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Respuesta de voz procesada');
    } catch (error) {
      console.error('Error al procesar respuesta:', error);
    }
  }

  /**
   * Maneja un candidato ICE recibido
   */
  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error al agregar candidato ICE:', error);
    }
  }

  /**
   * Crea una nueva conexión peer
   */
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.iceServers);

    // Manejar candidatos ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.emit('voice-ice-candidate', {
          roomId: this.currentRoomId,
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    // Manejar stream remoto
    pc.ontrack = (event) => {
      console.log('🎵 Stream remoto recibido');
      const remoteStream = event.streams[0];
      
      // Crear elemento de audio para reproducir
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play().catch(e => console.error('Error al reproducir audio:', e));

      // Crear analyser para detectar cuando habla
      if (this.audioContext) {
        this.setupAudioAnalyser(peerId, remoteStream);
      }
    };

    // Manejar estado de conexión
    pc.onconnectionstatechange = () => {
      console.log(`Conexión con ${peerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.handleUserLeft(peerId);
      }
    };

    return pc;
  }

  /**
   * Configura el analizador de audio para detectar cuando alguien habla
   */
  private setupAudioAnalyser(peerId: string, stream: MediaStream): void {
    if (!this.audioContext) return;

    const source = this.audioContext.createMediaStreamSource(stream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    
    source.connect(analyser);
    this.analyserNodes.set(peerId, analyser);

    // Detectar actividad de voz
    this.detectSpeaking(peerId, analyser);
  }

  /**
   * Detecta cuando un usuario está hablando
   */
  private detectSpeaking(peerId: string, analyser: AnalyserNode): void {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const threshold = 30; // Umbral de detección

    const checkVolume = () => {
      if (!this.analyserNodes.has(peerId)) return; // Detenerse si el usuario se fue

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      const isSpeaking = average > threshold;
      
      // Actualizar estado
      const users = this.voiceUsersSubject.value;
      const user = users.get(peerId);
      if (user && user.isSpeaking !== isSpeaking) {
        user.isSpeaking = isSpeaking;
        this.voiceUsersSubject.next(users);
      }

      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  }

  /**
   * Actualiza el estado de mute de un usuario
   */
  private updateUserMuteStatus(peerId: string, isMuted: boolean): void {
    const users = this.voiceUsersSubject.value;
    const user = users.get(peerId);
    if (user) {
      user.isMuted = isMuted;
      this.voiceUsersSubject.next(users);
    }
  }

  /**
   * Obtiene el estado actual
   */
  isConnected(): boolean {
    return this.isConnectedSubject.value;
  }

  isMuted(): boolean {
    return this.isMutedSubject.value;
  }
}

