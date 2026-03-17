import { Routes } from '@angular/router';
import { PlayerComponent } from './features/player/player.component';
import { VideoListComponent } from './features/video-list/video-list.component';

export const routes: Routes = [
  { path: 'watch/:id', component: PlayerComponent },
  { path: '**', component: VideoListComponent },
];
