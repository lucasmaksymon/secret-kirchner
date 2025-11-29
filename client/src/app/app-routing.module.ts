import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { GameComponent } from './components/game/game.component';
import { DevComponent } from './components/dev/dev.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'lobby/:roomId', component: LobbyComponent },
  { path: 'game/:roomId', component: GameComponent },
  { path: 'dev', component: DevComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

