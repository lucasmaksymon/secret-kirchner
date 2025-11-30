import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { ChatMessage } from '../../models/game.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessagesContainer', { static: false }) chatMessagesContainer!: ElementRef;
  
  @Input() embedded: boolean = false; // Si está embebido en un modal/sidebar (no flotante)
  
  chatMessages$: Observable<ChatMessage[]>;
  newMessage: string = '';
  isMinimized: boolean = false;
  isPinned: boolean = false;
  unreadCount: number = 0;
  private chatSubscription?: Subscription;
  private shouldScroll: boolean = false;

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {
    this.chatMessages$ = this.gameStateService.chatMessages$;
  }

  ngOnInit(): void {
    // Cargar estado guardado
    const savedMinimized = localStorage.getItem('chatMinimized');
    const savedPinned = localStorage.getItem('chatPinned');
    
    if (savedMinimized !== null) {
      this.isMinimized = savedMinimized === 'true';
    }
    
    if (savedPinned !== null) {
      this.isPinned = savedPinned === 'true';
    }

    // Suscribirse a nuevos mensajes para contar no leídos
    this.chatSubscription = this.chatMessages$.subscribe(messages => {
      if (this.isMinimized && messages.length > 0) {
        this.unreadCount = messages.length;
      } else {
        this.unreadCount = 0;
      }
      this.shouldScroll = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.chatMessagesContainer) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    localStorage.setItem('chatMinimized', this.isMinimized.toString());
    
    if (!this.isMinimized) {
      this.unreadCount = 0;
      this.shouldScroll = true;
    }
  }

  togglePin(): void {
    this.isPinned = !this.isPinned;
    localStorage.setItem('chatPinned', this.isPinned.toString());
  }

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
}

