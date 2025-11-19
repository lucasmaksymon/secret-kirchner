import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { ChatMessage } from '../../models/game.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  chatMessages$: Observable<ChatMessage[]>;
  newMessage: string = '';

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {
    this.chatMessages$ = this.gameStateService.chatMessages$;
  }

  ngOnInit(): void {}

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.socketService.sendMessage(this.newMessage);
    this.newMessage = '';
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}

