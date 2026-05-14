# Configuración VPN con Tailscale

## ¿Por qué Tailscale?

- **Gratis** hasta 100 dispositivos
- **Muy fácil** de configurar
- **Acceso seguro** a todos los servicios como localhost
- **Sin exponer puertos** públicamente
- **Funciona** detrás de NAT/firewall

---

## Paso 1: Crear cuenta en Tailscale

1. Ve a [https://tailscale.com](https://tailscale.com)
2. Clic en **"Get Started"**
3. Regístrate con Google, GitHub o Microsoft

---

## Paso 2: Instalar Tailscale en el servidor (Coolify VPS)

### Opción A: Usando Docker (recomendado)

```bash
# Crear contenedor Tailscale
docker run -d \
  --name=tailscale \
  --hostname=confimax-server \
  --cap-add=NET_ADMIN \
  --cap-add=SYS_MODULE \
  -v /var/lib/tailscale:/var/lib/tailscale \
  -v /dev/net/tun:/dev/net/tun \
  --network=host \
  tailscale/tailscale

# Obtener URL de autenticación
docker logs tailscale
```

### Opción B: Instalación directa en el VPS

```bash
# SSH al servidor
ssh root@147.93.177.143

# Instalar Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Iniciar y autenticar
tailscale up

# Te dará un URL para autenticar en el navegador
```

---

## Paso 3: Instalar Tailscale en tu PC local

### Windows:
1. Descargar de [https://tailscale.com/download](https://tailscale.com/download)
2. Instalar y autenticar con tu cuenta

### O usando winget:
```powershell
winget install Tailscale.Tailscale
```

---

## Paso 4: Verificar conexión

```bash
# En tu PC local, verificar dispositivos conectados
tailscale status

# Deberías ver algo como:
# 100.x.x.x   confimax-server    linux    -
# 100.y.y.y   tu-pc              windows  -
```

---

## Paso 5: Acceder a servicios

Ahora puedes acceder a todos los servicios usando la IP de Tailscale del servidor:

| Servicio | URL (Tailscale) | Puerto |
|----------|-----------------|--------|
| **MongoDB** | `mongodb://confimax:Jackson1@100.x.x.x:27017` | 27017 |
| **Mongo Express** | `http://100.x.x.x:8081` | 8081 |
| **Redis** | `redis://100.x.x.x:6379` | 6379 |
| **Redis Commander** | `http://100.x.x.x:8082` | 8082 |
| **PostgreSQL** | `postgresql://confimax:Jackson1@100.x.x.x:5432` | 5432 |
| **pgAdmin** | `http://100.x.x.x:5050` | 5050 |

**Nota:** Reemplaza `100.x.x.x` con la IP real de Tailscale del servidor.

---

## Paso 6: Obtener IP de Tailscale del servidor

```bash
# En el servidor
tailscale ip

# O desde tu PC
tailscale status
```

---

## Paso 7: Configurar servicios para escuchar en Tailscale

Los servicios ya escuchan en `0.0.0.0`, así que funcionarán automáticamente.

---

## Paso 8: Cerrar puertos públicos (opcional pero recomendado)

Después de verificar que Tailscale funciona:

```bash
# En el servidor, cerrar puertos en el firewall
ufw deny 27017
ufw deny 8081
ufw deny 6379
ufw deny 8082
ufw deny 5432
ufw deny 5050

# Solo permitir SSH y HTTP/HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
```

---

## Verificar que funciona

1. Abre navegador en tu PC
2. Ve a `http://100.x.x.x:8081` (IP de Tailscale del servidor)
3. Deberías ver Mongo Express
4. Login: `admin` / `Jackson1`

---

## Comandos útiles

```bash
# Ver estado de Tailscale
tailscale status

# Ver IP asignada
tailscale ip

# Ping a otro dispositivo
tailscale ping 100.x.x.x

# Ver logs
tailscale logs

# Reiniciar Tailscale
sudo systemctl restart tailscaled
```

---

## Troubleshooting

### No puedo conectar:
1. Verificar que ambos dispositivos están en la misma red de Tailscale
2. Verificar que el servicio está corriendo en el servidor
3. Verificar que el firewall permite tráfico de Tailscale (puerto 41641 UDP)

### Puerto ocupado:
```bash
# Verificar qué está usando el puerto
netstat -tulpn | grep 8081
```

---

## Siguiente paso: Cloudflare Tunnel

Para exponer servicios públicos (frontend, API) de forma segura:

```bash
# Instalar cloudflared
docker run -d cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <TU_TOKEN>
```

Esto permitirá:
- Frontend en `https://tudominio.com`
- API en `https://api.tudominio.com`
- Sin exponer puertos públicamente
