import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { GameState, Player } from '../../models/game.model';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  gameState$: Observable<GameState | null>;
  president: Player | null = null;
  cabinetChief: Player | null = null;

  constructor(private gameStateService: GameStateService) {
    this.gameState$ = this.gameStateService.gameState$;
  }

  ngOnInit(): void {
    this.gameState$.subscribe(state => {
      if (state) {
        this.president = this.gameStateService.getPresident();
        this.cabinetChief = this.gameStateService.getCabinetChief();
      }
    });
  }

  getLibertarianPolicies(): number[] {
    const state = this.gameStateService.getGameStateValue();
    return Array(state?.libertarianPolicies || 0).fill(0);
  }

  getKirchneristaPolicies(): number[] {
    const state = this.gameStateService.getGameStateValue();
    return Array(state?.kirchneristaPolicies || 0).fill(0);
  }

  getEmptyLibertarianSlots(): number[] {
    const state = this.gameStateService.getGameStateValue();
    const enacted = state?.libertarianPolicies || 0;
    return Array(Math.max(0, 5 - enacted)).fill(0);
  }

  getEmptyKirchnersistaSlots(): number[] {
    const state = this.gameStateService.getGameStateValue();
    const enacted = state?.kirchneristaPolicies || 0;
    return Array(Math.max(0, 6 - enacted)).fill(0);
  }

  getAlivePlayers(gameState: GameState): number {
    return gameState.players.filter(p => !p.isDead).length;
  }

  getDeadPlayers(gameState: GameState): number {
    return gameState.players.filter(p => p.isDead).length;
  }

  // Poderes presidenciales varían según el número de jugadores
  getPowerTrack(): string[] {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return [];
    
    const playerCount = state.players.length;
    
    // Configuración de poderes según el número de jugadores
    const powerTracks: { [key: number]: string[] } = {
      5: ['', '', '📊', '💀', '💀'],      // peek, execution, execution
      6: ['', '', '📊', '💀', '💀'],      // peek, execution, execution
      7: ['', '🕵️', '🏛️', '💀', '💀'],    // investigate, special-election, execution, execution
      8: ['', '🕵️', '🏛️', '💀', '💀'],    // investigate, special-election, execution, execution
      9: ['🕵️', '🕵️', '🏛️', '💀', '💀'],  // investigate, investigate, special-election, execution, execution
      10: ['🕵️', '🕵️', '🏛️', '💀', '💀']  // investigate, investigate, special-election, execution, execution
    };
    
    return powerTracks[playerCount] || powerTracks[7];
  }

  hasPower(index: number): boolean {
    const track = this.getPowerTrack();
    return track[index] !== '';
  }

  getPowerIcon(index: number): string {
    const track = this.getPowerTrack();
    return track[index] || '';
  }

  hasPowerEmpty(index: number): boolean {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return false;
    const enacted = state.kirchneristaPolicies;
    const actualIndex = enacted + index;
    const track = this.getPowerTrack();
    return actualIndex < track.length && track[actualIndex] !== '';
  }

  getPowerIconEmpty(index: number): string {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return '';
    const enacted = state.kirchneristaPolicies;
    const actualIndex = enacted + index;
    const track = this.getPowerTrack();
    return track[actualIndex] || '';
  }

  getPowerName(icon: string): string {
    const powerNames: { [key: string]: string } = {
      '📊': 'Intervenir INDEC',
      '🕵️': 'Investigar con AFIP',
      '🏛️': 'Sesión Especial del Congreso',
      '💀': 'Operación Traslado'
    };
    return powerNames[icon] || '';
  }

  getPowerDescription(icon: string): string {
    const powerDescriptions: { [key: string]: string } = {
      '📊': 'Como buen estadista, manipulás las estadísticas y ves las próximas 3 cartas',
      '🕵️': 'Usás el poder del Estado para investigar la lealtad de un jugador',
      '🏛️': 'Convocás una sesión especial y elegís al próximo Presidente',
      '💀': 'Alguien va a tener un pequeño accidente... Eliminás a un jugador'
    };
    return powerDescriptions[icon] || '';
  }
}

