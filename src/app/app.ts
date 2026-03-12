import { Component, signal } from '@angular/core';
import { UploadComponent } from './features/upload/upload.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [UploadComponent, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('playbacQ-UI');
}
