import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly password = signal('');
  public readonly isLoading = signal(false);
  public readonly errorMessage = signal('');
  public readonly showPassword = signal(false);

  public async onSubmit(): Promise<void> {
    const pwd = this.password().trim();
    if (!pwd) {
      this.errorMessage.set('Por favor, informe a senha de acesso.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const success = await this.authService.login(pwd);
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.errorMessage.set('Senha incorreta. Verifique e tente novamente.');
      }
    } catch {
      this.errorMessage.set('Erro ao conectar ao servidor. Verifique sua conexão.');
    } finally {
      this.isLoading.set(false);
    }
  }

  public togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }
}
