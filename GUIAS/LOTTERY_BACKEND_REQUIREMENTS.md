# 🎰 Requerimientos del Backend - Sistema de Loterías

## 🚨 Endpoints Faltantes que se necesitan implementar

### 1. **Endpoint para obtener tickets vendidos**

```http
GET /api/v1/lotteries/{id}/sold-tickets
```

**Respuesta esperada:**
```json
{
  "ticket_numbers": [1, 3, 5, 7, 12, 15],
  "count": 6
}
```

### 2. **Fix del endpoint de compra de tickets**

```http
POST /api/v1/lotteries/{id}/buy
```

**Payload actual que envía el frontend:**
```json
{
  "ticket_numbers": [2, 4, 6]
}
```

**Error actual:** `400 Bad Request`

## 🔧 Modificaciones Necesarias

### 1. **En el controlador de loterías**

```javascript
// Nuevo endpoint para obtener tickets vendidos
router.get('/:id/sold-tickets', async (req, res) => {
  try {
    const lotteryId = req.params.id;
    
    // Consultar todos los tickets vendidos para esta lotería
    const soldTickets = await db.query(`
      SELECT ticket_number 
      FROM lottery_tickets 
      WHERE lottery_id = ? 
      AND payment_status = 'paid'
      ORDER BY ticket_number ASC
    `, [lotteryId]);
    
    const ticketNumbers = soldTickets.map(ticket => ticket.ticket_number);
    
    res.json({
      ticket_numbers: ticketNumbers,
      count: ticketNumbers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. **Fix del endpoint de compra**

```javascript
// Endpoint existente que necesita ser corregido
router.post('/:id/buy', async (req, res) => {
  try {
    const lotteryId = req.params.id;
    const { ticket_numbers } = req.body;
    const userId = req.user.id; // Del token JWT
    
    // Validaciones
    if (!ticket_numbers || !Array.isArray(ticket_numbers)) {
      return res.status(400).json({ 
        error: 'ticket_numbers es requerido y debe ser un array' 
      });
    }
    
    if (ticket_numbers.length === 0) {
      return res.status(400).json({ 
        error: 'Debe seleccionar al menos un ticket' 
      });
    }
    
    // Verificar que la lotería existe y está activa
    const lottery = await db.query(`
      SELECT * FROM lotteries 
      WHERE id = ? AND status = 'active'
    `, [lotteryId]);
    
    if (!lottery.length) {
      return res.status(404).json({ 
        error: 'Lotería no encontrada o no activa' 
      });
    }
    
    const lotteryData = lottery[0];
    
    // Verificar que los números están en el rango válido
    const invalidNumbers = ticket_numbers.filter(num => 
      num < 1 || num > lotteryData.max_tickets
    );
    
    if (invalidNumbers.length > 0) {
      return res.status(400).json({ 
        error: `Números inválidos: ${invalidNumbers.join(', ')}` 
      });
    }
    
    // Verificar que los números no están ya vendidos
    const soldTickets = await db.query(`
      SELECT ticket_number 
      FROM lottery_tickets 
      WHERE lottery_id = ? AND ticket_number IN (?)
    `, [lotteryId, ticket_numbers]);
    
    if (soldTickets.length > 0) {
      const soldNumbers = soldTickets.map(t => t.ticket_number);
      return res.status(400).json({ 
        error: `Los siguientes números ya están vendidos: ${soldNumbers.join(', ')}` 
      });
    }
    
    // Crear los tickets
    const createdTickets = [];
    
    for (const ticketNumber of ticket_numbers) {
      const result = await db.query(`
        INSERT INTO lottery_tickets (
          lottery_id, 
          user_id, 
          ticket_number, 
          payment_status, 
          payment_amount, 
          purchase_date
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        lotteryId,
        userId,
        ticketNumber,
        lotteryData.is_free ? 'paid' : 'pending',
        lotteryData.is_free ? 0 : lotteryData.ticket_price
      ]);
      
      createdTickets.push({
        id: result.insertId,
        lottery_id: lotteryId,
        user_id: userId,
        ticket_number: ticketNumber,
        payment_status: lotteryData.is_free ? 'paid' : 'pending',
        payment_amount: lotteryData.is_free ? 0 : lotteryData.ticket_price
      });
    }
    
    // Actualizar contador de tickets vendidos
    await db.query(`
      UPDATE lotteries 
      SET tickets_sold = tickets_sold + ? 
      WHERE id = ?
    `, [ticket_numbers.length, lotteryId]);
    
    res.json({
      message: 'Tickets comprados exitosamente',
      data: createdTickets,
      count: createdTickets.length
    });
    
  } catch (error) {
    console.error('Error buying tickets:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## 📊 Schema de Base de Datos

### Tabla `lottery_tickets`

```sql
CREATE TABLE lottery_tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lottery_id INT NOT NULL,
  user_id INT NOT NULL,
  ticket_number INT NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  is_winner BOOLEAN DEFAULT FALSE,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lottery_id) REFERENCES lotteries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_lottery_ticket (lottery_id, ticket_number)
);
```

### Tabla `lotteries` (asegurar que tenga estos campos)

```sql
CREATE TABLE lotteries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_free BOOLEAN DEFAULT FALSE,
  ticket_price DECIMAL(10,2) DEFAULT 0,
  min_tickets INT DEFAULT 1,
  max_tickets INT NOT NULL,
  num_winners INT DEFAULT 1,
  tickets_sold INT DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status ENUM('draft', 'active', 'finished', 'cancelled') DEFAULT 'draft',
  created_by INT NOT NULL,
  prize_description TEXT,
  terms_conditions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## 🎯 Endpoints Adicionales Recomendados

### 1. **Obtener tickets del usuario**

```http
GET /api/v1/lotteries/{id}/my-tickets
```

```javascript
router.get('/:id/my-tickets', async (req, res) => {
  try {
    const lotteryId = req.params.id;
    const userId = req.user.id;
    
    const tickets = await db.query(`
      SELECT * FROM lottery_tickets 
      WHERE lottery_id = ? AND user_id = ?
      ORDER BY ticket_number ASC
    `, [lotteryId, userId]);
    
    res.json({
      data: tickets,
      count: tickets.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. **Estadísticas de la lotería**

```http
GET /api/v1/lotteries/{id}/stats
```

```javascript
router.get('/:id/stats', async (req, res) => {
  try {
    const lotteryId = req.params.id;
    
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_tickets_sold,
        COUNT(DISTINCT user_id) as unique_participants,
        (SELECT max_tickets FROM lotteries WHERE id = ?) as max_tickets,
        (SELECT max_tickets FROM lotteries WHERE id = ?) - COUNT(*) as available_tickets
      FROM lottery_tickets 
      WHERE lottery_id = ? AND payment_status = 'paid'
    `, [lotteryId, lotteryId, lotteryId]);
    
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔐 Middleware de Autenticación

Asegurar que todos los endpoints protegidos usen el middleware de JWT:

```javascript
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Aplicar a endpoints protegidos
router.post('/:id/buy', authMiddleware, buyTicketsHandler);
router.get('/:id/my-tickets', authMiddleware, getMyTicketsHandler);
```

## 📝 Resumen de Cambios Necesarios

1. ✅ **Crear endpoint** `/lotteries/{id}/sold-tickets`
2. ✅ **Corregir endpoint** `/lotteries/{id}/buy` para aceptar `{ ticket_numbers: [1,2,3] }`
3. ✅ **Verificar schema** de `lottery_tickets` y `lotteries`
4. ✅ **Agregar validaciones** para números duplicados
5. ✅ **Implementar middleware** de autenticación
6. ✅ **Actualizar contador** `tickets_sold` en tabla `lotteries`

Una vez implementados estos cambios en el backend, el frontend funcionará correctamente sin necesidad de modificaciones adicionales. 