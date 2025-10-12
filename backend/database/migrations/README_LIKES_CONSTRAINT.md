# Fix: Constraint Único para Likes por IP

## Problema Original
La tabla `likes` permitía que usuarios anónimos dieran like múltiples veces al mismo post desde la misma IP debido a la ausencia de un constraint único en `['ip_address', 'post_id']`.

## Solución
**Migración**: `2025_10_12_000000_add_ip_unique_constraint_to_likes_table.php`

### Qué hace la migración:
1. ✅ Detecta y elimina duplicados existentes (mantiene el like más antiguo)
2. ✅ Agrega constraint único `likes_ip_post_unique` en `['ip_address', 'post_id']`
3. ✅ Previene duplicados futuros a nivel de base de datos

### Constraints en la tabla likes:
- `['user_id', 'post_id']` → Usuarios autenticados (existente)
- `['session_id', 'post_id']` → Por sesión (existente)
- `['ip_address', 'post_id']` → Usuarios anónimos por IP (**nuevo**)

## Aplicar la Migración

```bash
# Opción 1: Solo ejecutar migraciones pendientes (recomendado)
make migrate

# Opción 2: Refrescar BD completa (solo desarrollo)
make fresh
```

## Verificación

### 1. Tests automatizados
```bash
docker-compose exec backend php artisan test --filter=LikesConstraintTest
```

### 2. Verificar constraint en BD
```bash
make db-shell
```
```sql
SHOW INDEX FROM likes WHERE Key_name = 'likes_ip_post_unique';
```

## Impacto
- ✅ Previene inflación artificial del contador de likes
- ✅ Garantiza integridad de datos a nivel de BD
- ✅ Protege contra race conditions y manipulación directa
- ✅ Manejo de errores apropiado en API (409 Conflict)

## Rollback
```bash
docker-compose exec backend php artisan migrate:rollback --step=1
```

---
**Task**: #312
**Desarrollado por**: Maite (BEDCEO Development Agent)
**Fecha**: 2025-10-12
