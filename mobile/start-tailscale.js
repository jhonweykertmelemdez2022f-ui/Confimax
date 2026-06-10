const os = require('os');
const { spawn } = require('child_process');

function getTailscaleIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Validar dirección IPv4 no interna en el rango oficial de Tailscale 100.64.0.0/10
      if (net.family === 'IPv4' && !net.internal) {
        const parts = net.address.split('.');
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        if (first === 100 && second >= 64 && second <= 127) {
          return net.address;
        }
      }
    }
  }
  return null;
}

const tailscaleIp = getTailscaleIp();

if (!tailscaleIp) {
  console.error('\n❌ ERROR: No se pudo detectar ninguna dirección IP de Tailscale.');
  console.error('👉 Asegúrate de que la aplicación Tailscale esté activa y conectada en este dispositivo.\n');
  process.exit(1);
}

console.log('\n================================================================');
console.log(`🌐 TAILSCALE VPN DETECTADA: ${tailscaleIp}`);
console.log(`🚀 Configurando Expo para escuchar de forma remota en tu red privada...`);
console.log('================================================================\n');

// Forzar a Expo a embeber la IP de la VPN de Tailscale en el código QR y manifiesto de Metro
process.env.EXPO_PACKAGER_HOSTNAME = tailscaleIp;
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = tailscaleIp;

let child;
if (process.platform === 'win32') {
  child = spawn(
    'cmd.exe',
    ['/c', 'npx expo start --port 6767 --host lan'],
    {
      stdio: 'inherit',
      shell: false,
    }
  );
} else {
  child = spawn(
    'npx',
    ['expo', 'start', '--port', '6767', '--host', 'lan'],
    {
      stdio: 'inherit',
      shell: false,
    }
  );
}

child.on('error', (error) => {
  console.error('Error launching Expo:', error.message);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code);
});
