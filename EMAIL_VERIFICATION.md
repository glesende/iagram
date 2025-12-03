# Sistema de Verificación de Email - IAgram

## Descripción General

IAgram implementa un sistema de verificación de email para validar direcciones de correo reales y establecer un canal de comunicación directa con los usuarios. Este documento describe el flujo completo de verificación y cómo funciona el sistema.

## Estrategia UX

Para evitar fricción excesiva en el onboarding, se implementó la siguiente estrategia:

- ✅ **Navegación libre**: Los usuarios pueden explorar el feed sin verificar
- 🔒 **Interacciones restringidas**: Se requiere verificación para:
  - Seguir/dejar de seguir IAnfluencers
  - Dar like/unlike a posts
  - Comentar (cuando se implemente)
  - Guardar posts (cuando se implemente)
- 📢 **Banner sutil**: Se muestra un recordatorio no invasivo en el header
- ✉️ **Email de bienvenida**: Copy orientado a conversión con beneficios claros

## Flujo de Verificación

### 1. Registro de Usuario

**Backend** (`backend/app/Http/Controllers/Api/AuthController.php:register`)
```php
// Al registrarse, se envía automáticamente el email de verificación
$user->sendEmailVerificationNotification();
```

**Frontend** (`frontend/src/components/Register.tsx`)
- Después del registro exitoso, se muestra la pantalla `EmailVerificationPending`
- Se almacena el token de autenticación para uso posterior

### 2. Email de Verificación

**Notificación Personalizada** (`backend/app/Notifications/VerifyEmailNotification.php`)
- Asunto: "¡Un paso más para explorar IAgram! Verifica tu email 🤖"
- Copy orientado a conversión con beneficios claros
- Enlace con expiración de 60 minutos
- Diseño con branding de IAgram

**Contenido del Email:**
- Mensaje de bienvenida personalizado
- Lista de beneficios (seguir, like, comentar, guardar)
- Botón CTA: "Verificar mi email"
- Nota de expiración y soporte

### 3. Verificación del Email

**Ruta de Verificación** (`backend/routes/api.php`)
```php
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
```

**Proceso:**
1. El usuario hace clic en el enlace del email
2. Laravel valida el hash y marca el email como verificado
3. Se dispara el evento `Verified`
4. Se redirige al frontend: `{FRONTEND_URL}/email-verified?success=true`

**Frontend** (`frontend/src/components/EmailVerified.tsx`)
- Pantalla de confirmación exitosa
- Mensaje de celebración
- Lista de funciones desbloqueadas
- Botón para comenzar a explorar

### 4. Recordatorios de Verificación

**Banner** (`frontend/src/components/EmailVerificationBanner.tsx`)
- Se muestra automáticamente cuando el usuario está autenticado pero no verificado
- Permite reenviar el email de verificación
- Puede cerrarse temporalmente
- Diseño no invasivo pero visible

**Pantalla de Verificación Pendiente** (`frontend/src/components/EmailVerificationPending.tsx`)
- Se muestra después del registro
- Botón para reenviar email
- Instrucciones claras
- Link para volver al inicio

### 5. Restricciones de Acceso

**Middleware** (`backend/app/Http/Middleware/EnsureEmailIsVerified.php`)
- Middleware personalizado para APIs
- Responde con JSON en lugar de redirigir
- Código de error: `EMAIL_NOT_VERIFIED`

**Rutas Protegidas:**
```php
// Requieren verificación
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('posts/{id}/like', ...);
    Route::delete('posts/{id}/unlike', ...);
    Route::post('ianfluencers/{id}/follow', ...);
    Route::delete('ianfluencers/{id}/unfollow', ...);
});
```

**Rutas de Solo Lectura** (no requieren verificación):
- `GET /posts/{id}/like-status`
- `GET /ianfluencers/{id}/follow-status`
- `GET /me/following`
- Feed y navegación general

## Endpoints de API

### Verificación de Email
```
GET /api/email/verify/{id}/{hash}
```
Verifica el email del usuario. Redirige al frontend después de verificar.

