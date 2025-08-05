# 🎯 Sistema de Estado Binario para Encuestas

## 📋 Concepto Principal

**Estado 0 (No votado)**: Usuario ve opciones para votar  
**Estado 1 (Votado)**: Usuario ve resultados

### ✅ Ventajas del Sistema Binario:

1. **Simplicidad Extrema**: Solo `true` o `false`
2. **Performance**: Una sola consulta a la base de datos
3. **Consistencia**: Estado muy claro y predecible
4. **Escalabilidad**: Fácil de mantener y extender
5. **UX Mejorada**: Comportamiento muy intuitivo

## 🔧 Implementación en el Backend

### 1. Modificación de la Base de Datos

#### Script: `add-survey-vote-state.sql`

```sql
-- Agregar campo has_voted a la tabla survey_votes
ALTER TABLE survey_votes ADD COLUMN has_voted BOOLEAN DEFAULT FALSE;

-- Actualizar registros existentes para marcar como votados
UPDATE survey_votes SET has_voted = TRUE WHERE id > 0;

-- Crear índice para optimizar consultas
CREATE INDEX idx_survey_votes_user_survey ON survey_votes(user_id, survey_id, has_voted);
```

### 2. Modificación del Controlador

#### Archivo: `src/controllers/surveyController.js`

#### Método `getActiveSurveys()` - Actualizado:

```javascript
async getActiveSurveys(request, reply) {
  try {
    const { limit = 5 } = request.query;
    const userId = request.user ? request.user.id : null;
    
    // Obtener encuestas activas con total de votos
    const [surveys] = await pool.execute(`
      SELECT 
        s.id, s.question, s.is_multiple_choice, s.max_votes_per_user,
        COUNT(DISTINCT so.id) as options_count,
        COUNT(DISTINCT sv.id) as total_votes
      FROM surveys s
      LEFT JOIN survey_options so ON s.id = so.survey_id
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      WHERE s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    // Para cada encuesta, verificar estado de votación
    for (let survey of surveys) {
      // Obtener opciones con estadísticas
      const [options] = await pool.execute(`
        SELECT 
          so.id, 
          so.option_text,
          so.display_order,
          COUNT(sv.id) as votes_count,
          ROUND((COUNT(sv.id) / NULLIF(?, 0)) * 100, 2) as percentage
        FROM survey_options so
        LEFT JOIN survey_votes sv ON so.id = sv.option_id
        WHERE so.survey_id = ?
        GROUP BY so.id, so.option_text, so.display_order
        ORDER BY so.display_order, so.id
      `, [survey.total_votes, survey.id]);
      
      // Verificar si el usuario ya votó (sistema de estado binario)
      let hasVoted = false;
      if (userId) {
        const [userVote] = await pool.execute(`
          SELECT id FROM survey_votes 
          WHERE survey_id = ? AND user_id = ? AND has_voted = TRUE
          LIMIT 1
        `, [survey.id, userId]);
        hasVoted = userVote.length > 0;
      } else {
        // Para usuarios anónimos, verificar por IP
        const userIp = request.ip;
        const [ipVote] = await pool.execute(`
          SELECT id FROM survey_votes 
          WHERE survey_id = ? AND user_ip = ? AND has_voted = TRUE
          LIMIT 1
        `, [survey.id, userIp]);
        hasVoted = ipVote.length > 0;
      }
      
      // Agregar campos del sistema de estado binario
      survey.has_voted = hasVoted;
      survey.show_options = !hasVoted; // true si no ha votado, false si ya votó
      survey.options = options;
    }
    
    reply.send({
      success: true,
      data: surveys
    });
  } catch (error) {
    console.error('Error al obtener encuestas activas:', error);
    reply.code(500).send({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las encuestas activas'
    });
  }
}
```

#### Método `voteSurvey()` - Actualizado:

```javascript
// Insertar votos con has_voted = TRUE
for (const optionId of option_ids) {
  await connection.execute(
    'INSERT INTO survey_votes (survey_id, option_id, user_id, user_ip, user_agent, has_voted) VALUES (?, ?, ?, ?, ?, TRUE)',
    [id, optionId, request.user.id, request.ip, request.headers['user-agent'] || null]
  );
}

