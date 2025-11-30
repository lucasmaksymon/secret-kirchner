import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { VoiceChatService, VoiceUser } from '../../services/voice-chat.service';
import { GameStateService } from '../../services/game-state.service';

@Component({
  selector: 'app-voice-chat',
  templateUrl: './voice-chat.component.html',
  styleUrls: ['./voice-chat.component.scss']
})
export class VoiceChatComponent implements OnInit, OnDestroy {
  @Input() roomId: string = '';
  @Input() playerId: string = '';
  @Input() embedded: boolean = false; // Si está embebido en un modal/sidebar (no flotante)
  
  isConnected: boolean = false;
  isMuted: boolean = false;
  isDeafened: boolean = false;
  voiceUsers: Map<string, VoiceUser> = new Map();
  errorMessage: string | null = null;
  isConnecting: boolean = false;
  isMinimized: boolean = false;
  isPinned: boolean = false;

  private destroy$ = new Subject<void>();
  private localAudioStream: MediaStream | null = null;

  constructor(
    private voiceChatService: VoiceChatService,
    private gameStateService: GameStateService
  ) {}

  ngOnInit(): void {
    // Cargar estado guardado
    const savedMinimized = localStorage.getItem('voiceChatMinimized');
    const savedPinned = localStorage.getItem('voiceChatPinned');
    
    if (savedMinimized !== null) {
      this.isMinimized = savedMinimized === 'true';
    }
    
    if (savedPinned !== null) {
      this.isPinned = savedPinned === 'true';
    }

    // Suscribirse al estado del servicio de voz
    this.voiceChatService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        this.isConnecting = false;
      });

    this.voiceChatService.isMuted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(muted => {
        this.isMuted = muted;
      });

    this.voiceChatService.voiceUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.voiceUsers = users;
      });

    this.voiceChatService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.errorMessage = error;
        this.isConnecting = false;
        if (error) {
          setTimeout(() => {
            this.errorMessage = null;
          }, 5000);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Detener chat de voz si está activo
    if (this.isConnected) {
      this.voiceChatService.stopVoiceChat();
    }
  }

  async toggleVoiceChat(): Promise<void> {
    if (this.isConnected) {
      this.voiceChatService.stopVoiceChat();
    } else {
      if (!this.roomId || !this.playerId) {
        this.errorMessage = 'Error: Datos de sala inválidos';
        return;
      }

      this.isConnecting = true;
      try {
        await this.voiceChatService.startVoiceChat(this.roomId, this.playerId);
      } catch (error) {
        this.isConnecting = false;
      }
    }
  }

  toggleMute(): void {
    this.voiceChatService.toggleMute();
  }

  toggleDeafen(): void {
    this.isDeafened = !this.isDeafened;
    
    // Silenciar/activar todos los streams remotos
    this.voiceUsers.forEach(user => {
      const audioElement = document.querySelector(`audio[data-user-id="${user.playerId}"]`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.muted = this.isDeafened;
      }
    });
  }

  getVoiceUsersArray(): VoiceUser[] {
    return Array.from(this.voiceUsers.values());
  }

  getSpeakingUsers(): VoiceUser[] {
    return this.getVoiceUsersArray().filter(u => u.isSpeaking);
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    localStorage.setItem('voiceChatMinimized', this.isMinimized.toString());
  }

  togglePin(): void {
    this.isPinned = !this.isPinned;
    localStorage.setItem('voiceChatPinned', this.isPinned.toString());
  }
}
