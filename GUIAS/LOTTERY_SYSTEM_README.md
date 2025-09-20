# Sistema de Lotería - CdelU

## Descripción

Sistema completo de loterías para la plataforma CdelU que permite a los administradores crear loterías gratuitas y de pago, y a los usuarios participar en ellas.

## Características

### ✅ Funcionalidades Implementadas

- **Loterías Gratuitas y de Pago**: Soporte completo para ambos tipos
- **Sistema de Tickets**: Numeración automática y reserva temporal
- **Selección de Ganadores**: Automática y manual
- **Dashboard de Administración**: Interfaz completa para gestión
- **Página de Participación**: Interfaz para usuarios
- **Sistema de Pagos**: Integración con loterías de pago
- **Notificaciones**: Email a ganadores y participantes
- **Estadísticas**: Reportes detallados
- **Seguridad**: Autenticación JWT y validaciones

### 🎯 Características Técnicas

- **Backend**: Node.js + Fastify + MySQL
- **Frontend**: HTML + Bootstrap + JavaScript
- **Autenticación**: JWT con roles (admin/user)
- **Base de Datos**: MySQL con transacciones
- **API REST**: Documentada con Swagger
- **Rate Limiting**: Protección contra spam
- **Validaciones**: Completa validación de datos

## Instalación

### 1. Configurar Base de Datos

```bash
# Ejecutar script de configuración
node setup-lottery-database.js
```

### 2. Verificar Dependencias

```bash
# Instalar dependencias si no están instaladas
npm install mysql2 axios dotenv
```

### 3. Configurar Variables de Entorno

```bash
# Crear archivo .env si no existe
cp env.local .env

# Configurar variables de base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=trigamer_diario
```

### 4. Iniciar Servidor

```bash
# Iniciar servidor de desarrollo
npm start

# O en producción
npm run production
```

## Uso

### Para Administradores

1. **Acceder al Dashboard**:
   - URL: `http://localhost:3001/lottery-admin.html`
   - Login con credenciales de administrador

2. **Crear Lotería**:
   - Click en "Nueva Lotería"
   - Completar formulario
   - Seleccionar tipo (gratuita o de pago)
   - Configurar fechas y premios

3. **Gestionar Loterías**:
   - Ver todas las loterías
   - Activar loterías en borrador
   - Finalizar loterías vencidas
   - Ver ganadores y estadísticas

### Para Usuarios

1. **Acceder a Loterías**:
   - URL: `http://localhost:3001/lottery.html`
   - Registrarse o iniciar sesión

2. **Participar**:
   - Ver loterías disponibles
   - Seleccionar números
   - Comprar tickets (gratuitos o de pago)

3. **Ver Mis Tickets**:
   - Acceder a historial de participación
   - Ver tickets ganadores

## API Endpoints

### Loterías

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/lotteries` | Listar loterías | No |
| GET | `/api/lotteries/:id` | Obtener lotería | No |
| POST | `/api/lotteries` | Crear lotería | Admin |
| PUT | `/api/lotteries/:id` | Actualizar lotería | Admin |
| POST | `/api/lotteries/:id/buy` | Comprar tickets | User |
| GET | `/api/lotteries/:id/tickets` | Mis tickets | User |
| POST | `/api/lotteries/:id/finish` | Finalizar lotería | Admin |
| GET | `/api/lotteries/:id/winners` | Ver ganadores | No |

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/register` | Registrarse |
| GET | `/api/v1/auth/me` | Ver perfil |

## Estructura de Base de Datos

### Tablas Principales

1. **`lotteries`**: Información de loterías
2. **`lottery_tickets`**: Tickets comprados
3. **`lottery_reserved_numbers`**: Números reservados temporalmente
4. **`lottery_winners`**: Ganadores de loterías
5. **`lottery_settings`**: Configuración del sistema

### Campos Importantes

```sql
-- Lotería
id, title, description, is_free, ticket_price, 
min_tickets, max_tickets, num_winners, 
start_date, end_date, status, created_by

-- Ticket
lottery_id, user_id, ticket_number, payment_status, 
payment_amount, is_winner

-- Ganador
lottery_id, ticket_id, user_id, ticket_number, 
prize_description, notified_at, claimed_at
```

## Estados de Lotería

- **`draft`**: Borrador (solo admin puede ver)
- **`active`**: Activa (usuarios pueden participar)
- **`running`**: En curso (entre fechas de inicio y fin)
- **`overdue`**: Vencida (pasó fecha de fin)
- **`finished`**: Finalizada (ganadores seleccionados)
- **`cancelled`**: Cancelada (no alcanzó mínimo)

## Estados de Ticket

