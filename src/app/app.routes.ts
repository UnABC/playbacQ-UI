import { Routes } from '@angular/router';
import { PlayerComponent } from './features/player/player.component';

export const routes: Routes = [
	{ path: 'watch/:id', component: PlayerComponent },
	{ path: '**', redirectTo: '' }
];
