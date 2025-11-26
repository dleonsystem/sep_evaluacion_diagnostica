import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoginResponse, Usuario } from '../../interfaces/models';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Variables para el formulario de login
  email: string = '';
  password: string = '';
  recordarme: boolean = false;

  // Variables para mostrar mensajes
  errorLogin: string = '';
  cargando: boolean = false;

  // Variable para mostrar/ocultar contraseña
  mostrarPassword: boolean = false;

  // ✅ NUEVAS VARIABLES PARA CAPTCHA PERSONALIZADO
  captchaCode: string = ''; // Código CAPTCHA aleatorio
  userCaptcha: string = ''; // Valor ingresado por el usuario en el CAPTCHA
  captchaError: string = ''; // Mensaje de error del CAPTCHA
  submitted: boolean = false; // Para controlar la validación del formulario

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // ✅ GENERAR CAPTCHA AL INICIALIZAR
    this.generateCaptcha();

    // Comprobar si ya hay un usuario logueado
    this.authService.usuarioActual$.subscribe((usuario: Usuario | null) => {
      if (usuario) {
        // Si ya está logueado, redirigir a eventos
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/eventos';
        this.router.navigate([returnUrl]);
      }
    });

    // Comprobar si hay un email guardado en localStorage
    const emailGuardado = localStorage.getItem('emailUsuario');
    if (emailGuardado) {
      this.email = emailGuardado;
      this.recordarme = true;
    }
  }

  // ✅ NUEVOS MÉTODOS PARA CAPTCHA PERSONALIZADO

  // Generar CAPTCHA
  generateCaptcha(): void {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.captchaCode = captcha;
    console.log('🔧 CAPTCHA generado:', this.captchaCode);
  }

  // Actualizar CAPTCHA
  updateCaptcha(): void {
    this.generateCaptcha();
    this.userCaptcha = ''; // Limpia el campo CAPTCHA
    this.captchaError = ''; // Limpia el mensaje de error
    console.log('🔄 CAPTCHA actualizado');
  }

  // Verificar CAPTCHA
  verifyCaptcha(): boolean {
    if (this.userCaptcha === this.captchaCode) {
      this.captchaError = ''; // Si es correcto, no mostramos error
      return true;
    } else {
      this.captchaError = 'El CAPTCHA ingresado es incorrecto. Intenta nuevamente.';
      return false;
    }
  }

  // Validar CAPTCHA en tiempo real
  validateCaptcha(): void {
    this.captchaError = ''; // Limpiar errores anteriores
    if (!this.userCaptcha) {
      this.captchaError = 'El código CAPTCHA es obligatorio.';
    }
    else if (this.userCaptcha !== this.captchaCode) {
      this.captchaError = 'El código CAPTCHA es incorrecto.';
    }
  }

  // ✅ COMENTADO: Método de Google reCAPTCHA
  /*
  async obtenerTokenReCaptcha(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof grecaptcha === 'undefined') {
        reject('grecaptcha no está definido');
        return;
      }

      grecaptcha.enterprise.ready(() => {
        grecaptcha.enterprise.execute('6LccJi8rAAAAAOBIv0vRnMVHKYT-Ye9Y8GU_Ddh7', { action: 'login' })
          .then((token: string) => resolve(token))
          .catch((error: any) => reject(error));
      });
    });
  }
  */

  // ✅ MÉTODO ACTUALIZADO: iniciarSesion sin reCAPTCHA
  async iniciarSesion(): Promise<void> {
    this.submitted = true;

    // Validar campos básicos
    if (!this.email || !this.password) {
      this.errorLogin = 'Por favor, complete todos los campos.';
      return;
    }

    // Validar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.errorLogin = 'Por favor, ingrese un correo electrónico válido.';
      return;
    }

    // Validar límites de caracteres
    if (this.email.length > 50) {
      this.errorLogin = 'El correo electrónico no puede exceder 50 caracteres.';
      return;
    }

    if (this.password.length > 20) {
      this.errorLogin = 'La contraseña no puede exceder 20 caracteres.';
      return;
    }

    // ✅ VALIDAR CAPTCHA PERSONALIZADO
    if (!this.userCaptcha) {
      this.captchaError = 'El CAPTCHA es obligatorio.';
      this.errorLogin = 'Por favor, complete el código de verificación.';
      return;
    }

    if (!this.verifyCaptcha()) {
      this.errorLogin = 'El código de verificación es incorrecto.';
      return;
    }

    this.cargando = true;
    this.errorLogin = '';
    this.captchaError = '';

    try {
      // ✅ COMENTADO: Obtener token de reCAPTCHA
      // const recaptchaToken = await this.obtenerTokenReCaptcha();

      // ✅ NUEVO: Usar token vacío o ficticio
      const tokenFicticio = 'CAPTCHA_PERSONALIZADO_VALIDADO_' + Date.now();

      // Llamar al servicio para iniciar sesión
      this.apiService.login({ email: this.email, password: this.password }, tokenFicticio).subscribe({
        next: (response: LoginResponse) => {
          this.cargando = false;
          console.log('Respuesta de login:', response);

          if (response && response.status && response.usuario) {
            // Si la opción de recordar está marcada, guardar el email
            if (this.recordarme) {
              localStorage.setItem('emailUsuario', this.email);
            } else {
              localStorage.removeItem('emailUsuario');
            }

            // Crear objeto de usuario autenticado
            const usuario: Usuario = {
              id: response.usuario.id,
              nombre: response.usuario.nombre,
              apellidoPaterno: response.usuario.apellidoPaterno,
              apellidoMaterno: response.usuario.apellidoMaterno,
              curp: response.usuario.curp,
              fechaNacimiento: response.usuario.fechaNacimiento,
              sexo: response.usuario.sexo.toString(),
              entidad: '',
              correoElectronico: response.usuario.correoElectronico,
              apellidos: `${response.usuario.apellidoPaterno} ${response.usuario.apellidoMaterno}`,
              email: response.usuario.correoElectronico,
              telefono: response.usuario.telefono || '',
              institucion: '',
              cargo: response.usuario.rol,
              eventos: []
            };

            this.authService.setAuthenticated(usuario, response.token);

            // Obtener la URL de retorno de los parámetros de consulta
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/eventos';

            // Redirigir a la página de retorno o a eventos por defecto
            this.router.navigate([returnUrl]);
          } else {
            this.errorLogin = response.message || 'Credenciales incorrectas. Por favor, intente nuevamente.';
          }
        },
        error: (error: any) => {
          this.cargando = false;
          if (typeof error === 'string' && error === 'Error en la validación de reCAPTCHA') {
            this.errorLogin = 'Error en la verificación de seguridad. Por favor, intenta de nuevo.';
          } else {
            this.errorLogin = 'Ha ocurrido un error al iniciar sesión. Por favor, intente más tarde.';
          }
          console.error('Error en iniciar sesión:', error);

          // ✅ NUEVO: Regenerar CAPTCHA después de un error
          this.generateCaptcha();
          this.userCaptcha = '';
        }
      });
    } catch (error) {
      this.cargando = false;
      this.errorLogin = 'Error en la verificación de seguridad. Por favor, intenta de nuevo.';
      console.error('Error en el proceso de login:', error);

      // ✅ NUEVO: Regenerar CAPTCHA después de un error
      this.generateCaptcha();
      this.userCaptcha = '';
    }
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // ✅ NUEVO: Método para limpiar errores en tiempo real
  onEmailChange(): void {
    if (this.errorLogin && this.email) {
      this.errorLogin = '';
    }
  }

  onPasswordChange(): void {
    if (this.errorLogin && this.password) {
      this.errorLogin = '';
    }
  }

  // ✅ NUEVO: Validar formulario completo
  isFormValid(): boolean {
    return this.email.trim() !== '' &&
           this.password.trim() !== '' &&
           this.userCaptcha.trim() !== '' &&
           this.userCaptcha === this.captchaCode;
  }
}
