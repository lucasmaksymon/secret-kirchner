import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Player, KnownPlayer, Role } from '../../models/game.model';

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent implements OnInit {
  gameState$: Observable<GameState | null>;
  currentPlayerId: string | null = null;
  selectedPlayerId: string | null = null;
  knownPlayers: KnownPlayer[] = [];
  currentRole: Role | null = null;

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {
    this.gameState$ = this.gameStateService.gameState$;
  }

  ngOnInit(): void {
    this.gameStateService.currentPlayerId$.subscribe(id => {
      this.currentPlayerId = id;
    });

    this.gameStateService.knownPlayers$.subscribe(known => {
      this.knownPlayers = known;
    });

    this.gameStateService.currentRole$.subscribe(role => {
      this.currentRole = role;
    });
  }

  isPresident(player: Player): boolean {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return false;
    return state.players[state.presidentIndex]?.id === player.id;
  }

  isCabinetChief(player: Player): boolean {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return false;
    return state.cabinetChiefId === player.id;
  }

  isNominated(player: Player): boolean {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return false;
    return state.nominatedCabinetChiefId === player.id;
  }

  isCurrentPlayer(player: Player): boolean {
    return player.id === this.currentPlayerId;
  }

  canNominate(): boolean {
    const state = this.gameStateService.getGameStateValue();
    if (!state || state.phase !== 'nomination') return false;
    return this.gameStateService.isCurrentPlayerPresident();
  }

  getAlivePlayers(): number {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return 0;
    return state.players.filter(p => !p.isDead).length;
  }

  getDeadPlayers(): number {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return 0;
    return state.players.filter(p => p.isDead).length;
  }

  nominatePlayer(player: Player): void {
    if (!this.canNominate() || player.isDead || this.isCurrentPlayer(player)) {
      return;
    }

    this.socketService.nominateCabinetChief(player.id);
  }

  selectPlayerForPower(player: Player): void {
    if (player.isDead) return;
    this.selectedPlayerId = player.id;
  }

  isKnownPlayer(player: Player): boolean {
    return this.knownPlayers.some(kp => kp.id === player.id);
  }

  getKnownPlayerRole(player: Player): string | null {
    const knownPlayer = this.knownPlayers.find(kp => kp.id === player.id);
    return knownPlayer?.role || null;
  }

  getKnownPlayerBadgeClass(player: Player): string {
    const role = this.getKnownPlayerRole(player);
    if (role === 'el_jefe') return 'known-el-jefe';
    if (role === 'kirchnerista') return 'known-kirchnerista';
    return '';
  }

  getCurrentPlayerTeamClass(): string {
    if (!this.currentRole) return '';
    return this.currentRole.team === 'libertarios' ? 'libertario' : 'kirchnerista';
  }
}

