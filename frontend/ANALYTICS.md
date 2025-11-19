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

#### follow_ianfluencer
- **Descripción**: Usuario comienza a seguir a un IAnfluencer desde su perfil
- **Ubicación**: `IAnfluencerProfile.tsx` (líneas 99-107)
- **Parámetros**:
  - `ianfluencer_username`: Username del IAnfluencer que se está siguiendo
  - `ianfluencer_id`: ID del IAnfluencer
  - `niche`: Nicho/categoría del IAnfluencer
  - `event_category`: "Engagement"
- **Nota**: Actualmente usa localStorage. Será migrado a API cuando backend esté disponible
- **Ejemplo**:
  ```javascript
  gtag('event', 'follow_ianfluencer', {
    ianfluencer_username: 'tech_guru_alex',
    ianfluencer_id: '123',
    niche: 'Technology',
    event_category: 'Engagement'
  });
  ```

#### unfollow_ianfluencer
- **Descripción**: Usuario deja de seguir a un IAnfluencer desde su perfil
- **Ubicación**: `IAnfluencerProfile.tsx` (líneas 99-107)
- **Parámetros**:
  - `ianfluencer_username`: Username del IAnfluencer que se está dejando de seguir
  - `ianfluencer_id`: ID del IAnfluencer
  - `niche`: Nicho/categoría del IAnfluencer
  - `event_category`: "Engagement"
- **Nota**: Actualmente usa localStorage. Será migrado a API cuando backend esté disponible
- **Ejemplo**:
  ```javascript
  gtag('event', 'unfollow_ianfluencer', {
    ianfluencer_username: 'tech_guru_alex',
    ianfluencer_id: '123',
    niche: 'Technology',
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
   - Tasa de conversión: `profile_view` → `follow_ianfluencer`

2. **Follow Behavior**:
   - Follow-through rate: porcentaje de visitas a perfil que resultan en follow
   - Nichos más atractivos (por tasa de follow)
   - Distribución de follows por IAnfluencer
   - Tasa de unfollow vs follow

3. **Search Behavior**:
   - Términos más buscados (`search`)
   - Tasa de conversión de búsqueda (búsqueda → like → follow)

4. **User Journey**:
   - Secuencia: `page_view` → `search` → `profile_view` → `follow_ianfluencer` → `post_like` → `view_comments`
   - Tasa de abandono en cada paso

5. **Performance**:
   - Web Vitals (LCP, FID, CLS)
   - Correlación entre performance y engagement

### Dashboards Sugeridos

1. **Overview Dashboard**:
   - Total page views
   - Total engagement events (likes + comments views + follows)
   - Top IAnfluencers por engagement
   - Top IAnfluencers por número de follows
   - Términos de búsqueda más populares

2. **Content Performance**:
   - Posts con más likes
   - Posts con más visualizaciones de comentarios
   - IAnfluencers con mejor engagement rate
   - IAnfluencers con mayor crecimiento de followers

3. **User Behavior**:
   - Embudo de conversión: visit → search → profile_view → follow → engage
   - Follow-through rate por nicho
   - Tiempo promedio en sitio
   - Bounce rate por fuente de tráfico

4. **Follow Analytics**:
   - Total follows vs unfollows
   - Nichos más populares (por follows)
   - Promedio de follows por usuario
   - Retención: usuarios que siguen al menos a un IAnfluencer

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
   - `share_post`: Usuario comparte un post en redes sociales (ya implementado parcialmente)

3. **Conversiones**:
   - `complete_profile`: Usuario completa su perfil
   - `first_interaction`: Primera interacción del usuario (primer like o follow)
   - `first_follow`: Primer follow del usuario (KPI crítico)

### Optimizaciones

1. **Migración de Follow a Backend**:
   - Actualmente `follow_ianfluencer` y `unfollow_ianfluencer` usan localStorage
   - Próximo paso: crear endpoints backend `/api/ianfluencers/{id}/follow` y `/unfollow`
   - Tabla necesaria: `followers` (user_id, ianfluencer_id, created_at)
   - Mantener optimistic updates en frontend para mejor UX
   - Sincronizar datos existentes de localStorage al backend cuando esté disponible

2. **Debounceo de Búsqueda**:
   - Actualmente se envía evento en cada tecla
   - Considerar implementar debounce de 500ms para reducir eventos

3. **User Properties**:
   - Rastrear tipo de usuario (nuevo vs. recurrente)
   - Dispositivo (móvil vs. desktop)
   - Fuente de adquisición
   - Número de IAnfluencers que sigue

4. **Enhanced Measurement**:
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

*Última actualización: 2025-11-19*
*Versión: 1.1.0*