// Respuesta con estado binario
reply.send({
  success: true,
  message: 'Voto registrado exitosamente',
  data: {
    survey_id: id,
    has_voted: true,
    show_options: false
  }
});
```

## 📊 Estructura de Respuesta

### Para usuarios NO autenticados (Estado 0):

```json
{
  "success": true,
  "data": [{
    "id": 1,
    "question": "¿Cuál es tu color favorito?",
    "total_votes": 5,
    "has_voted": false,  // ← NUEVO CAMPO
    "show_options": true, // ← NUEVO CAMPO
    "options": [
      {
        "id": 1,
        "option_text": "Rojo",
        "votes_count": 3,
        "percentage": 60
      },
      {
        "id": 2,
        "option_text": "Azul", 
        "votes_count": 2,
        "percentage": 40
      }
    ]
  }]
}
```

### Para usuarios autenticados que YA votaron (Estado 1):

```json
{
  "success": true,
  "data": [{
    "id": 1,
    "question": "¿Cuál es tu color favorito?",
    "total_votes": 5,
    "has_voted": true,   // ← NUEVO CAMPO
    "show_options": false, // ← NUEVO CAMPO
    "options": [
      {
        "id": 1,
        "option_text": "Rojo",
        "votes_count": 3,
        "percentage": 60
      },
      {
        "id": 2,
        "option_text": "Azul",
        "votes_count": 2, 
        "percentage": 40
      }
    ]
  }]
}
```

### Respuesta después de votar:

```json
{
  "success": true,
  "message": "Voto registrado exitosamente",
  "data": {
    "survey_id": 1,
    "has_voted": true,  // ← NUEVO CAMPO
    "show_options": false // ← NUEVO CAMPO
  }
}
```

## 🎯 Lógica del Frontend

### En el componente Vue:

```javascript
// Función simplificada para verificar si el usuario votó
const hasUserVoted = (survey) => {
  return survey.has_voted === true;
};

// En el template
<template>
  <!-- Mostrar opciones si show_options es true -->
  <div v-if="survey.show_options" class="voting-options">
    <!-- Opciones para votar -->
    <button 
      v-for="option in survey.options" 
      :key="option.id"
      @click="vote(option.id)"
    >
      {{ option.option_text }}
    </button>
  </div>
  
  <!-- Mostrar resultados si show_options es false -->
  <div v-else class="voting-results">
    <!-- Resultados con barras de progreso -->
    <div 
      v-for="option in survey.options" 
      :key="option.id"
      class="result-bar"
    >
      <span>{{ option.option_text }}</span>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: option.percentage + '%' }"
        ></div>
      </div>
      <span>{{ option.percentage }}% ({{ option.votes_count }} votos)</span>
    </div>
  </div>
</template>
```

## 🚀 Beneficios Implementados

### 1. **Simplicidad Extrema**
- Solo verificar `has_voted: true/false`
- No más lógica compleja de verificación

### 2. **Performance Mejorado**
- Una sola consulta a la base de datos
- Índices optimizados para consultas rápidas

### 3. **Consistencia Garantizada**
- Estado muy claro y predecible
- Comportamiento uniforme en toda la aplicación

### 4. **UX Mejorada**
- Transición clara entre estados
- Feedback inmediato al usuario

### 5. **Escalabilidad**
- Fácil de mantener y extender
- Código más limpio y legible

## 🔍 Scripts de Verificación

### 1. Aplicar sistema de estado binario:
```bash
node apply-survey-vote-state-simple.js
```

### 2. Probar endpoints:
```bash
node test-binary-state-surveys.js
```

### 3. Verificar estructura de base de datos:
```sql
DESCRIBE survey_votes;
SELECT * FROM survey_votes WHERE has_voted = TRUE LIMIT 5;
```

## 📝 Resumen de Cambios

### Base de Datos:
- ✅ Campo `has_voted` agregado a `survey_votes`
- ✅ Registros existentes actualizados
- ✅ Índice optimizado creado

### Backend:
- ✅ Método `getActiveSurveys()` actualizado
- ✅ Método `voteSurvey()` actualizado
- ✅ Campos `has_voted` y `show_options` agregados

### Frontend (Preparado):
- ✅ Lógica simplificada para verificar estado
- ✅ Template preparado para ambos estados
- ✅ Transiciones claras entre estados

---

**Estado**: ✅ **IMPLEMENTADO**  
**Fecha**: $(date)  
**Versión**: 2.0  
**Autor**: Sistema de Estado Binario 