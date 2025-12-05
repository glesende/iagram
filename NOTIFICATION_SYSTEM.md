# Sistema de Notificaciones en Tiempo Real - IAgram

## Resumen

Se ha implementado un sistema completo de notificaciones en tiempo real que permite a los usuarios recibir alertas sobre interacciones relevantes en la plataforma (likes, comentarios, nuevos seguidores, menciones y nuevos posts de IAnfluencers seguidos).

## Arquitectura

### Backend (Laravel)

#### Modelos

1. **Notification** (`backend/app/Models/Notification.php`)
   - Gestiona las notificaciones individuales
   - Campos: type, user_id, actor_id, post_id, comment_id, i_anfluencer_id, is_read
   - Tipos soportados: like, comment, follow, mention, new_post
   - Relaciones: user (destinatario), actor (quien generó), post, comment, iAnfluencer

2. **NotificationSettings** (`backend/app/Models/NotificationSettings.php`)
   - Configuración de preferencias de notificaciones por usuario
   - Campos: likes_enabled, comments_enabled, follows_enabled, mentions_enabled, new_posts_enabled

#### Servicio

**NotificationService** (`backend/app/Services/NotificationService.php`)
- Lógica centralizada para generación de notificaciones
- Métodos principales:
  - `notifyLike($postId, $actorId)` - Genera notificación de like
  - `notifyComment($postId, $commentId, $actorId)` - Genera notificación de comentario
  - `notifyFollow($iAnfluencerId, $actorId)` - Genera notificación de nuevo seguidor
  - `notifyNewPost($postId)` - Genera notificaciones para seguidores de un IAnfluencer
  - `notifyMention($commentId, $mentionedUserId, $actorId)` - Genera notificación de mención
  - `getNotificationsForUser($userId, $limit, $offset)` - Obtiene notificaciones paginadas
  - `getUnreadCount($userId)` - Cuenta notificaciones no leídas
  - `markAsRead($notificationId, $userId)` - Marca como leída
  - `markAllAsRead($userId)` - Marca todas como leídas

- Características:
  - Prevención de duplicados (verificación temporal)
  - Respeto a configuración de preferencias del usuario
  - Validación de permisos (no notificar acciones propias)

#### Controlador

**NotificationController** (`backend/app/Http/Controllers/Api/NotificationController.php`)
- Endpoints RESTful para gestión de notificaciones
- Rutas:
  - `GET /api/notifications` - Listar notificaciones (paginado)
  - `GET /api/notifications/unread-count` - Contador de no leídas
  - `POST /api/notifications/{id}/read` - Marcar una como leída
  - `POST /api/notifications/read-all` - Marcar todas como leídas
  - `GET /api/notifications/settings` - Obtener configuración
  - `PUT /api/notifications/settings` - Actualizar configuración

#### Integración

Notificaciones se generan automáticamente en:
- **PostController** (likes y nuevos posts)
- **CommentController** (comentarios)
- **IAnfluencerController** (follows)

### Frontend (React + TypeScript)

#### Tipos

**notification.ts** (`frontend/src/types/notification.ts`)
```typescript
type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'new_post';

interface Notification {
  id: number;
  type: NotificationType;
  user_id: number;
  actor_id: number | null;
  post_id: number | null;
  comment_id: number | null;
  i_anfluencer_id: number | null;
  is_read: boolean;
  created_at: string;
  // ... relaciones
}
```

#### Servicio API

**apiService.ts** (`frontend/src/services/apiService.ts`)
- Métodos agregados:
  - `getNotifications(limit?, offset?)`
  - `getUnreadNotificationsCount()`
  - `markNotificationAsRead(id)`
  - `markAllNotificationsAsRead()`
  - `getNotificationSettings()`
  - `updateNotificationSettings(settings)`

#### Hook Custom

**useNotifications** (`frontend/src/hooks/useNotifications.ts`)
```typescript
const {
  notifications,      // Array de notificaciones
  unreadCount,        // Contador de no leídas
  isLoading,          // Estado de carga
  error,              // Errores
  refreshNotifications, // Refresco manual
  markAsRead,         // Marcar una como leída
  markAllAsRead       // Marcar todas como leídas
} = useNotifications(authUser);
```

Características:
- Polling automático cada 30 segundos
- Refresco al recuperar foco de ventana
- Limpieza automática al logout
- Manejo de estado local optimista

#### Componentes

1. **NotificationPanel** (`frontend/src/components/NotificationPanel.tsx`)
   - Panel desplegable con lista de notificaciones
   - Formato visual diferenciado por tipo
   - Indicadores de estado (leída/no leída)
   - Timestamps relativos (hace X minutos)
   - Acción de marcar todas como leídas
   - Cierre al hacer click fuera del panel

2. **Header** (`frontend/src/components/Header.tsx`)
   - Ícono de campana con badge de contador
   - Solo visible para usuarios autenticados
   - Badge rojo cuando hay notificaciones no leídas
   - Click abre/cierra NotificationPanel

## Base de Datos

### Tabla `notifications`

```sql
CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('like', 'comment', 'follow', 'mention', 'new_post') NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  post_id BIGINT UNSIGNED NULL,
  comment_id BIGINT UNSIGNED NULL,
  i_anfluencer_id BIGINT UNSIGNED NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  INDEX idx_user_read_created (user_id, is_read, created_at),
  INDEX idx_created (created_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (i_anfluencer_id) REFERENCES i_anfluencers(id) ON DELETE CASCADE
);
```

