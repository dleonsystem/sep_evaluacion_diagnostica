module.exports = {
  apps: [
    {
      name: 'eia-graphql-server',
      script: './dist/index.js',
      instances: 1, // o 'max' para usar todos los núcleos
      exec_mode: 'fork', // cambiar a 'cluster' si usas 'max' instances
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '0.0.0.0'
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
      watch: false, // cambiar a true solo en desarrollo
      ignore_watch: ['node_modules', 'logs', 'dist'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      max_memory_restart: '1G'
    }
  ]
};
