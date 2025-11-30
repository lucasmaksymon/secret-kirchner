import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Player } from '../../models/game.model';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.component.html',
  styleUrls: ['./voting.component.scss']
})
export class VotingComponent implements OnInit, OnDestroy {
  gameState$: Observable<GameState | null>;
  hasVoted: boolean = false;
  selectedVote: boolean | null = null;
  activeTab: string | null = null;
  private gameStateSubscription?: Subscription;

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {
    this.gameState$ = this.gameStateService.gameState$;
  }

  ngOnInit(): void {
    // Suscribirse a cambios del gameState para actualizar hasVoted
    this.gameStateSubscription = this.gameState$.subscribe(gameState => {
      if (gameState && gameState.votes) {
        const currentPlayer = this.gameStateService.getCurrentPlayer();
        if (currentPlayer && currentPlayer.id in gameState.votes) {
          this.hasVoted = true;
          this.selectedVote = gameState.votes[currentPlayer.id];
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.gameStateSubscription) {
      this.gameStateSubscription.unsubscribe();
    }
  }

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

  getVotedPlayers(gameState: GameState): Player[] {
    if (!gameState.votes) return [];
    const votedPlayerIds = Object.keys(gameState.votes);
    return gameState.players.filter(p => votedPlayerIds.includes(p.id) && !p.isDead);
  }

  getPendingPlayers(gameState: GameState): Player[] {
    if (!gameState.votes) return gameState.players.filter(p => !p.isDead);
    const votedPlayerIds = Object.keys(gameState.votes);
    return gameState.players.filter(p => !votedPlayerIds.includes(p.id) && !p.isDead);
  }

  hasPlayerVoted(playerId: string, gameState: GameState): boolean {
    return gameState.votes ? playerId in gameState.votes : false;
  }

  getPlayerVote(playerId: string, gameState: GameState): boolean | null {
    if (!gameState.votes || !(playerId in gameState.votes)) return null;
    return gameState.votes[playerId];
  }

  allPlayersVoted(gameState: GameState): boolean {
    if (!gameState.votes) return false;
    const voteCount = Object.keys(gameState.votes).length;
    return voteCount === this.getAlivePlayers(gameState);
  }

  processVoteResult(): void {
    this.socketService.processVoteResult();
  }
}
