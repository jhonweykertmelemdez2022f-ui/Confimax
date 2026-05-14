# 🖥️ Stack de Monitoreo del Sistema

Stack completo: Node-Exporter + Prometheus + Grafana para métricas reales de tu PC.

## 📁 Estructura

```
monitoring/
├── docker-compose.yml       # Stack completo
├── prometheus-system.yml    # Config de Prometheus
├── grafana/
│   └── provisioning/
│       └── datasources/
│           └── datasources.yml  # Datasource auto-configurado
└── README.md               # Esta guía
```

## 🚀 Paso 1: Levantar el Stack

```bash
cd d:\Proyectos\Farm\monitoring
docker compose up -d
```

## 🔍 Paso 2: Verificar métricas de Node Exporter

Abre en navegador:

**http://localhost:9100/metrics**

Deberías ver métricas como:
```
node_cpu_seconds_total{cpu="0",mode="idle"} 12345.67
node_memory_MemTotal_bytes 1.64345678e+10
node_memory_MemAvailable_bytes 8.23456789e+09
node_filesystem_size_bytes{device="/dev/sda1",fstype="ext4",mountpoint="/"} 2.5e+11
```

## 📊 Paso 3: Acceder a Prometheus

**http://localhost:9090**

Ve a **Status → Targets** y verifica que `node-exporter:9100` esté **UP** (verde).

### Queries útiles para probar:

| Métrica | Query |
|---------|-------|
| **CPU %** | `100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` |
| **RAM %** | `100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))` |
| **Disco %** | `100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"})` |
| **Red (RX)** | `rate(node_network_receive_bytes_total[5m])` |
| **Red (TX)** | `rate(node_network_transmit_bytes_total[5m])` |

## 📈 Paso 4: Acceder a Grafana

**http://localhost:3002**

- **Usuario:** `admin`
- **Password:** `Jackson1`

El datasource "Prometheus" ya está configurado automáticamente.

### Importar Dashboard Popular:

1. Ve a **Dashboards → Import**
2. En "Import via grafana.com" ingresa el ID: **`1860`**
   (Este es el dashboard "Node Exporter Full" más popular)
3. Selecciona el datasource "Prometheus"
4. Click en **Import**

¡Listo! Tendrás un dashboard completo con:
- CPU (usage, cores, load)
- RAM (used, free, cached, buffers)
- Disco (uso por partición, I/O)
- Red (tráfico por interfaz)
- Temperatura (si disponible)
- Procesos y uptime

## 🛠️ Troubleshooting Windows

### ⚠️ Problema: "No such host" o imágenes no se descargan

**Solución:** Usar versiones estables de Docker Hub:
```yaml
image: prom/node-exporter:v1.7.0
image: prom/prometheus:v2.48.0
image: grafana/grafana:10.2.0
```

### ⚠️ Problema: "path / is mounted on / but it is not a shared or slave mount"

**Causa:** En Docker Desktop para Windows, el volumen `/` no es accesible directamente.

**Soluciones alternativas:**

#### Opción A: Usar WSL2 (Recomendado)
1. Configura Docker Desktop para usar WSL2 backend
2. Instala una distro WSL2 (Ubuntu)
3. Corre el stack desde WSL2 en lugar de PowerShell

#### Opción B: Exponer métricas de Windows nativo
Para métricas REALES de tu PC Windows (no de la VM de Docker), usa el script de PowerShell:

```powershell
cd d:\Proyectos\Farm\scripts
.\windows-metrics-server.ps1
```

Luego configura Grafana con datasource: `http://host.docker.internal:9182`

#### Opción C: Dashboard web nativo
Accede a la página web de métricas:
**http://localhost:3000/metrics.html**

(Ver documentación en `web/public/metrics.html`)

## 📋 Resumen de URLs

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Node Exporter | http://localhost:9100/metrics | Métricas crudas en formato Prometheus |
| Prometheus | http://localhost:9090 | Queries y status de targets |
| Grafana | http://localhost:3002 | Dashboards visuales |

## 🛑 Detener el Stack

```bash
docker compose down
```

Para borrar datos:
```bash
docker compose down -v
```

## 🔧 Queries Avanzadas de Prometheus

### CPU por core:
```promql
100 - (avg by (cpu) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### Top 10 procesos por CPU (si node_exporter lo soporta):
```promql
topk(10, rate(node_procs_running[5m]))
```

### Uso de swap:
```promql
(node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes) / node_memory_SwapTotal_bytes * 100
```

### Latencia de disco:
```promql
rate(node_disk_io_time_seconds_total[5m])
```

## 📚 Recursos

- [Dashboard Node Exporter 1860](https://grafana.com/grafana/dashboards/1860)
- [Documentación Node Exporter](https://github.com/prometheus/node_exporter)
- [Queries Prometheus útiles](https://prometheus.io/docs/prometheus/latest/querying/examples/)
