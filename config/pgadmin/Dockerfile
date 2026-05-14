FROM dpage/pgadmin4:latest

# Puerto interno estándar
ENV PGADMIN_LISTEN_PORT=80
ENV PGADMIN_LISTEN_ADDRESS=0.0.0.0

# Configuración para producción y proxy inverso
ENV PGADMIN_CONFIG_SERVER_MODE=True
ENV PGADMIN_CONFIG_REVERSE_PROXY_ADDRESSING=True
ENV PGADMIN_CONFIG_ENHANCED_COOKIE_PROTECTION=False

# Pre-configuración de servidores
COPY ./config/pgadmin/servers.json /pgadmin4/servers.json

# Pre-configuración de contraseña (pgpass)
USER root
RUN echo "db.tlrliqbgtdplwdvbxqxv.supabase.co:5432:postgres:postgres:Jackwell2019*2424" > /pgadmin4/pgpass && \
    chmod 600 /pgadmin4/pgpass && \
    chown 5050:5050 /pgadmin4/pgpass

EXPOSE 80

# Permisos de directorio de datos
RUN mkdir -p /var/lib/pgadmin && chown -R 5050:5050 /var/lib/pgadmin
USER 5050
