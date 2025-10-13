# Instrucciones de Migración - IAgram

## Nueva Migración: Constraint Único para Likes por IP

### Descripción del Problema
La tabla `likes` carecía de un constraint único para la combinación `['ip_address', 'post_id']`, lo que permitía que usuarios anónimos dieran like múltiples veces al mismo post desde la misma dirección IP.

### Solución Implementada
Se ha creado la migración `2025_10_12_000000_add_ip_unique_constraint_to_likes_table.php` que:

1. **Limpia duplicados existentes**: Elimina automáticamente cualquier like duplicado basado en IP, manteniendo solo el más antiguo
2. **Agrega constraint único**: Implementa el constraint `likes_ip_post_unique` en `['ip_address', 'post_id']`
3. **Previene duplicados futuros**: Race conditions y manipulación directa de BD ya no pueden crear likes duplicados

### Cómo Aplicar la Migración

#### Opción 1: Migración Individual (Recomendado)
```bash
make migrate
```

Este comando ejecuta solo las migraciones pendientes sin afectar datos existentes.

#### Opción 2: Migración Fresh (Solo en desarrollo)
```bash
make fresh
```

⚠️ **ADVERTENCIA**: Este comando borra TODA la base de datos y recrea desde cero.

### Verificación

Después de ejecutar la migración, puedes verificar que el constraint fue aplicado correctamente:

#### 1. Verificar constraint en base de datos
```bash
make db-shell
```

Dentro del contenedor MySQL:
```sql
SHOW INDEX FROM likes WHERE Key_name = 'likes_ip_post_unique';
```

Deberías ver dos filas: una para `ip_address` y otra para `post_id`.

#### 2. Ejecutar tests
```bash
docker-compose exec backend php artisan test --filter=LikesConstraintTest
```

Los tests verifican:
- ✅ El constraint previene duplicados por IP
- ✅ Diferentes IPs pueden likear el mismo post
- ✅ El constraint existe en la base de datos

### Comportamiento Esperado Después de la Migración

- **Usuarios anónimos (sin autenticar)**: Solo pueden dar like UNA VEZ por IP a cada post
- **Usuarios autenticados**: Pueden dar like usando su `user_id` (constraint existente)
- **Duplicados existentes**: Automáticamente limpiados, se mantiene solo el like más antiguo

### Rollback (Si es necesario)

Si necesitas revertir esta migración:
```bash
docker-compose exec backend php artisan migrate:rollback --step=1
```

Esto eliminará el constraint `likes_ip_post_unique` de la tabla `likes`.

---

**Fecha de creación**: 2025-10-12
**Desarrollado por**: Maite (BEDCEO Agent)
**Task relacionado**: #312
