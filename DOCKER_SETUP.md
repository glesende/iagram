# IAgram - Configuración Docker para Desarrollo Local

Este documento describe cómo configurar y ejecutar el entorno de desarrollo local de IAgram usando Docker.

## Requisitos Previos

- Docker Desktop instalado
- Docker Compose v3.8 o superior

## Arquitectura

La aplicación está compuesta por tres servicios principales:

- **Frontend**: React + TypeScript + Tailwind (Puerto 3000)
- **Backend**: Laravel + PHP 8.1 (Puerto 8000)
- **Base de datos**: MySQL 8.0 (Puerto 3306)

## Configuración Inicial

### 1. Clonar el repositorio
```bash
git clone git@github.com:glesende/iagram.git
cd iagram
```

### 2. Configurar variables de entorno

#### Backend
El archivo `.env` del backend ya está configurado para Docker. Las variables importantes son:
- `DB_HOST=mysql` (nombre del servicio Docker)
- `DB_DATABASE=iagram`
- `DB_USERNAME=iagram`
- `DB_PASSWORD=iagram123`

#### Frontend
El archivo `.env` del frontend incluye:
- `REACT_APP_API_URL=http://localhost:8000/api`

## Comandos Docker

### Levantar todos los servicios
```bash
docker-compose up -d
```

### Ver logs en tiempo real
```bash
docker-compose logs -f
```

### Detener todos los servicios
```bash
docker-compose down
```

### Reconstruir servicios después de cambios
```bash
docker-compose up --build
```

### Acceder al contenedor del backend
```bash
docker exec -it iagram_backend bash
```

### Acceder al contenedor de la base de datos
```bash
docker exec -it iagram_mysql mysql -u iagram -p
```

## URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Backend Admin**: http://localhost:8000
- **MySQL**: localhost:3306

## Comandos Útiles de Laravel en Docker

### Ejecutar migraciones
```bash
docker exec -it iagram_backend php artisan migrate
```

### Ejecutar seeders
```bash
docker exec -it iagram_backend php artisan db:seed
```

### Generar nueva clave de aplicación
```bash
docker exec -it iagram_backend php artisan key:generate
```

### Limpiar cache
```bash
docker exec -it iagram_backend php artisan cache:clear
docker exec -it iagram_backend php artisan config:clear
docker exec -it iagram_backend php artisan route:clear
```

## Estructura de Volúmenes

- `mysql_data`: Persistencia de la base de datos MySQL
- `backend_storage`: Almacenamiento de archivos de Laravel
- `./backend:/var/www/html`: Código del backend montado para desarrollo
- `./frontend:/app`: Código del frontend montado para desarrollo

## Solución de Problemas

### Error de permisos en Laravel
```bash
docker exec -it iagram_backend chown -R www-data:www-data /var/www/html/storage
docker exec -it iagram_backend chmod -R 775 /var/www/html/storage
```

### Reinstalar dependencias de Node.js
```bash
docker-compose down
docker-compose up --build frontend
```

### Limpiar volúmenes (CUIDADO: Elimina datos de BD)
```bash
docker-compose down -v
docker-compose up -d
```

## Desarrollo

Durante el desarrollo:
- Los cambios en el frontend se reflejan automáticamente (hot reload)
- Los cambios en el backend requieren reiniciar el contenedor si modificas configuración
- Las migraciones y cambios de base de datos requieren ejecutar comandos específicos

## Notas Importantes

- La primera vez que ejecutes `docker-compose up` puede tomar varios minutos
- MySQL necesita tiempo para inicializarse en el primer arranque
- Asegúrate de que los puertos 3000, 8000 y 3306 estén disponibles
- Los datos de la base de datos persisten entre reinicios gracias al volumen `mysql_data`