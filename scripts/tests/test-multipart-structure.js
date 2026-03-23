const fastify = require('fastify')({ logger: true });
const path = require('path');

// Configurar CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Registrar multipart
fastify.register(require('@fastify/multipart'), {
  attachFieldsToBody: true,
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024 * 10, // 10MB
    files: 1,
    fileSize: 1024 * 1024 * 10 // 10MB
  }
});

// Endpoint de test
fastify.post('/test-upload', async (request, reply) => {
  console.log('\n=== INICIO DEBUG MULTIPART ===');
  
  try {
    const profilePictureFile = request.body.profile_picture;
    
    console.log('🔍 Objeto completo request.body:', Object.keys(request.body));
    console.log('🔍 profilePictureFile existe:', !!profilePictureFile);
    
    if (profilePictureFile) {
      console.log('📁 Propiedades del archivo:');
      console.log('  - filename:', profilePictureFile.filename);
      console.log('  - mimetype:', profilePictureFile.mimetype);
      console.log('  - encoding:', profilePictureFile.encoding);
      console.log('  - fieldname:', profilePictureFile.fieldname);
      
      console.log('📁 Estructura interna:');
      console.log('  - tiene .file:', !!profilePictureFile.file);
      console.log('  - tiene .value:', !!profilePictureFile.value);
      console.log('  - tiene ._buf:', !!profilePictureFile._buf);
      console.log('  - todas las keys:', Object.keys(profilePictureFile));
      
      if (profilePictureFile.file) {
        console.log('📁 Propiedades de .file:');
        console.log('  - tipo:', typeof profilePictureFile.file);
        console.log('  - es stream:', profilePictureFile.file instanceof require('stream').Readable);
        console.log('  - tiene read():', typeof profilePictureFile.file.read === 'function');
        console.log('  - keys de file:', Object.keys(profilePictureFile.file));
      }
      
      if (profilePictureFile.value) {
        console.log('📁 Propiedades de .value:');
        console.log('  - tipo:', typeof profilePictureFile.value);
        console.log('  - es Buffer:', Buffer.isBuffer(profilePictureFile.value));
        console.log('  - longitud:', profilePictureFile.value?.length);
      }
      
      // Intentar leer el archivo
      console.log('\n🚀 Intentando leer archivo...');
      
      let fileBuffer = null;
      let method = 'ninguno';
      
      try {
        if (profilePictureFile.value && Buffer.isBuffer(profilePictureFile.value)) {
          fileBuffer = profilePictureFile.value;
          method = 'value (Buffer)';
        } else if (profilePictureFile.file && typeof profilePictureFile.file.read === 'function') {
          fileBuffer = await profilePictureFile.file.read();
          method = 'file.read()';
        } else if (profilePictureFile._buf) {
          fileBuffer = profilePictureFile._buf;
          method = '_buf';
        }
        
        console.log('✅ Método exitoso:', method);
        console.log('✅ Buffer obtenido:', !!fileBuffer);
        console.log('✅ Es Buffer:', Buffer.isBuffer(fileBuffer));
        console.log('✅ Tamaño:', fileBuffer?.length);
        
        return reply.send({
          success: true,
          method: method,
          hasBuffer: !!fileBuffer,
          isBuffer: Buffer.isBuffer(fileBuffer),
          size: fileBuffer?.length,
          filename: profilePictureFile.filename,
          mimetype: profilePictureFile.mimetype
        });
        
      } catch (readError) {
        console.log('❌ Error al leer:', readError.message);
        return reply.status(500).send({
          error: 'Error al leer archivo',
          details: readError.message,
          method: method
        });
      }
      
    } else {
      console.log('❌ No se encontró profile_picture en request.body');
      return reply.status(400).send({ error: 'No se encontró archivo' });
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
    console.log('❌ Stack:', error.stack);
    return reply.status(500).send({ error: error.message });
  }
  
  console.log('=== FIN DEBUG MULTIPART ===\n');
});

// Iniciar servidor de test
const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('🚀 Servidor de test corriendo en http://localhost:3002');
    console.log('📝 Para probar: POST http://localhost:3002/test-upload');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 