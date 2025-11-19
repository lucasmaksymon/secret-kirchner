import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { RoomInfo } from '../../models/game.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  playerName: string = '';
  roomName: string = '';
  selectedRoomId: string | null = null;
  rooms: RoomInfo[] = [];
  showCreateRoom: boolean = false;
  
  accordionStates = {
    objetivo: false,
    flujo: false,
    poderes: false,
    consejos: false
  };

  constructor(
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRooms();
    
    // Listen for room creation
    this.socketService.on('room-created').subscribe((data: any) => {
      this.router.navigate(['/lobby', data.roomId]);
    });

    // Listen for room join
    this.socketService.on('room-joined').subscribe((data: any) => {
      this.router.navigate(['/lobby', data.gameState.roomId]);
    });

    // Listen for rooms list
    this.socketService.on('rooms-list').subscribe((rooms: RoomInfo[]) => {
      this.rooms = rooms;
    });
  }

  loadRooms(): void {
    this.socketService.getRooms();
  }

  createRoom(): void {
    if (!this.playerName.trim() || !this.roomName.trim()) {
      alert('Por favor, ingresa tu nombre y el nombre de la sala');
      return;
    }

    this.socketService.createRoom(this.roomName, this.playerName);
  }

  joinRoom(roomId: string): void {
    if (!this.playerName.trim()) {
      alert('Por favor, ingresa tu nombre');
      return;
    }

    this.socketService.joinRoom(roomId, this.playerName);
  }

  toggleCreateRoom(): void {
    this.showCreateRoom = !this.showCreateRoom;
  }

  toggleAccordion(section: 'objetivo' | 'flujo' | 'poderes' | 'consejos'): void {
    // Si el acordeón ya está abierto, lo cerramos
    if (this.accordionStates[section]) {
      this.accordionStates[section] = false;
    } else {
      // Cerramos todos los acordeones
      Object.keys(this.accordionStates).forEach(key => {
        this.accordionStates[key as keyof typeof this.accordionStates] = false;
      });
      // Abrimos solo el seleccionado
      this.accordionStates[section] = true;
    }
  }
}