- **`pending`**: Pendiente de pago
- **`paid`**: Pagado
- **`failed`**: Pago fallido
- **`refunded`**: Reembolsado

## Configuración

### Variables de Entorno

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=trigamer_diario

# JWT
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=24h

# Servidor
PORT=3001
NODE_ENV=development
```

### Configuración del Sistema

```sql
-- Ver configuración actual
SELECT * FROM lottery_settings;

-- Actualizar configuración
UPDATE lottery_settings SET setting_value = '600' WHERE setting_key = 'reservation_timeout';
```

## Pruebas

### Script de Pruebas Automáticas

```bash
# Ejecutar pruebas completas
node test-lottery-system.js
```

### Pruebas Manuales

1. **Crear Usuario Admin**:
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123","email":"admin@test.com","role":"admin"}'
   ```

2. **Crear Lotería**:
   ```bash
   curl -X POST http://localhost:3001/api/lotteries \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"title":"Lotería Test","is_free":true,"max_tickets":10,"start_date":"2024-01-01T00:00:00Z","end_date":"2024-12-31T23:59:59Z"}'
   ```

3. **Participar en Lotería**:
   ```bash
   curl -X POST http://localhost:3001/api/lotteries/1/buy \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"ticket_numbers":[1,2,3]}'
   ```

## Seguridad

### Medidas Implementadas

- **Autenticación JWT**: Tokens seguros con expiración
- **Autorización por Roles**: Admin y User separados
- **Rate Limiting**: Protección contra spam
- **Validación de Datos**: Sanitización de inputs
- **Transacciones SQL**: Integridad de datos
- **Reserva Temporal**: Evita conflictos de números

### Recomendaciones

1. **Cambiar JWT Secret**: Usar secreto fuerte en producción
2. **HTTPS**: Usar certificados SSL en producción
3. **Backup**: Configurar backups automáticos de BD
4. **Monitoreo**: Implementar logs y alertas
5. **Firewall**: Configurar reglas de firewall

## Mantenimiento

### Tareas Programadas

```bash
# Limpiar reservas expiradas (cada 5 minutos)
*/5 * * * * node -e "require('./src/services/lotteryService').cleanExpiredReservations()"

# Verificar loterías vencidas (cada hora)
0 * * * * node -e "require('./src/services/lotteryService').checkOverdueLotteries()"
```

### Logs Importantes

```bash
# Ver logs del servidor
tail -f logs/app.log

# Ver errores
grep "ERROR" logs/app.log

# Ver actividad de loterías
grep "lottery" logs/app.log
```

## Troubleshooting

### Problemas Comunes

1. **Error de Conexión BD**:
   ```bash
   # Verificar configuración
   node -e "require('./src/config/database').testConnection()"
   ```

2. **Loterías no se cargan**:
   ```bash
   # Verificar tablas
   mysql -u root -p trigamer_diario -e "SHOW TABLES LIKE 'lottery%'"
   ```

3. **Error de autenticación**:
   ```bash
   # Verificar JWT secret
   echo $JWT_SECRET
   ```

4. **Tickets no se compran**:
   ```bash
   # Verificar estado de lotería
   curl http://localhost:3001/api/lotteries/1
   ```

### Comandos Útiles

```bash
# Reiniciar servidor
pm2 restart app

# Ver estado de servicios
pm2 status

# Ver logs en tiempo real
pm2 logs app

# Verificar base de datos
node check-database-structure.js
```

## Desarrollo

### Estructura del Proyecto

```
src/
├── controllers/
│   └── lotteryController.js    # Lógica de loterías
├── routes/
│   └── lottery.routes.js       # Rutas de API
├── services/
│   └── lotteryService.js       # Servicios de negocio
└── config/
    └── database.js             # Configuración BD

public/
├── lottery-admin.html          # Dashboard admin
└── lottery.html               # Página usuarios

sql/
└── create_lottery_tables.sql  # Esquema BD
```

### Agregar Nuevas Funcionalidades

1. **Nuevo Endpoint**:
   - Agregar método en `lotteryController.js`
   - Registrar ruta en `lottery.routes.js`
   - Documentar en Swagger

2. **Nueva Tabla**:
   - Crear script SQL
   - Actualizar modelo en controlador
   - Agregar validaciones

3. **Nueva Página**:
   - Crear archivo HTML en `public/`
   - Agregar JavaScript necesario
   - Probar funcionalidad

## Licencia

Este sistema es parte del proyecto CdelU y está bajo la misma licencia del proyecto principal.

## Soporte

Para soporte técnico o reportar bugs:

- **Email**: dev@cdelu.ar
- **Issues**: Crear issue en el repositorio
- **Documentación**: Ver archivos README.md

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2024  
**Desarrollado por**: Equipo CdelU 