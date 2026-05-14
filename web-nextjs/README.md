# Confimax - Plataforma E-commerce

Plataforma moderna de e-commerce desarrollada con Next.js 14, React 18 y TypeScript.

## 🚀 Características

- **Diseño Profesional**: Interfaz moderna con tema oscuro, animaciones CSS puras y efectos glassmorphism
- **Catálogo Completo**: Productos con filtros, búsqueda, ordenamiento y vista grid/lista
- **Autenticación**: Sistema de login, registro y recuperación de contraseña
- **Responsive**: Diseño mobile-first optimizado para todos los dispositivos
- **Sin Emojis**: Todos los iconos son SVG mediante lucide-react
- **TypeScript**: Type-safety en todo el código

## 📁 Estructura del Proyecto

```
web-nextjs/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Rutas de autenticación (sin navbar/footer)
│   │   │   ├── login/
│   │   │   ├── registro/
│   │   │   └── recuperar-password/
│   │   ├── catalogo/            # Catálogo de productos
│   │   ├── nosotros/            # Página sobre la empresa
│   │   ├── contacto/            # Formulario de contacto
│   │   ├── globals.css          # Estilos globales y animaciones
│   │   ├── layout.tsx           # Layout raíz con AuthProvider
│   │   └── page.tsx             # Página de inicio
│   ├── components/
│   │   ├── Navbar.tsx           # Navegación principal
│   │   └── Footer.tsx           # Pie de página
│   └── context/
│       └── AuthContext.tsx      # Gestión de autenticación
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── next.config.js
```

## 🛠️ Tecnologías

- **Next.js 14** con App Router
- **React 18** con hooks modernos
- **TypeScript** para type-safety
- **TailwindCSS** para estilos utilitarios
- **Lucide React** para iconos SVG optimizados

## ▶️ Cómo Ejecutar

```bash
# 1. Navegar al proyecto
cd C:\Users\alend\web-nextjs

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
http://localhost:3000
```

## 🔐 Autenticación (Demo)

El sistema de autenticación está configurado en modo demo:

- **Login exitoso**: Cualquier email/contraseña excepto `error@test.com`
- **Login fallido**: Usar `error@test.com` como email para ver mensaje de error
- **Persistencia**: La sesión se guarda en localStorage

Para conectar con tu backend real, modifica `src/context/AuthContext.tsx` y reemplaza los `setTimeout` por llamadas `fetch()` a tu API.

## 🎨 Personalización

### Colores del Tema
Edita `tailwind.config.ts` para modificar la paleta de colores:

```ts
theme: {
  extend: {
    colors: {
      primary: '#06b6d4', // cyan-500
      secondary: '#2563eb', // blue-600
    }
  }
}
```

### Animaciones
Las animaciones están definidas en `src/app/globals.css`. Puedes ajustar duración, easing o agregar nuevas.

## 📦 Próximos Pasos Recomendados

1. **Conectar API Real**: Reemplazar productos mock con llamadas a tu backend
2. **Integrar Pasarela de Pago**: Stripe, MercadoPago o PayPal
3. **Agregar Tests**: Jest + React Testing Library
4. **Implementar SEO**: Configurar metadata dinámica por producto
5. **Optimizar Imágenes**: Usar next/image con loader personalizado

## 🤝 Contribución

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit tus cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

## 📄 Licencia

Propietario - Confimax © 2024