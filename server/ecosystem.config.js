/**
 * PM2 Ecosystem Configuration
 * Для production deployment с PM2
 * 
 * Использование:
 * pm2 start ecosystem.config.js
 * pm2 save
 * pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'edu-ai-api',
      script: './dist/server.js',
      instances: 'max', // Использовать все CPU cores
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      
      // Restart strategy
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Advanced features
      listen_timeout: 3000,
      kill_timeout: 5000
    }
  ]
};
