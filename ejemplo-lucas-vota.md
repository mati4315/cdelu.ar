# 👤 Ejemplo: Lucas Vota y Refresca la Página

## 📋 Escenario Completo

### **Paso 1: Lucas Ve la Encuesta (Estado 0)**
```
📱 Lucas abre la página
├── Ve la encuesta: "¿Cuál es tu color favorito?"
├── Estado: has_voted = false
├── Muestra: show_options = true
└── Interfaz: Botones para votar
```

### **Paso 2: Lucas Vota**
```javascript
// Lucas hace clic en "Azul"
POST /api/v1/surveys/25/vote
{
  "option_ids": [52]  // ID de la opción "Azul"
}

// Backend guarda en la BD
INSERT INTO survey_votes (
  survey_id, option_id, user_id, has_voted
) VALUES (25, 52, 11, TRUE);  // ← has_voted = TRUE

// Respuesta del API
{
  "success": true,
  "message": "Voto registrado exitosamente",
  "data": {
    "survey_id": 25,
    "has_voted": true,  // ← Estado 1
    "show_options": false
  }
}
```

### **Paso 3: Lucas Refresca la Página**
```javascript
// Frontend hace nueva petición
GET /api/v1/surveys/active

// Backend consulta la BD
SELECT id FROM survey_votes 
WHERE survey_id = 25 AND user_id = 11 AND has_voted = TRUE
LIMIT 1;

// Resultado: Encontró 1 voto → hasVoted = true

// Respuesta del API
{
  "success": true,
  "data": [{
    "id": 25,
    "question": "¿Cuál es tu color favorito?",
    "total_votes": 3,
    "has_voted": true,   // ← Sigue en Estado 1
    "show_options": false, // ← Sigue sin mostrar opciones
    "options": [
      {
        "id": 51,
        "option_text": "Rojo",
        "votes_count": 1,
        "percentage": 33.33
      },
      {
        "id": 52,
        "option_text": "Azul",
        "votes_count": 2,  // ← Incluye el voto de Lucas
        "percentage": 66.67
      }
    ]
  }]
}
```

### **Paso 4: Frontend Muestra Estado 1**
```vue
<template>
  <!-- Como has_voted = true, muestra resultados -->
  <div v-if="!survey.show_options" class="voting-results">
    <h3>Resultados de la encuesta</h3>
    
    <!-- Opción 1: Rojo -->
    <div class="result-bar">
      <span>Rojo</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 33.33%"></div>
      </div>
      <span>33.33% (1 voto)</span>
    </div>
    
    <!-- Opción 2: Azul (la que votó Lucas) -->
    <div class="result-bar">
      <span>Azul</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 66.67%"></div>
      </div>
      <span>66.67% (2 votos)</span>
    </div>
  </div>
</template>
```

## ✅ **Confirmación: Lucas SIEMPRE Verá Estado 1**

### **¿Por qué persiste?**

1. **Base de Datos**: `has_voted = TRUE` está guardado permanentemente
2. **Consulta**: Cada vez que Lucas refresca, se consulta la BD
3. **Resultado**: Siempre encuentra su voto → `has_voted = true`
4. **Interfaz**: Siempre muestra resultados, nunca opciones

### **Verificación en la BD:**
```sql
-- Consulta para verificar el voto de Lucas
SELECT 
  sv.id,
  sv.survey_id,
  sv.user_id,
  sv.has_voted,
  s.question,
  so.option_text
FROM survey_votes sv
JOIN surveys s ON sv.survey_id = s.id
JOIN survey_options so ON sv.option_id = so.id
WHERE sv.user_id = 11 AND sv.has_voted = TRUE;

-- Resultado esperado:
-- ID: 47, Survey: 25, User: 11, Has Voted: 1, Question: "¿Cuál es tu color favorito?", Option: "Azul"
```

## 🎯 **Beneficios de esta Persistencia:**

1. **Consistencia**: Lucas siempre ve el mismo estado
2. **Experiencia**: No puede votar dos veces por error
3. **Claridad**: Ve inmediatamente los resultados de su voto
4. **Seguridad**: El voto está permanentemente registrado

## 🔄 **Flujo Completo:**

```
Lucas Vota → BD Guarda has_voted=TRUE → Lucas Refresca → BD Consulta → Encuentra Voto → Estado 1
```

**¡Sí, Lucas siempre verá el Estado 1 después de refrescar!** ✅ 