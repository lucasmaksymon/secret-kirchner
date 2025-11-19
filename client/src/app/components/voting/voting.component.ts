import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Player } from '../../models/game.model';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.component.html',
  styleUrls: ['./voting.component.scss']
})
export class VotingComponent implements OnInit {
  gameState$: Observable<GameState | null>;
  hasVoted: boolean = false;
  selectedVote: boolean | null = null;
  activeTab: string | null = null;

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {
    this.gameState$ = this.gameStateService.gameState$;
  }

  ngOnInit(): void {}

  showTab(tab: string): void {
    this.activeTab = tab;
  }

  hideTab(): void {
    this.activeTab = null;
  }

  canVote(): boolean {
    const player = this.gameStateService.getCurrentPlayer();
    const state = this.gameStateService.getGameStateValue();
    
    if (!player || !state) return false;
    if (player.isDead) return false;
    if (state.phase !== 'election') return false;
    if (this.hasVoted) return false;

    return true;
  }

  getNominatedCabinetChief(): string {
    const state = this.gameStateService.getGameStateValue();
    if (!state || !state.nominatedCabinetChiefId) return '';

    const nominee = state.players.find((p: Player) => p.id === state.nominatedCabinetChiefId);
    return nominee?.name || '';
  }

  getPresident(): string {
    const president = this.gameStateService.getPresident();
    return president?.name || '';
  }

  vote(approve: boolean): void {
    if (!this.canVote()) return;

    this.selectedVote = approve;
    this.hasVoted = true;
    this.socketService.castVote(approve);
  }

  getAlivePlayers(gameState: GameState): number {
    return gameState.players.filter(p => !p.isDead).length;
  }

  getDeadPlayers(gameState: GameState): number {
    return gameState.players.filter(p => p.isDead).length;
  }
}
