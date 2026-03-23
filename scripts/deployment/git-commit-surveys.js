const { execSync } = require('child_process');

function gitCommitSurveys() {
  console.log('🚀 Subiendo sistema de encuestas a Git...');
  
  try {
    // Verificar estado actual
    console.log('📋 Verificando estado del repositorio...');
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    console.log('Archivos modificados:');
    console.log(status);
    
    // Agregar todos los archivos
    console.log('📝 Agregando archivos...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Verificar qué se va a commitear
    console.log('📋 Archivos preparados para commit:');
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    console.log(staged);
    
    // Hacer commit
    console.log('💾 Haciendo commit...');
    const commitMessage = `feat: Implementar sistema completo de encuestas

- ✅ Crear tablas de base de datos (surveys, survey_options, survey_votes, survey_stats)
- ✅ Implementar controlador surveyController.js con todas las funcionalidades CRUD
- ✅ Crear rutas survey.routes.js con endpoints públicos y de administrador
- ✅ Integrar rutas en app.js
- ✅ Crear scripts de configuración y pruebas
- ✅ Sistema de votación con control de duplicados por IP/user_id
- ✅ Estadísticas en tiempo real con porcentajes
- ✅ Soporte para encuestas de selección única y múltiple
- ✅ Validaciones robustas y manejo de errores
- ✅ Datos de ejemplo incluidos para pruebas

Endpoints implementados:
- GET /api/v1/surveys - Obtener todas las encuestas
- GET /api/v1/surveys/active - Obtener encuestas activas
- GET /api/v1/surveys/:id - Obtener encuesta específica
- GET /api/v1/surveys/:id/stats - Obtener estadísticas
- POST /api/v1/surveys/:id/vote - Votar en encuesta
- POST /api/v1/surveys - Crear encuesta (admin)
- PUT /api/v1/surveys/:id - Actualizar encuesta (admin)
- DELETE /api/v1/surveys/:id - Eliminar encuesta (admin)

Sistema listo para integración con frontend.`;
    
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    // Hacer push
    console.log('🚀 Haciendo push...');
    execSync('git push', { stdio: 'inherit' });
    
    console.log('✅ Sistema de encuestas subido exitosamente a Git');
    
  } catch (error) {
    console.error('❌ Error durante el proceso de Git:', error.message);
    
    if (error.message.includes('fatal: not a git repository')) {
      console.log('💡 Solución: Inicializar repositorio Git');
      console.log('   git init');
      console.log('   git remote add origin <URL_DEL_REPOSITORIO>');
    } else if (error.message.includes('fatal: remote origin does not exist')) {
      console.log('💡 Solución: Agregar remote origin');
      console.log('   git remote add origin <URL_DEL_REPOSITORIO>');
    } else if (error.message.includes('fatal: refusing to merge unrelated histories')) {
      console.log('💡 Solución: Forzar merge');
      console.log('   git pull origin main --allow-unrelated-histories');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  gitCommitSurveys();
}

module.exports = gitCommitSurveys; 