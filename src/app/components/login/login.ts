import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  loginWithGoogle() {
    this.authService.loginWithGoogle()
      .then(() => {
        this.router.navigate(['/pacientes']);
      })
      .catch(error => {
        console.error('Error en login con Google:', error);
        alert('Error al iniciar sesión con Google');
      });
  }
}