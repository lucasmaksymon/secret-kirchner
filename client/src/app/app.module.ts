import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { GameComponent } from './components/game/game.component';
import { BoardComponent } from './components/board/board.component';
import { PlayerListComponent } from './components/player-list/player-list.component';
import { PolicyCardsComponent } from './components/policy-cards/policy-cards.component';
import { VotingComponent } from './components/voting/voting.component';
import { ExecutivePowerComponent } from './components/executive-power/executive-power.component';
import { ChatComponent } from './components/chat/chat.component';
import { GameOverComponent } from './components/game-over/game-over.component';
import { VoiceChatComponent } from './components/voice-chat/voice-chat.component';
import { UnifiedChatComponent } from './components/unified-chat/unified-chat.component';
import { DevComponent } from './components/dev/dev.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LobbyComponent,
    GameComponent,
    BoardComponent,
    PlayerListComponent,
    PolicyCardsComponent,
    VotingComponent,
    ExecutivePowerComponent,
    ChatComponent,
    GameOverComponent,
    VoiceChatComponent,
    UnifiedChatComponent,
    DevComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

