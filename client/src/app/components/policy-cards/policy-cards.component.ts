import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Policy } from '../../models/game.model';

@Component({
  selector: 'app-policy-cards',
  templateUrl: './policy-cards.component.html',
  styleUrls: ['./policy-cards.component.scss']
})
export class PolicyCardsComponent implements OnInit {
  gameState$: Observable<GameState | null>;
  currentCards$: Observable<Policy[]>;
  selectedCardIndex: number | null = null;

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {
    this.gameState$ = this.gameStateService.gameState$;
    this.currentCards$ = this.gameStateService.currentCards$;
  }

  ngOnInit(): void {}

  isPresident(): boolean {
    return this.gameStateService.isCurrentPlayerPresident();
  }

  isCabinetChief(): boolean {
    return this.gameStateService.isCurrentPlayerCabinetChief();
  }

  canAct(): boolean {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return false;

    if (state.phase === 'legislative_president') {
      return this.isPresident();
    } else if (state.phase === 'legislative_cabinet') {
      return this.isCabinetChief();
    }

    return false;
  }

  selectCard(index: number): void {
    this.selectedCardIndex = index;
  }

  discardCard(): void {
    if (this.selectedCardIndex === null) {
      alert('Selecciona una carta para descartar');
      return;
    }

    this.socketService.presidentDiscard(this.selectedCardIndex);
    this.selectedCardIndex = null;
  }

  enactPolicy(): void {
    if (this.selectedCardIndex === null) {
      alert('Selecciona una carta para promulgar');
      return;
    }

    this.socketService.cabinetChiefEnact(this.selectedCardIndex);
    this.selectedCardIndex = null;
  }

  requestVeto(): void {
    const state = this.gameStateService.getGameStateValue();
    if (!state?.vetoUnlocked) {
      alert('El veto no está desbloqueado aún');
      return;
    }

    if (confirm('¿Querés solicitar el Veto Presidencial? Ambas cartas serán descartadas si el Presidente acepta.')) {
      this.socketService.requestVeto();
    }
  }

  getPhaseInstruction(): string {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return '';

    if (state.phase === 'legislative_president') {
      if (this.isPresident()) {
        return '📜 Seleccioná UNA carta para descartar. Las otras 2 irán al Jefe de Gabinete.';
      } else {
        return '⏳ Esperando a que el Presidente descarte una carta...';
      }
    } else if (state.phase === 'legislative_cabinet') {
      if (this.isCabinetChief()) {
        return '📜 Seleccioná UNA carta para promulgar como decreto.';
      } else {
        return '⏳ Esperando a que el Jefe de Gabinete elija una carta...';
      }
    }

    return '';
  }
}

