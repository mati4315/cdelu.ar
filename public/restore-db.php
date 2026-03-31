<?php
/**
 * Script de restauración vía web
 * Accede desde: http://localhost/restore-db.php
 * 
 * ⚠️  ELIMINA ESTE ARCHIVO DESPUÉS DE USARLO (es un riesgo de seguridad)
 */

set_time_limit(0);
ini_set('memory_limit', '512M');

$backupFile = __DIR__ . '/base de datos/trigamer_diario_24 de marzo.sql';

if (!file_exists($backupFile)) {
    die('❌ Error: No se encontró el archivo de backup en: ' . $backupFile);
}

// Conexión a MySQL
$db = new mysqli('localhost', 'root', '', null, 3306);

if ($db->connect_error) {
    die('❌ Error de conexión a MySQL: ' . $db->connect_error);
}

echo "<pre style='font-family: monospace; background: #1e1e1e; color: #0f0; padding: 20px;'>";
echo "🔄 Restaurando base de datos...\n\n";

// Crear BD si no existe
$db->query('CREATE DATABASE IF NOT EXISTS trigamer_diario');
$db->select_db('trigamer_diario');

// Leer archivo SQL
$sqlContent = file_get_contents($backupFile);

// Dividir en sentencias (simple pero funciona para la mayoría)
$statements = array_filter(
    array_map(
        fn($s) => trim(preg_replace('/^--.*$/m', '', $s)),
        preg_split('/;(?=(?:[^\']*\'[^\']*\')*[^\']*$)/', $sqlContent)
    ),
    fn($s) => !empty($s)
);

$executed = 0;
$errors = [];

foreach ($statements as $stmt) {
    if (empty(trim($stmt))) continue;
    
    if (!$db->query($stmt)) {
        // Algunos errores son esperados
        if (strpos($db->error, 'already exists') === false &&
            strpos($db->error, 'Duplicate entry') === false) {
            $errors[] = $db->error;
        }
    }
    $executed++;
    
    if ($executed % 50 === 0) {
        echo "⏳ Procesadas $executed sentencias...\n";
    }
}

echo "\n✅ Restauración completada\n";
echo "   • Sentencias ejecutadas: $executed\n";

// Verificar resultado
$tables = $db->query('SHOW TABLES');
$tableCount = $tables->num_rows;

$news = $db->query('SELECT COUNT(*) as total FROM news');
$newsCount = $news->fetch_assoc()['total'];

$users = $db->query('SELECT COUNT(*) as total FROM users');
$usersCount = $users->fetch_assoc()['total'];

echo "\n📊 Resultado:\n";
echo "   • Tablas: $tableCount\n";
echo "   • Noticias: $newsCount\n";
echo "   • Usuarios: $usersCount\n";

if (!empty($errors)) {
    echo "\n⚠️  Errores encontrados:\n";
    foreach (array_unique($errors) as $error) {
        echo "   • $error\n";
    }
}

echo "\n✨ ¡Base de datos restaurada exitosamente!\n\n";
echo "🗑️  IMPORTANTE: Elimina este archivo después de usarlo\n";
echo "   Accede a: http://localhost/phpmyadmin\n";
echo "   Y verifica que trigamer_diario tenga datos.\n";

$db->close();
?>
