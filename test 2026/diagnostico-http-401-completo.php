<?php
/**
 * 🔍 DIAGNÓSTICO INTERACTIVO HTTP 401
 * Script completo para diagnosticar problemas de autenticación API
 *
 * Uso: Abre en navegador: http://localhost/diagnostico-http-401-completo.php
 */

// Configuración
$cdelu_url = 'http://localhost:3001';
$api_key = 'EbVOmsJC5rVywOGVLQyvkmUBLhBtVASY';
$test_data = [
    'titulo' => 'Diagnóstico Automático - ' . date('Y-m-d H:i:s'),
    'descripcion' => 'Test de conexión generado automáticamente por el sistema de diagnóstico.',
    'is_oficial' => false
];

$results = [];
$errors = [];

// Función para hacer requests
function make_request($url, $method = 'GET', $headers = [], $data = null) {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $error = curl_error($ch);

    curl_close($ch);

    $headers = substr($response, 0, $header_size);
    $body = substr($response, $header_size);

    return [
        'http_code' => $http_code,
        'headers' => $headers,
        'body' => $body,
        'error' => $error
    ];
}

// Función para verificar JSON
function is_json($string) {
    json_decode($string);
    return json_last_error() === JSON_ERROR_NONE;
}

// Función para mostrar resultado
function show_result($title, $status, $details = '', $code = '') {
    $icon = $status ? '✅' : '❌';
    $color = $status ? 'green' : 'red';

    echo "<div style='margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;'>";
    echo "<h3 style='color: $color; margin: 0;'>$icon $title</h3>";
    if ($details) echo "<p style='margin: 5px 0;'>$details</p>";
    if ($code) echo "<pre style='background: #f5f5f5; padding: 10px; margin: 5px 0; overflow: auto;'>$code</pre>";
    echo "</div>";
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔍 Diagnóstico HTTP 401 - CdelU</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007cba;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .test-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .success { border-color: #46b450; background: #f0f9f0; }
        .error { border-color: #dc3232; background: #fef2f2; }
        .warning { border-color: #ffb900; background: #fff9e6; }
        .code {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            font-family: monospace;
            overflow-x: auto;
            margin: 10px 0;
        }
        .summary {
            background: #007cba;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .action-button {
            background: #007cba;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .action-button:hover {
            background: #005a87;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 DIAGNÓSTICO INTERACTIVO HTTP 401</h1>
            <h2>CdelU WordPress Integration</h2>
            <p><strong>API Key:</strong> <code><?php echo $api_key; ?></code></p>
            <p><strong>URL CdelU:</strong> <code><?php echo $cdelu_url; ?></code></p>
        </div>

        <?php
        // ==========================================
        // TEST 1: Verificar que CdelU está corriendo
        // ==========================================
        echo '<div class="test-section">';
        echo '<h2>🖥️ Test 1: Conectividad del Servidor CdelU</h2>';

        $health_response = make_request($cdelu_url . '/health');

        if ($health_response['http_code'] === 200 && is_json($health_response['body'])) {
            $health_data = json_decode($health_response['body'], true);
            show_result(
                'Servidor CdelU responde correctamente',
                true,
                "HTTP {$health_response['http_code']} - Status: {$health_data['status']}",
                "Uptime: {$health_data['uptime']}s\nEnvironment: {$health_data['environment']}"
            );
            $results['server'] = true;
        } else {
            show_result(
                'Servidor CdelU NO responde',
                false,
                "HTTP {$health_response['http_code']} - {$health_response['error']}",
                "Respuesta: " . substr($health_response['body'], 0, 200) . "..."
            );
            $results['server'] = false;
            $errors[] = 'Servidor CdelU no está corriendo o no responde';
        }
        echo '</div>';

        // ==========================================
        // TEST 2: Verificar endpoint existe
        // ==========================================
        echo '<div class="test-section">';
        echo '<h2>🔗 Test 2: Endpoint de API existe</h2>';

        $endpoint_response = make_request($cdelu_url . '/api/v1/news/external', 'POST', [
            'Content-Type: application/json'
        ], $test_data);

        if ($endpoint_response['http_code'] !== 404) {
            show_result(
                'Endpoint /api/v1/news/external existe',
                true,
                "HTTP {$endpoint_response['http_code']} (no es 404, así que existe)"
            );
            $results['endpoint'] = true;
        } else {
            show_result(
                'Endpoint NO existe',
                false,
                "HTTP 404 - El endpoint no está definido en CdelU"
            );
            $results['endpoint'] = false;
            $errors[] = 'Endpoint /api/v1/news/external no existe';
        }
        echo '</div>';

        // ==========================================
        // TEST 3: Verificar autenticación API Key
        // ==========================================
        echo '<div class="test-section">';
        echo '<h2>🔐 Test 3: Autenticación API Key</h2>';

        $auth_response = make_request($cdelu_url . '/api/v1/news/external', 'POST', [
            'Content-Type: application/json',
            'X-API-Key: ' . $api_key
        ], $test_data);

        if ($auth_response['http_code'] === 201) {
            show_result(
                '✅ AUTENTICACIÓN EXITOSA',
                true,
                "HTTP 201 - API Key aceptada, publicación creada",
                "Respuesta: " . substr($auth_response['body'], 0, 300) . "..."
            );
            $results['auth'] = true;
        } elseif ($auth_response['http_code'] === 401) {
            show_result(
                '❌ AUTENTICACIÓN FALLA - HTTP 401',
                false,
                "La API Key no es válida o el middleware no está configurado",
                "Headers enviados:\nX-API-Key: {$api_key}\nContent-Type: application/json\n\nRespuesta: {$auth_response['body']}"
            );
            $results['auth'] = false;
            $errors[] = 'API Key no es aceptada por CdelU';
        } else {
            show_result(
                '⚠️ Respuesta inesperada',
                false,
                "HTTP {$auth_response['http_code']} - No es 201 ni 401",
                "Respuesta completa: {$auth_response['body']}"
            );
            $results['auth'] = false;
            $errors[] = "Respuesta HTTP inesperada: {$auth_response['http_code']}";
        }
        echo '</div>';

        // ==========================================
        // TEST 4: Verificar sin API Key (debe fallar)
        // ==========================================
        echo '<div class="test-section">';
        echo '<h2>🚫 Test 4: Verificación de seguridad (sin API Key)</h2>';

        $no_auth_response = make_request($cdelu_url . '/api/v1/news/external', 'POST', [
            'Content-Type: application/json'
        ], $test_data);

        if ($no_auth_response['http_code'] === 401) {
            show_result(
                'Seguridad funciona correctamente',
                true,
                "HTTP 401 - Correctamente rechaza requests sin API Key"
            );
            $results['security'] = true;
        } else {
            show_result(
                '⚠️ Posible problema de seguridad',
                false,
                "HTTP {$no_auth_response['http_code']} - Debería ser 401",
                "Requests sin API Key deberían ser rechazados"
            );
            $results['security'] = false;
        }
        echo '</div>';

        // ==========================================
        // RESUMEN Y RECOMENDACIONES
        // ==========================================
        echo '<div class="summary">';
        echo '<h2>📊 RESUMEN DE DIAGNÓSTICO</h2>';

        $all_passed = !in_array(false, $results);

        if ($all_passed) {
            echo '<h3 style="color: #46b450;">✅ TODOS LOS TESTS PASARON</h3>';
            echo '<p>La integración WordPress-CdelU está funcionando correctamente.</p>';
        } else {
            echo '<h3 style="color: #dc3232;">❌ HAY PROBLEMAS QUE CORREGIR</h3>';
            echo '<ul>';
            foreach ($errors as $error) {
                echo "<li>$error</li>";
            }
            echo '</ul>';
        }

        echo '<table style="width: 100%; margin: 20px 0; border-collapse: collapse;">';
        echo '<tr><th style="text-align: left; padding: 10px; border: 1px solid white;">Test</th><th style="text-align: center; padding: 10px; border: 1px solid white;">Estado</th></tr>';

        $test_names = [
            'server' => 'Conectividad Servidor',
            'endpoint' => 'Endpoint API',
            'auth' => 'Autenticación API Key',
            'security' => 'Seguridad'
        ];

        foreach ($results as $key => $passed) {
            $status = $passed ? '✅ OK' : '❌ FAIL';
            $color = $passed ? '#46b450' : '#dc3232';
            echo "<tr><td style='padding: 10px; border: 1px solid white;'>{$test_names[$key]}</td><td style='text-align: center; padding: 10px; border: 1px solid white; color: $color;'>$status</td></tr>";
        }
        echo '</table>';
        echo '</div>';

        // ==========================================
        // ACCIONES RECOMENDADAS
        // ==========================================
        if (!$all_passed) {
            echo '<div class="test-section error">';
            echo '<h2>🔧 ACCIONES PARA CORREGIR</h2>';

            if (!$results['server']) {
                echo '<h3>1. Iniciar Servidor CdelU</h3>';
                echo '<div class="code">';
                echo "# En terminal, desde carpeta de CdelU\n";
                echo "cd /ruta/a/cdelu\n";
                echo "npm start\n";
                echo "# Debe mostrar: 'Listening on port 3001'\n";
                echo "</div>";
            }

            if (!$results['endpoint']) {
                echo '<h3>2. Verificar Endpoint existe</h3>';
                echo '<p>El endpoint <code>POST /api/v1/news/external</code> debe estar definido en las rutas de CdelU.</p>';
            }

            if (!$results['auth']) {
                echo '<h3>3. Configurar Autenticación API Key</h3>';
                echo '<p>El problema principal: CdelU no valida la API Key.</p>';

                echo '<h4>Código que debe existir en CdelU:</h4>';
                echo '<div class="code">';
                echo "// En src/middlewares/auth.js\n";
                echo "const authenticateApiKey = (request, reply) => {\n";
                echo "  const config = require('../config/default');\n";
                echo "  const apiKey = request.headers['x-api-key'];\n";
                echo "  \n";
                echo "  if (!apiKey || apiKey !== config.apiKey) {\n";
                echo "    return reply.status(401).send({ error: 'API Key inválida' });\n";
                echo "  }\n";
                echo "};\n";
                echo "\n";
                echo "module.exports = { authenticate, authorize, authenticateApiKey };";
                echo '</div>';

                echo '<h4>En src/config/default.js:</h4>';
                echo '<div class="code">';
                echo "apiKey: process.env.API_KEY || 'tu_api_key_super_seguro_para_externo',";
                echo '</div>';

                echo '<h4>En .env:</h4>';
                echo '<div class="code">';
                echo "API_KEY=EbVOmsJC5rVywOGVLQyvkmUBLhBtVASY";
                echo '</div>';

                echo '<h4>En src/features/news/news.routes.js:</h4>';
                echo '<div class="code">';
                echo "const { authenticate, authorize, authenticateApiKey } = require('../../middlewares/auth');\n";
                echo "\n";
                echo "fastify.post('/api/v1/news/external', {\n";
                echo "  onRequest: [authenticateApiKey],\n";
                echo "  // ... configuración del schema\n";
                echo "}, ctrl.createExternalNews);";
                echo '</div>';

                echo '<h4>Test con cURL:</h4>';
                echo '<div class="code">';
                echo 'curl -X POST http://localhost:3001/api/v1/news/external \' + "\n";
                echo '  -H "Content-Type: application/json" \' + "\n";
                echo '  -H "X-API-Key: EbVOmsJC5rVywOGVLQyvkmUBLhBtVASY" \' + "\n";
                echo '  -d \'{"titulo":"Test","descripcion":"Test","is_oficial":false}\'';
                echo '</div>';
            }

            echo '<div style="margin: 20px 0;">';
            echo '<a href="PARA-TU-DESARROLLADOR.md" class="action-button">📋 Ver Guía para Desarrollador</a>';
            echo '<a href="DIAGNOSTICO-HTTP-401.txt" class="action-button">🔍 Ver Diagnóstico Detallado</a>';
            echo '<button onclick="location.reload()" class="action-button">🔄 Re-ejecutar Diagnóstico</button>';
            echo '</div>';
        }

        // ==========================================
        // LOG DE EJECUCIÓN
        // ==========================================
        echo '<div class="test-section">';
        echo '<h2>📝 LOG DE EJECUCIÓN</h2>';
        echo '<div class="code">';
        echo "Timestamp: " . date('Y-m-d H:i:s') . "\n";
        echo "PHP Version: " . phpversion() . "\n";
        echo "WordPress URL: " . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'N/A') . "\n";
        echo "CdelU URL: $cdelu_url\n";
        echo "API Key: " . substr($api_key, 0, 10) . "...\n";
        echo "Tests ejecutados: " . count($results) . "\n";
        echo "Tests fallidos: " . count(array_filter($results, function($v) { return !$v; })) . "\n";
        echo '</div>';
        echo '</div>';
        ?>

    </div>
</body>
</html>