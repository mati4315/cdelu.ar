<?php
/**
 * Script para restaurar BD + exportar con PHP puro
 * Accede desde: http://localhost/fix-db.php
 */

set_time_limit(600);
ini_set('memory_limit', '1024M');

$sourceBackup = __DIR__ . '/base de datos/trigamer_diario_24 de marzo.sql';
$exportDir = 'D:\\Archivos de programas\\xampp2\\mysql\\copia de seguridad';

echo "<pre style='font-family: monospace; background: #000; color: #0f0; padding: 20px;'>";
echo "═══════════════════════════════════════════════════════\n";
echo "        RESTAURACIÓN Y EXPORTACIÓN DE BD\n";
echo "═══════════════════════════════════════════════════════\n\n";

// Conectar
echo "[1/5] 🔌 Conectando a MySQL...\n";
$db = new mysqli('localhost', 'root', '');
if ($db->connect_error) {
    die("❌ Conexión fallida: " . $db->connect_error);
}
$db->set_charset("utf8mb4");
echo "     ✅ Conectado\n\n";

// Crear/seleccionar BD
echo "[2/5] 📝 Preparando base de datos...\n";
$db->query('CREATE DATABASE IF NOT EXISTS trigamer_diario CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
$db->select_db('trigamer_diario');
echo "     ✅ BD lista\n\n";

// Restaurar
echo "[3/5] 📥 Restaurando datos...\n";

if (!file_exists($sourceBackup)) {
    die("     ❌ No encontrado: $sourceBackup\n");
}

$sql = file_get_contents($sourceBackup);
$size = round(filesize($sourceBackup) / 1024 / 1024, 2);
echo "     Archivo: trigamer_diario_24 de marzo.sql ($size MB)\n";

// Dividir y ejecutar
$statements = preg_split('/;(?=(?:[^\']*\'[^\']*\')*[^\']*$)/', $sql);
$count = 0;
$errors = 0;

foreach ($statements as $stmt) {
    $stmt = trim(str_replace(['/*!40000 ALTER TABLE', '/*!40000 DROP TRIGGER', '/*!50032 DROP TRIGGER'], '', $stmt));
    
    if (strlen($stmt) < 10) continue;
    
    if (!@$db->query($stmt)) {
        $err = $db->error;
        // Ignorar errores esperados
        if (stripos($err, 'Tablespace') === false && 
            stripos($err, 'already exists') === false &&
            stripos($err, 'Duplicate') === false) {
            $errors++;
            if ($errors <= 3) echo "     ⚠️  " . substr($err, 0, 50) . "\n";
        }
    }
    $count++;
}

echo "     ✅ $count sentencias procesadas\n\n";

// Verificar datos
echo "[4/5] 📊 Verificando datos...\n";

$tables = [
    'news' => 'Noticias',
    'users' => 'Usuarios', 
    'comments' => 'Comentarios',
    'likes' => 'Likes',
    'ads' => 'Publicidades'
];

$totalData = 0;
foreach ($tables as $tbl => $label) {
    $r = $db->query("SELECT COUNT(*) as c FROM $tbl");
    if ($r) {
        $row = $r->fetch_assoc();
        $c = $row['c'] ?? 0;
        echo "     ✓ $label: $c\n";
        $totalData += $c;
    }
}

echo "\n     Total de registros: $totalData\n\n";

// Exportar
echo "[5/5] 💾 Generando backup completo...\n";

if (!is_dir($exportDir)) {
    mkdir($exportDir, 0777, true);
}

$timestamp = date('Y-m-d_H-i-s');
$exportFile = $exportDir . '\\trigamer_diario_COMPLETA_' . $timestamp . '.sql';

// Generar SQL completo con PHP
$backup = "-- Base de datos: trigamer_diario\n";
$backup .= "-- Generado: " . date('Y-m-d H:i:s') . "\n";
$backup .= "-- PHP Export\n\n";
$backup .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
$backup .= "START TRANSACTION;\n";
$backup .= "SET time_zone = \"+00:00\";\n\n";

// Obtener todas las tablas
$tables_result = $db->query("SHOW TABLES");
while ($row = $tables_result->fetch_array()) {
    $table = $row[0];
    
    // Estructura de tabla
    $create = $db->query("SHOW CREATE TABLE $table");
    $crRow = $create->fetch_row();
    $backup .= "\nDROP TABLE IF EXISTS `$table`;\n";
    $backup .= $crRow[1] . ";\n\n";
    
    // Datos
    $data = $db->query("SELECT * FROM $table");
    while ($dataRow = $data->fetch_assoc()) {
        $cols = implode("`, `", array_keys($dataRow));
        $vals = array_map(fn($v) => is_null($v) ? 'NULL' : "'" . $db->real_escape_string($v) . "'", array_values($dataRow));
        $backup .= "INSERT INTO `$table` (`$cols`) VALUES (" . implode(", ", $vals) . ");\n";
    }
}

$backup .= "\nCOMMIT;\n";

// Guardar archivo
file_put_contents($exportFile, $backup);

$fileSize = round(filesize($exportFile) / 1024 / 1024, 2);
echo "     ✅ Archivo generado\n\n";

echo "═══════════════════════════════════════════════════════\n";
echo "✨ COMPLETADO EXITOSAMENTE\n\n";
echo "📦 Backup guardado en:\n";
echo "   $exportFile\n\n";
echo "📏 Tamaño: $fileSize MB\n";
echo "📊 Registros totales: $totalData\n\n";
echo "═══════════════════════════════════════════════════════\n";
echo "🗑️  IMPORTANTE: Elimina este archivo después\n";
echo "   (es un riesgo de seguridad)\n";

$db->close();
?>
