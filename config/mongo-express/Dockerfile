FROM mongo-express:latest

# Configuración de conexión a MongoDB Atlas
ENV ME_CONFIG_MONGODB_URL=mongodb+srv://confimax:jema2019@confimax.tedq2nv.mongodb.net/confimax_notifications
ENV ME_CONFIG_MONGODB_SSL=true
ENV ME_CONFIG_MONGODB_ENABLE_ADMIN=true
ENV ME_CONFIG_MONGODB_ADMINUSERNAME=confimax
ENV ME_CONFIG_MONGODB_ADMINPASSWORD=jema2019

# Seguridad de la interfaz web
ENV ME_CONFIG_BASICAUTH_USERNAME=admin
ENV ME_CONFIG_BASICAUTH_PASSWORD=Jackson1

# Bypass del script de inicio defectuoso para Atlas SRV
ENTRYPOINT ["node", "app.js"]
