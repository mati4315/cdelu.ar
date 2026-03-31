<?php
/**
 * Script para restaurar + exportar BD
 * Accede desde: http://localhost/restore-and-backup.php
 */

set_time_limit(300);
ini_set('memory_limit', '1024M');

$backupSourceFile = __DIR__ . '/base de datos/trigamer_diario_24 de marzo.sql';
$backupDestDir = 'D:\\Archivos de programas\\xampp2\\mysql\\copia de seguridad';

if (!file_exists($backupSourceFile)) {
    die('❌ Error: No se encontró backup: ' . $backupSourceFile);
}

echo "<pre style='font-family: monospace; background: #1e1e1e; color: #0f0; padding: 20px; font-size: 14px;'>";
echo "=== RESTAURACIÓN Y EXPORTACIÓN DE BD ===\n\n";

// Conectar a MySQL
$db = new mysqli('localhost', 'root', '');

if ($db->connect_error) {
    die('❌ Error de conexión: ' . $db->connect_error);
}

// Configurar character set
$db->set_charset("utf8mb4");

echo "🔌 Conectado a MySQL\n";
echo "⏳ Seleccionando BD trigamer_diario...\n";

$db->select_db('trigamer_diario');

// Si hay error, crear BD
if ($db->errno) {
    echo "   (BD no existe, creando...)\n";
    $db->query('CREATE DATABASE IF NOT EXISTS trigamer_diario CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
    $db->select_db('trigamer_diario');
}

echo "✅ BD seleccionada\n\n";

// Leer SQL de respaldo
echo "📂 Leyendo archivo de backup...\n";
$sqlContent = file_get_contents($backupSourceFile);
$fileSize = round(filesize($backupSourceFile) / 1024 / 1024, 2);
echo "   Tamaño: $fileSize MB\n";

// Procesar SQL (dividir por ;)
$statements = array_filter(
    array_map(
        fn($s) => trim(preg_replace('/^--.*$/m', '', $s)),
        preg_split('/;(?=(?:[^\']*\'[^\']*\')*[^\']*$)/', $sqlContent)
    ),
    fn($s) => !empty($s) && strlen($s) > 10
);

echo "✅ Archivo cargado (" . count($statements) . " sentencias)\n\n";

echo "🔄 RESTAURANDO BASE DE DATOS...\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$executed = 0;
$skipped = 0;
$errors = [];

foreach ($statements as $i => $stmt) {
    if (empty(trim($stmt))) continue;
    
    if (!$db->query($stmt)) {
        $error = $db->error;
        
        // Errores esperados
        if (strpos($error, 'already exists') === false &&
            strpos($error, 'Duplicate entry') === false &&
            strpos($error, 'Tablespace') === false) {
            
            $errors[] = [
                'line' => $i,
                'error' => $error,
                'sql' => substr($stmt, 0, 80)
            ];
        }
        $skipped++;
    } else {
        $executed++;
    }
    
    if ($executed % 100 === 0) {
        echo "⏳ Procesadas $executed sentencias...\n";
        flush();
    }
}

echo "\n✅ RESTAURACIÓN COMPLETADA\n";
echo "   • Ejecutadas: $executed sentencias\n";
echo "   • Omitidas: $skipped (esperadas/duplicadas)\n";

// Mostrar errores significativos
if (!empty($errors)) {
    echo "\n⚠️  Errores encontrados:\n";
    foreach (array_slice($errors, 0, 5) as $e) {
        echo "   ❌ " . substr($e['error'], 0, 60) . "...\n";
    }
}

// Verificar datos
echo "\n📊 VERIFICANDO DATOS RESTAURADOS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$tables = $db->query('SHOW TABLES');
$tableCount = $tables->num_rows;
echo "✓ Tablas: $tableCount\n";

$counts = [
    'news' => 'Noticias',
    'users' => 'Usuarios',
    'comments' => 'Comentarios',
    'likes' => 'Likes',
    'ads' => 'Publicidades'
];

$totalRecords = 0;
foreach ($counts as $table => $label) {
    $result = $db->query("SELECT COUNT(*) as total FROM $table");
    if ($result) {
        $row = $result->fetch_assoc();
        $count = $row['total'] ?? 0;
        echo "✓ $label: $count\n";
        $totalRecords += $count;
    }
}

echo "\n";

// Exportar a archivo
echo "💾 EXPORTANDO BACKUP COMPLETO\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

if (!is_dir($backupDestDir)) {
    mkdir($backupDestDir, 0755, true);
}

$timestamp = date('Y-m-d_H-i-s');
$backupFile = $backupDestDir . '\\trigamer_diario_completa_' . $timestamp . '.sql';

// Usar mysqldump via shell
$mysqldump = 'D:\\Archivos de programas\\xampp2\\mysql\\bin\\mysqldump.exe';
$cmd = "\"$mysqldump\" -u root trigamer_diario > \"$backupFile\" 2>&1";

echo "⏳ Ejecutando mysqldump...\n";
exec($cmd, $output, $returnCode);

if ($returnCode === 0 && file_exists($backupFile)) {
    $fileSize = round(filesize($backupFile) / 1024 / 1024, 2);
    echo "✅ Export completado\n\n";
    echo "📦 Archivo creado:\n";
    echo "   " . basename($backupFile) . "\n";
    echo "   Tamaño: $fileSize MB\n";
    echo "   📁 " . $backupDestDir . "\n";
} else {
    echo "⚠️ Error en mysqldump\n";
    foreach ($output as $line) {
        echo "   " . $line . "\n";
    }
}

echo "\n";
echo "✨ PROCESO COMPLETADO\n";
echo "🗑️  Elimina este archivo después: restore-and-backup.php\n";

$db->close();
?>
