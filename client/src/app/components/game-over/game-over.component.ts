import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Player } from '../../models/game.model';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss']
})
export class GameOverComponent implements OnInit {
  gameState$: Observable<GameState | null>;
  libertarios: Player[] = [];
  kirchneristas: Player[] = [];
  elJefe: Player | null = null;

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService,
    private router: Router
  ) {
    this.gameState$ = this.gameStateService.gameState$;
  }

  ngOnInit(): void {
    this.gameState$.subscribe(state => {
      if (state) {
        this.libertarios = state.players.filter(p => p.role && p.role.team === 'libertarios');
        this.kirchneristas = state.players.filter(p => p.role && p.role.team === 'kirchneristas');
        this.elJefe = state.players.find(p => p.role && p.role.type === 'el_jefe') || null;
      }
    });
  }

  leaveGame(): void {
    this.socketService.disconnect();
    this.router.navigate(['/']);
  }
}

