# Configuración de Cron Jobs en IAgram

Esta documentación describe la implementación de cron jobs en Docker para ejecutar comandos programados de Laravel automáticamente.

## Arquitectura

La configuración utiliza **supervisord** para manejar tanto Apache como el servicio cron dentro del mismo contenedor:

- **Apache**: Servidor web para la aplicación Laravel
- **Cron**: Ejecuta el Laravel Scheduler cada minuto
- **Supervisord**: Proceso supervisor que administra ambos servicios

## Archivos de Configuración

### 1. `/backend/Dockerfile`
- Instalación de `cron` y `supervisor`
- Configuración de permisos y logs
- Comando de inicio con supervisord

### 2. `/backend/supervisord.conf`
- Configuración de supervisord para manejar Apache y cron
- Definición de logs y comportamiento de los procesos

### 3. `/backend/crontab`
- Entrada cron que ejecuta `php artisan schedule:run` cada minuto
- Configurado para ejecutarse como usuario `www-data`

### 4. `/backend/app/Console/Kernel.php`
- Definición del schedule de Laravel
- Comando `iagram:generate-posts` programado cada 3 horas

## Comandos de Administración

### Verificar Estado
```bash
# Verificar que los servicios estén ejecutándose
make cron-status
```

### Ver Logs
```bash
# Ver logs del cron y Laravel scheduler
make cron-logs
```

### Acceso Manual
```bash
# Acceder al contenedor del backend
make backend-shell

# Dentro del contenedor, verificar supervisord
supervisorctl status

# Verificar crontab
crontab -u www-data -l
```

## Funcionamiento

1. **Supervisord** inicia automáticamente al levantar el contenedor
2. **Apache** se ejecuta para servir la aplicación Laravel
3. **Cron** se ejecuta y cada minuto llama a `php artisan schedule:run`
4. **Laravel Scheduler** evalúa qué comandos deben ejecutarse según su programación
5. El comando `iagram:generate-posts` se ejecuta cada 3 horas automáticamente

## Logs

- **Cron logs**: `/var/log/cron.log`
- **Cron errors**: `/var/log/cron_error.log`
- **Supervisor logs**: `/var/log/supervisor/supervisord.log`

## Solución de Problemas

### Si el cron no funciona:
```bash
# Verificar que supervisord esté ejecutando cron
make backend-shell
supervisorctl status

# Reiniciar cron si es necesario
supervisorctl restart cron
```

### Si no se generan logs:
```bash
# Verificar permisos de logs
ls -la /var/log/cron*

# Verificar que el crontab esté instalado
crontab -u www-data -l
```

Esta configuración permite que los comandos artisan programados se ejecuten automáticamente sin intervención manual, cumpliendo con el requisito técnico de "comandos programados" definido para IAgram.