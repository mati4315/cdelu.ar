module.exports = {
  apps: [{
    name: "diario",
    script: "src/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "700M",
    node_args: "--max-old-space-size=700",
    env: {
      NODE_ENV: "production",
      RSS_ENABLED: "false"  // Deshabilitar RSS temporalmente
    }
  }]
}; 