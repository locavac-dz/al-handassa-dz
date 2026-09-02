// PM2 Ecosystem — handassi.dz backend
// Démarrer  : pm2 start ecosystem.config.js --env production
// Recharger : pm2 reload handassi-api
// Logs      : pm2 logs handassi-api
// Moniteur  : pm2 monit

module.exports = {
  apps: [
    {
      name: 'handassi-api',
      script: 'src/app.js',
      cwd: '/var/www/handassi.dz/backend',

      // ─── Clustering ──────────────────────────────────────────
      instances: 'max',       // 1 instance par cœur CPU
      exec_mode: 'cluster',   // load-balancing automatique

      // ─── Comportement ────────────────────────────────────────
      watch: false,           // ne pas redémarrer sur changement fichier (prod)
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,

      // ─── Variables d'environnement ────────────────────────────
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // ─── Logs ────────────────────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/var/log/pm2/handassi-out.log',
      error_file: '/var/log/pm2/handassi-err.log',
      merge_logs: true,

      // ─── Graceful shutdown ────────────────────────────────────
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: true,
    },
  ],
};
