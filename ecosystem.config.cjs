// PM2 process manager configuration for the Eparchy of Segeneyti website
// Usage:
//   npm run build            # build the Next.js app first
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup              # auto-start on server reboot

module.exports = {
  apps: [
    {
      // ── Application ────────────────────────────────────────────────────────
      name: 'eparchy-segeneyti',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/eparchy-segeneyti',

      // ── Clustering ─────────────────────────────────────────────────────────
      // 'max' uses all CPU cores; set to a fixed number if preferred
      instances: 'max',
      exec_mode: 'cluster',

      // ── Environment ────────────────────────────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // ── Graceful restart ────────────────────────────────────────────────────
      // Wait for new instance to be ready before killing old one
      wait_ready: true,
      listen_timeout: 15000,        // 15 s
      kill_timeout: 5000,           // 5 s

      // ── Auto-restart on crash ───────────────────────────────────────────────
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,

      // ── Memory guard ───────────────────────────────────────────────────────
      max_memory_restart: '512M',

      // ── Logging ────────────────────────────────────────────────────────────
      out_file: '/var/log/pm2/eparchy-segeneyti-out.log',
      error_file: '/var/log/pm2/eparchy-segeneyti-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ── Watch (disabled in production) ─────────────────────────────────────
      watch: false,
    },
  ],
}
