import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Input } from '@angular/core';
import { Observable, Subscription, Subject, takeUntil } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { VoiceChatService, VoiceUser } from '../../services/voice-chat.service';
import { ChatMessage } from '../../models/game.model';

@Component({
  selector: 'app-unified-chat',
  templateUrl: './unified-chat.component.html',
  styleUrls: ['./unified-chat.component.scss']
})
export class UnifiedChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessagesContainer', { static: false }) chatMessagesContainer!: ElementRef;
  
  @Input() embedded: boolean = false;
  @Input() roomId: string = '';
  @Input() playerId: string = '';
  
  // Tab management
  activeTab: 'text' | 'voice' = 'text';
  
  // Text chat
  chatMessages$: Observable<ChatMessage[]>;
  newMessage: string = '';
  unreadCount: number = 0;
  private chatSubscription?: Subscription;
  private shouldScroll: boolean = false;
  
  // Voice chat
  isConnected: boolean = false;
  isMuted: boolean = false;
  isDeafened: boolean = false;
  voiceUsers: Map<string, VoiceUser> = new Map();
  errorMessage: string | null = null;
  isConnecting: boolean = false;
  
  // Bubble state
  isMinimized: boolean = false;
  
  private destroy$ = new Subject<void>();
  private localAudioStream: MediaStream | null = null;

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService,
    private voiceChatService: VoiceChatService
  ) {
    this.chatMessages$ = this.gameStateService.chatMessages$;
  }

  ngOnInit(): void {
    // Cargar estado guardado
    const savedMinimized = localStorage.getItem('unifiedChatMinimized');
    const savedTab = localStorage.getItem('unifiedChatTab');
    
    if (savedMinimized !== null) {
      this.isMinimized = savedMinimized === 'true';
    }
    
    if (savedTab === 'text' || savedTab === 'voice') {
      this.activeTab = savedTab;
    }

    // Suscribirse a mensajes de texto
    this.chatSubscription = this.chatMessages$.subscribe(messages => {
      if (this.isMinimized && messages.length > 0 && this.activeTab === 'text') {
        this.unreadCount = messages.length;
      } else {
        this.unreadCount = 0;
      }
      this.shouldScroll = true;
    });

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

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.chatMessagesContainer && this.activeTab === 'text') {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
    
    // Detener chat de voz si está activo
    if (this.isConnected) {
      this.voiceChatService.stopVoiceChat();
    }
  }

  // Tab management
  setTab(tab: 'text' | 'voice'): void {
    this.activeTab = tab;
    localStorage.setItem('unifiedChatTab', tab);
    
    if (tab === 'text' && !this.isMinimized) {
      this.shouldScroll = true;
      this.unreadCount = 0;
    }
  }

  // Bubble controls
  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    localStorage.setItem('unifiedChatMinimized', this.isMinimized.toString());
    
    if (!this.isMinimized && this.activeTab === 'text') {
      this.unreadCount = 0;
      this.shouldScroll = true;
    }
  }

  // Text chat methods
  scrollToBottom(): void {
    if (this.chatMessagesContainer) {
      const element = this.chatMessagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.socketService.sendMessage(this.newMessage);
    this.newMessage = '';
    this.shouldScroll = true;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Voice chat methods
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
}

