module.exports = {
  apps: [
    {
      name: 'soulyousee-api',
      script: './dist/src/main.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Logging
      error_file: '/dev/stderr',
      out_file: '/dev/stdout',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart strategies
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};

