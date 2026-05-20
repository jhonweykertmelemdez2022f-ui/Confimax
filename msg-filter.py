import sys
msg = sys.stdin.read().strip()

replacements = {
    "Fix JWT payload extraction for username and userId in audit logs": "fix: corregir extraccion de payload JWT para username y userId en logs de auditoria",
    "Add audit logging to inventory service and audit endpoint to notifications service": "feat: agregar registro de auditoria a inventory service y endpoint a notifications service",
    "Fix API JSON parsing for 204 No Content and updateProduct HTTP method": "fix: corregir parseo JSON para codigo 204 No Content y metodo HTTP en updateProduct",
    "Fix missing useAuthStore import in SaleDetailScreen": "fix: corregir importacion faltante de useAuthStore en SaleDetailScreen",
    "Fix customer creation validation and detail screen UI bugs": "fix: corregir validacion al crear clientes y errores de interfaz en la pantalla de detalles",
    "fix vercel": "fix: corregir despliegue en vercel",
    "grafana fix": "fix: corregir configuracion de grafana",
    "fix": "fix: correcciones varias",
    "dev": "chore: desarrollo"
}

if msg in replacements:
    print(replacements[msg])
else:
    print(msg)
