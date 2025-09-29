# IAgram - Makefile para comandos de desarrollo
# Este archivo simplifica los comandos Docker más utilizados

.PHONY: help up down build logs restart backend-shell frontend-shell db-shell migrate seed fresh cron-status cron-logs

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