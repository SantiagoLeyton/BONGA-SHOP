import { Component } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'app-product-card-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  templateUrl: './product-card-skeleton.component.html',
  styleUrl: './product-card-skeleton.component.scss',
})
export class ProductCardSkeletonComponent {}

