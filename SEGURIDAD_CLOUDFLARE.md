# 🔐 Guía de Seguridad Máxima - Cloudflare + Coolify

## 🌐 Dominios a Crear en Cloudflare

### ✅ Dominios Públicos (Con HTTPS/SSL)

| Dominio | Servicio | Seguridad | Propósito |
|---------|----------|-----------|-----------|
| `confimax.bitforges.com` | Frontend (Nginx) | SSL + HTTPS | App pública |
| `admin.confimax.bitforges.com` | pgAdmin | SSL + Auth + Rate Limit | Admin PostgreSQL |
| `dbadmin.confimax.bitforges.com` | Mongo Express | SSL + Basic Auth | Admin MongoDB |
| `cacheadmin.confimax.bitforges.com` | Redis Commander | SSL + Basic Auth | Admin Redis |

### ❌ Sin Dominio (Solo Red Interna)

| Servicio | Acceso | Razón |
|----------|--------|-------|
| PostgreSQL | Solo contenedores Docker | Seguridad |
| MongoDB | Solo contenedores Docker | Seguridad |
| Redis | Solo contenedores Docker | Seguridad |
| Microservicios | Solo red interna | No expuestos |

---

## 🛡️ Configuración de Seguridad

### 1. **Cloudflare DNS**

En tu panel de Cloudflare, crea estos registros **A**:

```
Type: A | Name: confimax | Content: IP_DEL_SERVIDOR_COOLIFY | Proxied: ✅
Type: A | Name: admin | Content: IP_DEL_SERVIDOR_COOLIFY | Proxied: ✅
Type: A | Name: dbadmin | Content: IP_DEL_SERVIDOR_COOLIFY | Proxied: ✅
Type: A | Name: cacheadmin | Content: IP_DEL_SERVIDOR_COOLIFY | Proxied: ✅
```

### 2. **Cloudflare Security Settings**

Para cada subdominio de admin:

```
SSL/TLS → Full (Strict)
Always Use HTTPS: ON
Security Level: High
Challenge Passage: 1 hour
Bot Fight Mode: ON
```

### 3. **Page Rules (Extra de Seguridad)**

```
URL: admin.confimax.bitforges.com/*
Settings:
  - Security Level: I'm Under Attack
  - Cache Level: Bypass
  - SSL: Full (Strict)
```

---

## 🔑 Contraseñas y Autenticación

### Niveles de Seguridad Implementados:

| Capa | Descripción |
|------|-------------|
| **1. SSL/HTTPS** | Cloudflare + Coolify (encriptación) |
| **2. Dominio separado** | admin.* en lugar de puertos |
| **3. Basic Auth** | Login antes de acceder a la app |
| **4. App Auth** | Login de pgAdmin/Mongo Express |
| **5. DB Auth** | PostgreSQL/Redis/Mongo con password |
| **6. Red Interna** | Docker network aislada |
| **7. Rate Limiting** | Protección contra brute force |

---

## 📝 Paso a Paso en Cloudflare

### Paso 1: Crear Subdominios
1. Ve a **dash.cloudflare.com**
2. Selecciona tu dominio: **bitforges.com**
3. Ve a **DNS → Records**
4. Crea los 4 registros A (arriba ↑)

### Paso 2: Configurar SSL
1. **SSL/TLS → Overview**
2. Selecciona **Full (strict)**
3. Activa **Always Use HTTPS**

### Paso 3: Seguridad Adicional
1. **Security → Settings**
2. Security Level: **High**
3. Challenge Passage: **1 hour**
4. Bot Fight Mode: **ON**

### Paso 4: Page Rules (Opcional pero recomendado)
1. **Rules → Page Rules**
2. Create Page Rule
3. URL: `admin.confimax.bitforges.com/*`
4. Add Setting: Security Level → **I'm Under Attack**
5. Save and Deploy

---

## 🚀 Deploy en Coolify

### Archivos a Subir:

```
docker-compose.secure-admin.yml  ← Configuración segura
.env.secure.example              ← Variables de entorno (renombrar a .env)
```

### Variables de Entorno en Coolify (Secrets):

Marca como **Secret** estas variables:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `MONGO_PASSWORD`
- `PGADMIN_PASSWORD`
- `MONGO_EXPRESS_PASSWORD`
- `REDIS_COMMANDER_PASSWORD`
- `JWT_SECRET`

---

## 🔍 Verificación Post-Deploy

### 1. Verificar SSL:
```bash
# Debe mostrar certificado válido
curl -I https://admin.confimax.bitforges.com
```

### 2. Verificar Autenticación:
```
1. Abre: https://admin.confimax.bitforges.com
2. Debe pedir usuario/password (Basic Auth)
3. Luego login de pgAdmin
```

### 3. Verificar Bases de Datos NO expuestas:
```bash
# Esto debe FALLAR (no hay puerto expuesto)
telnet confimax.bitforges.com 5432
# Connection refused ✅

telnet confimax.bitforges.com 6379
# Connection refused ✅

telnet confimax.bitforges.com 27017
# Connection refused ✅
```

---

## ⚠️ Checklist de Seguridad

- [ ] Contraseñas cambiadas (mínimo 16 caracteres)
- [ ] SSL activado en todos los dominios
- [ ] Always Use HTTPS: ON
- [ ] Bases de datos SIN dominio público
- [ ] Admin tools CON Basic Auth
- [ ] Rate limiting configurado
- [ ] Variables de entorno marcadas como Secret en Coolify
- [ ] Page rules de seguridad activas
- [ ] Bot Fight Mode activado

---

## 📞 URLs Finales

| URL | Uso | Acceso |
|-----|-----|--------|
| https://confimax.bitforges.com | App pública | Cualquiera |
| https://admin.confimax.bitforges.com | PostgreSQL Admin | Solo tú (con credenciales) |
| https://dbadmin.confimax.bitforges.com | MongoDB Admin | Solo tú (con credenciales) |
| https://cacheadmin.confimax.bitforges.com | Redis Admin | Solo tú (con credenciales) |

---

**¿Creas los DNS en Cloudflare?** 🚀
