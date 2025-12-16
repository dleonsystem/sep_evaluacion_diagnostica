export type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface SweetAlertOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: SweetAlertIcon;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  footer?: string;
  timer?: number;
  timerProgressBar?: boolean;
}

export interface SweetAlertResult {
  isConfirmed: boolean;
  isDenied: boolean;
  isDismissed: boolean;
  dismiss?: string;
}

async function fire(options: SweetAlertOptions): Promise<SweetAlertResult> {
  const mensaje = options.title ?? options.text ?? '';

  if (options.showCancelButton) {
    const confirmado = window.confirm(mensaje || '¿Confirmar acción?');
    return {
      isConfirmed: confirmado,
      isDenied: false,
      isDismissed: !confirmado,
      dismiss: confirmado ? undefined : 'cancel'
    };
  }

  if (mensaje) {
    window.alert(mensaje);
  }

  return { isConfirmed: true, isDenied: false, isDismissed: false };
}

const Swal = { fire };

export default Swal;
