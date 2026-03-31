const pool = require('./src/config/database');
const feedController = require('./src/controllers/feedController');

async function testControllerDirectly() {
  console.log('🧪 Probando getFeed directamente desde el controlador...\n');
  
  const dummyRequest = {
    query: {
      page: 1,
      limit: 10,
      sort: 'published_at',
      order: 'desc'
    },
    user: null,
    log: {
      error: (msg) => console.error('LOG ERROR:', msg)
    }
  };

  const dummyReply = {
    status: (code) => {
      console.log(`📡 Status set to: ${code}`);
      return dummyReply;
    },
    send: (data) => {
      console.log('📡 Data sent:', JSON.stringify(data, null, 2));
      return dummyReply;
    }
  };

  try {
    await feedController.getFeed(dummyRequest, dummyReply);
  } catch (err) {
    console.error('💥 Error capturado:', err);
  } finally {
    process.exit(0);
  }
}

testControllerDirectly();
