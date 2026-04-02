import { Routes } from '@angular/router';
import { PlayerComponent } from './features/player/player.component';
import { VideoListComponent } from './features/video-list/video-list.component';
import { NotFoundComponent } from './core/components/not-found.component';

export const routes: Routes = [
  { path: 'watch/:id', component: PlayerComponent, data: { embed: false } },
  { path: 'embed/:id', component: PlayerComponent, data: { embed: true } },
  { path: 'videos', component: VideoListComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: 'videos' },
];
