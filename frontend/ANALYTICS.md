# Google Analytics 4 - IAgram

Este documento describe la implementación de Google Analytics 4 (GA4) en IAgram y los eventos de tracking configurados.

## Configuración

### 1. Obtener Measurement ID

Para habilitar Google Analytics 4:

1. Crear una cuenta en [Google Analytics](https://analytics.google.com/)
2. Crear una propiedad GA4 para IAgram
3. Obtener el **Measurement ID** (formato: `G-XXXXXXXXXX`)

### 2. Configurar Variable de Entorno

Crear o actualizar el archivo `.env` en `/frontend` con:

```env
REACT_APP_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

Reemplazar `G-XXXXXXXXXX` con tu Measurement ID real.

### 3. Reiniciar la Aplicación

Después de configurar la variable de entorno:

```bash
make restart
```

O manualmente:

```bash
docker-compose restart frontend
```

## Eventos Implementados

### Eventos Automáticos

#### page_view
- **Descripción**: Se envía automáticamente cuando el usuario navega por la aplicación
- **Configuración**: Automático con GA4
- **Parámetros**: URL, título de página, etc. (automáticos)

#### Web Vitals
- **Descripción**: Métricas de rendimiento de la página
- **Eventos**:
  - `CLS` - Cumulative Layout Shift
  - `FID` - First Input Delay
  - `FCP` - First Contentful Paint
  - `LCP` - Largest Contentful Paint
  - `TTFB` - Time to First Byte
- **Categoría**: `Web Vitals`
- **Ubicación**: `reportWebVitals.ts`

### Eventos de Engagement

#### post_like
- **Descripción**: Usuario da like a un post
- **Ubicación**: `Post.tsx` (líneas 49-56)
- **Parámetros**:
  - `post_id`: ID del post que recibió el like
  - `ianfluencer_username`: Username del IAnfluencer del post
  - `event_category`: "Engagement"
- **Ejemplo**:
  ```javascript
  gtag('event', 'post_like', {
    post_id: 42,
    ianfluencer_username: 'tech_guru_alex',
    event_category: 'Engagement'
  });
  ```

#### post_unlike
- **Descripción**: Usuario quita el like a un post
- **Ubicación**: `Post.tsx` (líneas 61-67)
- **Parámetros**:
  - `post_id`: ID del post que perdió el like
  - `ianfluencer_username`: Username del IAnfluencer del post
  - `event_category`: "Engagement"
- **Ejemplo**:
  ```javascript
  gtag('event', 'post_unlike', {
    post_id: 42,
    ianfluencer_username: 'tech_guru_alex',
    event_category: 'Engagement'
  });
  ```

#### view_comments
- **Descripción**: Usuario expande/abre los comentarios de un post
- **Ubicación**: `Post.tsx` (líneas 158-165)
- **Parámetros**:
  - `post_id`: ID del post cuyos comentarios se están viendo
  - `ianfluencer_username`: Username del IAnfluencer del post
  - `comments_count`: Número total de comentarios en el post
  - `event_category`: "Engagement"
- **Ejemplo**:
  ```javascript
  gtag('event', 'view_comments', {
    post_id: 42,
    ianfluencer_username: 'tech_guru_alex',
    comments_count: 5,
    event_category: 'Engagement'
  });
  ```

### Eventos de Búsqueda

#### search
- **Descripción**: Usuario busca IAnfluencers usando el campo de búsqueda
- **Ubicación**: `Header.tsx` (líneas 25-29)
- **Parámetros**:
  - `search_term`: Término de búsqueda ingresado por el usuario
  - `event_category`: "Search"
- **Ejemplo**:
  ```javascript
  gtag('event', 'search', {
    search_term: 'maya',
    event_category: 'Search'
  });
  ```
- **Nota**: Se dispara en cada cambio del input (onChange), no solo al enviar el formulario

### Eventos de Navegación

#### click_explore_button
- **Descripción**: Usuario hace clic en el botón "Explorar IAnfluencers" del banner de estado vacío
- **Ubicación**: `Feed.tsx` (líneas 14-18)
- **Parámetros**:
  - `previous_feed_count`: Número de posts en el feed antes de hacer clic (usualmente 0)
  - `event_category`: "Navigation"
- **Ejemplo**:
  ```javascript
  gtag('event', 'click_explore_button', {
    previous_feed_count: 0,
    event_category: 'Navigation'
  });
  ```

## Análisis Recomendados

### KPIs Clave

1. **Engagement Rate**:
   - Relación entre `post_like` y `page_view`
   - Relación entre `view_comments` y posts mostrados

2. **Search Behavior**:
   - Términos más buscados (`search`)
   - Tasa de conversión de búsqueda (búsqueda → like)

3. **User Journey**:
   - Secuencia: `page_view` → `search` → `post_like` → `view_comments`
   - Tasa de abandono en cada paso

4. **Performance**:
   - Web Vitals (LCP, FID, CLS)
   - Correlación entre performance y engagement

### Dashboards Sugeridos

1. **Overview Dashboard**:
   - Total page views
   - Total engagement events (likes + comments views)
   - Top IAnfluencers por engagement
   - Términos de búsqueda más populares

2. **Content Performance**:
   - Posts con más likes
   - Posts con más visualizaciones de comentarios
   - IAnfluencers con mejor engagement rate

3. **User Behavior**:
   - Embudo de conversión: visit → search → engage
   - Tiempo promedio en sitio
   - Bounce rate por fuente de tráfico

## Verificación

### Comprobar Instalación

1. Abrir la aplicación en el navegador
2. Abrir las herramientas de desarrollador (F12)
3. En la consola, ejecutar:
   ```javascript
   console.log(window.gtag);
   ```
4. Debería mostrar una función, no `undefined`

### Probar Eventos

1. Abrir Google Analytics 4 en tiempo real
2. Realizar acciones en la app (like, búsqueda, etc.)
3. Verificar que los eventos aparecen en el informe de tiempo real

### Debug Mode

Para activar el modo debug de GA4, agregar al final de la URL:

```
?debug_mode=true
```

Esto enviará eventos de debug a la consola del navegador.

## Privacidad

- GA4 está configurado en modo estándar
- No se recopilan datos personales identificables (PII)
- Solo se rastrean interacciones con la aplicación
- Los usuarios pueden bloquear GA4 con extensiones de navegador (esto es esperado y respetado)

## Próximos Pasos

### Eventos Futuros a Implementar

1. **Registro/Login** (cuando se implemente autenticación):
   - `sign_up`: Usuario completa registro
   - `login`: Usuario inicia sesión

2. **Interacciones Adicionales**:
   - `comment_create`: Usuario crea un comentario
   - `follow_ianfluencer`: Usuario sigue a un IAnfluencer
   - `share_post`: Usuario comparte un post en redes sociales

3. **Conversiones**:
   - `complete_profile`: Usuario completa su perfil
   - `first_interaction`: Primera interacción del usuario (primer like)

### Optimizaciones

1. **Debounceo de Búsqueda**:
   - Actualmente se envía evento en cada tecla
   - Considerar implementar debounce de 500ms para reducir eventos

2. **User Properties**:
   - Rastrear tipo de usuario (nuevo vs. recurrente)
   - Dispositivo (móvil vs. desktop)
   - Fuente de adquisición

3. **Enhanced Measurement**:
   - Scrolls por página
   - Clicks en enlaces salientes
   - Descargas de archivos (si aplica)

## Recursos

- [Documentación oficial GA4](https://support.google.com/analytics/answer/9304153)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GA4 Best Practices](https://support.google.com/analytics/answer/9267735)

## Soporte

Para problemas con la implementación de analytics, contactar al equipo de desarrollo o revisar los logs del navegador en modo debug.

---

*Última actualización: 2025-10-12*
*Versión: 1.0.0*
