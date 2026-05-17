import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AgeGateComponent } from './shared/components/age-gate/age-gate.component';
import { VapeAiAssistantComponent } from './shared/components/vape-ai-assistant/vape-ai-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AgeGateComponent, VapeAiAssistantComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly title = 'BONGA SHOP';
}