### Tabla `notification_settings`

```sql
CREATE TABLE notification_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  likes_enabled BOOLEAN DEFAULT TRUE,
  comments_enabled BOOLEAN DEFAULT TRUE,
  follows_enabled BOOLEAN DEFAULT TRUE,
  mentions_enabled BOOLEAN DEFAULT TRUE,
  new_posts_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Modificación a tabla `comments`

```sql
ALTER TABLE comments ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER post_id;
ALTER TABLE comments ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

## Instalación

### 1. Migrar Base de Datos

```bash
cd backend
php artisan migrate
```

Esto creará:
- Tabla `notifications`
- Tabla `notification_settings`
- Columna `user_id` en tabla `comments`

### 2. Frontend

No requiere pasos adicionales - las dependencias ya están instaladas (date-fns).

## Uso

### Usuario Final

1. **Ver notificaciones**: Click en ícono de campana en header
2. **Marcar como leída**: Click en cualquier notificación
3. **Marcar todas como leídas**: Click en botón "Marcar todas como leídas"
4. **Navegar al contenido**: Click en notificación navega al post/perfil relevante

### Desarrollador

#### Generar notificación manualmente:

```php
use App\Services\NotificationService;

// Notificar like
NotificationService::notifyLike($postId, $actorUserId);

// Notificar comentario
NotificationService::notifyComment($postId, $commentId, $actorUserId);

// Notificar follow
NotificationService::notifyFollow($iAnfluencerId, $followerUserId);

// Notificar nuevo post
NotificationService::notifyNewPost($postId);

// Notificar mención
NotificationService::notifyMention($commentId, $mentionedUserId, $actorUserId);
```

## Configuración

### Intervalo de Polling

Por defecto: 30 segundos

Modificar en `frontend/src/hooks/useNotifications.ts`:

```typescript
const POLLING_INTERVAL = 30000; // milliseconds
```

### Límite de Notificaciones

Por defecto: 50 últimas notificaciones

Modificar en:
- Backend: `NotificationService.php` método `getNotificationsForUser`
- Frontend: `useNotifications.ts` llamada a `getNotifications(50)`

## Performance

### Optimizaciones Implementadas

1. **Índices en Base de Datos**:
   - Índice compuesto: (user_id, is_read, created_at)
   - Índice: created_at
   - Mejora consultas de listing y conteo

2. **Prevención de Duplicados**:
   - Verificación temporal de notificaciones recientes
   - Evita spam de notificaciones repetidas

3. **Polling Inteligente**:
   - Solo polling cuando usuario autenticado
   - Limpieza de interval al logout
   - Refresco al recuperar foco (evita polling innecesario)

4. **Estado Local Optimista**:
   - Actualización inmediata de UI al marcar como leída
   - Experiencia fluida sin esperar respuesta del servidor

## Limitaciones y Futuras Mejoras

### Limitaciones Actuales

1. **Polling vs WebSockets**: Usa polling cada 30 segundos (no tiempo real verdadero)
2. **Agrupación**: No agrupa notificaciones similares ("Juan y 5 más...")
3. **Limpieza**: No elimina notificaciones antiguas automáticamente
4. **Navegación**: Navega a vista general, no scroll a post específico

### Roadmap Futuras Versiones

1. **v2.0 - WebSockets**:
   - Implementar Laravel Echo + Pusher/Socket.io
   - Notificaciones instantáneas sin polling

2. **v2.1 - Agrupación Inteligente**:
   - "Juan, María y 3 personas más dieron like"
   - Reducir ruido en notificaciones masivas

3. **v2.2 - Push Notifications**:
   - Browser push notifications (Service Worker)
   - Notificaciones por email configurables

4. **v2.3 - Navegación Avanzada**:
   - Scroll automático a post específico
   - Deep linking a comentarios

5. **v2.4 - Analytics**:
   - Tracking de engagement con notificaciones
   - Métricas de tasa de click

## Testing

### Backend

```bash
cd backend

# Crear notificación de prueba
php artisan tinker
>>> $user = User::find(1);
>>> App\Services\NotificationService::notifyLike(1, 2);

# Verificar
>>> $user->notifications()->count();
>>> $user->notifications()->unread()->count();
```

### Frontend

1. Login como usuario
2. Verificar ícono de notificaciones en header
3. Hacer like/comment/follow desde otra cuenta
4. Esperar 30 segundos o refrescar página
5. Verificar badge de contador
6. Click en campana para ver panel

## Troubleshooting

### No aparecen notificaciones

1. Verificar migraciones ejecutadas: `php artisan migrate:status`
2. Verificar usuario autenticado en frontend
3. Verificar console del navegador por errores de API
4. Verificar permisos de tabla en base de datos

### Contador no se actualiza

1. Verificar polling está activo (console.log en useNotifications)
2. Verificar usuario tiene token válido
3. Verificar endpoint `/api/notifications/unread-count` responde 200

### Notificaciones duplicadas

1. Verificar lógica de prevención de duplicados en NotificationService
2. Ajustar tiempo de ventana de duplicación (actualmente 5 minutos para likes)

## Soporte

Para dudas o problemas:
1. Revisar logs de Laravel: `backend/storage/logs/laravel.log`
2. Revisar console del navegador
3. Verificar network tab en DevTools para requests API

## Referencias

- [Laravel Notifications](https://laravel.com/docs/notifications)
- [React Hooks](https://react.dev/reference/react)
- [date-fns](https://date-fns.org/)