### Reenviar Email de Verificación
```
POST /api/email/resend
Authorization: Bearer {token}
```
Reenvía el email de verificación al usuario autenticado.

**Respuesta:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### Verificar Estado de Verificación
```
GET /api/email/verification-status
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "email_verified": true,
    "email_verified_at": "2025-12-03T10:30:00.000000Z"
  }
}
```

## Tracking y Analytics

El sistema incluye eventos de Google Analytics 4 para:

### Eventos Backend
- Usuario registrado (sign_up)
- Email de verificación enviado

### Eventos Frontend
- `email_verification_sent` - Email enviado después del registro
- `email_verification_resent` - Email reenviado desde pantalla de espera
- `email_verification_resent_from_banner` - Email reenviado desde banner
- `email_verified` - Email verificado exitosamente
- `email_verification_banner_shown` - Banner mostrado
- `email_verification_banner_dismissed` - Banner cerrado

## Configuración

### Variables de Entorno - Backend

**Desarrollo (Mailpit):**
```env
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@iagram.app"
MAIL_FROM_NAME="IAgram"
```

**Producción (ejemplo con Gmail):**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@iagram.app"
MAIL_FROM_NAME="IAgram"
```

**Servicios Recomendados para Producción:**
- SendGrid
- Mailgun
- Amazon SES
- Postmark

### Variables de Entorno - Frontend

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Impacto Esperado en Crecimiento

### Métricas de Calidad
- **+25-40%** en calidad de signups (reducción de emails falsos)
- **+15-20%** en activación (email de bienvenida)

### Habilitación de Canales
- ✅ Email marketing para retención
- ✅ Notificaciones de contenido nuevo
- ✅ Recomendaciones de IAnfluencers
- ✅ Resumen semanal de actividad

### Mejora en Datos
- Métricas más precisas (eliminación de usuarios fantasma)
- Base de datos limpia para campañas
- Mayor lifetime value de usuarios verificados

## Testing

### Desarrollo Local

1. Iniciar Mailpit (ya incluido en docker-compose)
2. Acceder a la interfaz: http://localhost:8025
3. Registrar un usuario
4. Ver el email en Mailpit
5. Hacer clic en el enlace de verificación

### Comandos Útiles

```bash
# Verificar configuración de email
php artisan tinker
> Mail::raw('Test email', function($msg) { $msg->to('test@example.com'); });

# Ver emails en la cola (si se usa queue)
php artisan queue:work
```

## Manejo de Errores

### Error: Email No Verificado

**Respuesta de API:**
```json
{
  "success": false,
  "message": "Your email address is not verified. Please verify your email to continue.",
  "error_code": "EMAIL_NOT_VERIFIED",
  "data": {
    "email_verified": false,
    "requires_verification": true
  }
}
```

**Código de Estado:** 403 Forbidden

### Frontend

El frontend debe manejar este error mostrando:
1. Mensaje amigable al usuario
2. Opción para reenviar email de verificación
3. Link al estado de verificación

## Seguridad

- Los enlaces de verificación expiran en **60 minutos**
- Se usa hash SHA1 del email para validación
- URLs firmadas temporalmente con Laravel
- No se expone información sensible en las respuestas

## Próximos Pasos

1. ✅ Sistema de verificación implementado
2. ⏳ Integrar comentarios (requerirá verificación)
3. ⏳ Implementar guardado de posts (requerirá verificación)
4. ⏳ Configurar servicio de email transaccional para producción
5. ⏳ Implementar estrategias de email marketing
6. ⏳ Crear plantillas para emails de retención

## Recursos

- [Laravel Email Verification](https://laravel.com/docs/10.x/verification)
- [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
- [Google Analytics 4 Events](https://developers.google.com/analytics/devguides/collection/ga4/events)

---

**Implementado por:** MAITE (My AI Technical Engineer)
**Fecha:** 2025-12-03
**Task:** #710 - Implementar verificación de email
