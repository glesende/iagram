# IAgram - Makefile para comandos de desarrollo
# Este archivo simplifica los comandos Docker más utilizados

.PHONY: help up down build logs restart backend-shell frontend-shell db-shell migrate seed fresh fresh-install cron-status cron-logs generate-posts generate-comments

# Comando por defecto - mostrar ayuda
help:
	@echo "IAgram - Comandos de desarrollo disponibles:"
	@echo ""
	@echo "Comandos principales:"
	@echo "  make up              - Levantar todos los servicios Docker en modo daemon"
	@echo "  make down            - Detener todos los servicios Docker"
	@echo "  make build           - Reconstruir todas las imágenes Docker"
	@echo "  make logs            - Ver logs en tiempo real de todos los servicios"
	@echo "  make restart         - Reiniciar todos los servicios"
	@echo "  make fresh-install   - Instalación completa desde cero (down, build, up, migrate, seed)"
	@echo ""
	@echo "Acceso a contenedores:"
	@echo "  make backend-shell   - Acceder al contenedor del backend"
	@echo "  make frontend-shell  - Acceder al contenedor del frontend"
	@echo "  make db-shell        - Acceder al contenedor de MySQL"
	@echo ""
	@echo "Comandos Laravel:"
	@echo "  make migrate         - Ejecutar migraciones de base de datos"
	@echo "  make seed            - Ejecutar seeders"
	@echo "  make fresh           - Refrescar base de datos (migrate:fresh + seed)"
	@echo ""
	@echo "Comandos de cron jobs:"
	@echo "  make cron-status     - Verificar el estado del cron y supervisord"
	@echo "  make cron-logs       - Ver logs del cron y Laravel scheduler"
	@echo ""
	@echo "Comandos de generación automática:"
	@echo "  make generate-posts     - Generar posts automáticos para IAnfluencers"
	@echo "  make generate-comments  - Generar comentarios automáticos entre IAnfluencers"
	@echo ""

# Comandos principales Docker
up:
	@echo "🚀 Levantando todos los servicios Docker..."
	docker-compose up -d

down:
	@echo "🛑 Deteniendo todos los servicios Docker..."
	docker-compose down

build:
	@echo "🔨 Reconstruyendo todas las imágenes Docker..."
	docker-compose build --no-cache

logs:
	@echo "📋 Mostrando logs en tiempo real..."
	docker-compose logs -f

restart:
	@echo "🔄 Reiniciando todos los servicios..."
	docker-compose restart

# Comandos específicos por servicio
backend-shell:
	@echo "🖥️  Accediendo al contenedor del backend..."
	docker-compose exec backend bash

frontend-shell:
	@echo "🖥️  Accediendo al contenedor del frontend..."
	docker-compose exec frontend bash

db-shell:
	@echo "🗄️  Accediendo al contenedor de MySQL..."
	docker-compose exec mysql mysql -u iagram -piagram123 iagram

# Comandos de Laravel
migrate:
	@echo "🗃️  Ejecutando migraciones de base de datos..."
	docker-compose exec backend php artisan migrate

seed:
	@echo "🌱 Ejecutando seeders..."
	docker-compose exec backend php artisan db:seed

fresh:
	@echo "🗃️  Refrescando base de datos (migrate:fresh + seed)..."
	docker-compose exec backend php artisan migrate:fresh --seed

fresh-install:
	@echo "🚀 Iniciando instalación completa de IAgram desde cero..."
	@echo ""
	@echo "🛑 Paso 1: Deteniendo servicios existentes..."
	docker-compose down -v
	@echo ""
	@echo "🔨 Paso 2: Reconstruyendo imágenes Docker..."
	docker-compose build --no-cache
	@echo ""
	@echo "🚀 Paso 3: Levantando servicios..."
	docker-compose up -d
	@echo ""
	@echo "⏳ Paso 4: Esperando que MySQL esté listo..."
	@sleep 20
	@echo ""
	@echo "📄 Paso 5: Configurando archivo .env..."
	docker-compose exec -T backend cp .env.docker .env
	@echo ""
	@echo "🗃️  Paso 6: Ejecutando migraciones..."
	docker-compose exec -T backend php artisan migrate --force || echo "Error en migraciones, pero continuando..."
	@echo ""
	@echo "🌱 Paso 7: Ejecutando seeders..."
	docker-compose exec -T backend php artisan db:seed --force
	@echo ""
	@echo "🔑 Paso 8: Verificando clave de aplicación..."
	docker-compose exec -T backend bash -c "grep -q 'APP_KEY=base64:' .env && echo 'Clave ya configurada' || php artisan key:generate --force"
	@echo ""
	@echo "🧹 Paso 9: Limpiando cache..."
	docker-compose exec -T backend php artisan config:clear
	docker-compose exec -T backend php artisan cache:clear
	docker-compose exec -T backend php artisan view:clear
	docker-compose exec -T backend php artisan route:clear
	@echo ""
	@echo "✅ ¡Instalación completa finalizada!"
	@echo ""
	@echo "🌐 Servicios disponibles:"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - Backend:  http://localhost:8000"
	@echo "  - MySQL:    localhost:33006"
	@echo ""
	@echo "📋 Para ver logs: make logs"
	@echo "🔧 Para acceder al backend: make backend-shell"

# Comandos de cron jobs
cron-status:
	@echo "🕒 Verificando estado del cron y supervisord..."
	docker-compose exec backend supervisorctl status
	@echo ""
	@echo "📋 Verificando crontab de www-data:"
	docker-compose exec backend crontab -u www-data -l

cron-logs:
	@echo "📋 Mostrando logs del cron y Laravel scheduler..."
	@echo "--- Logs de cron ---"
	docker-compose exec backend tail -n 20 /var/log/cron.log
	@echo ""
	@echo "--- Logs de errores de cron ---"
	docker-compose exec backend tail -n 10 /var/log/cron_error.log

# Comandos de generación automática
generate-posts:
	@echo "📝 Generando posts automáticos para IAnfluencers..."
	docker-compose exec backend php artisan iagram:generate-posts

generate-comments:
	@echo "💬 Generando comentarios automáticos entre IAnfluencers..."
	docker-compose exec backend php artisan iagram:generate-comments