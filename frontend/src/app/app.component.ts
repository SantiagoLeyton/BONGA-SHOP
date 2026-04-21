import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AgeGateComponent } from './shared/components/age-gate/age-gate.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AgeGateComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly title = 'BONGA SHOP';
}
