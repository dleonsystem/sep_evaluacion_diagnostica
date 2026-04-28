// Configuración PM2 para servir el frontend Angular compilado con un servidor estático
// Nota: Necesitas instalar 'serve' globalmente: npm install -g serve
// O usar: npx serve dist/frontend

module.exports = {
  apps: [
    {
      name: 'eia-frontend',
      // Usando npx para ejecutar serve sin instalación global
      script: 'npx',
      args: 'serve dist/frontend --single --listen 4200',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      kill_timeout: 5000,
      max_memory_restart: '500M'
    }
  ]
};
