import { Component, signal } from '@angular/core';
import { UploadComponent } from './features/upload/upload.component';

@Component({
  selector: 'app-root',
  imports: [UploadComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('playbacQ-UI');
}
