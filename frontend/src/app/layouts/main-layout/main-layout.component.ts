import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { InfoModalComponent } from '../../shared/components/info-modal/info-modal.component';
import { LoginModalComponent } from '../../shared/components/login-modal/login-modal.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RegisterModalComponent } from '../../shared/components/register-modal/register-modal.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    LoginModalComponent,
    RegisterModalComponent,
    InfoModalComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {}
