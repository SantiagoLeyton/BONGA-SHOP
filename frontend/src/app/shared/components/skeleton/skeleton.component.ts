import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  @Input() variant: 'line' | 'box' = 'line';
  @Input() width: string = '100%';
  @Input() height: string = '1rem';
  @Input() radius: string = '12px';
}

