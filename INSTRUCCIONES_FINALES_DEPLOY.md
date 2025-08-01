# 🚀 INSTRUCCIONES FINALES PARA DEPLOY AL HOSTING

## ✅ Estado Actual - TODO FUNCIONANDO

Tu aplicación está **completamente funcional** localmente con:
- ✅ Login y registro de usuarios
- ✅ Panel administrativo
- ✅ API endpoints
- ✅ Base de datos configurada
- ✅ Autenticación JWT

## 📁 Archivos Listos para Subir

Los archivos están preparados en la carpeta `deploy/`:

```
deploy/
├── src/                    # Código corregido
├── public/                 # Archivos públicos
├── package.json           # Dependencias
├── passenger_app.js       # Configuración Passenger
├── .htaccess             # Configuración Apache
├── env.production.example # Variables de entorno
├── setup_database.sql    # Script SQL
└── INSTRUCCIONES_DEPLOY.md # Instrucciones detalladas
```

## 🎯 Pasos para Subir al Hosting

### Paso 1: Preparar Archivos
1. **Comprimir carpeta deploy**: Crea un archivo ZIP con todo el contenido de `deploy/`
2. **Subir al hosting**: Sube el ZIP a tu hosting en cPanel
3. **Extraer archivos**: Extrae el ZIP en el directorio de tu dominio

### Paso 2: Configurar Base de Datos
1. **Acceder a phpMyAdmin**: cPanel > Bases de datos MySQL > phpMyAdmin
2. **Crear base de datos**: Crea una base de datos llamada `trigamer_diario`
3. **Crear usuario MySQL**: Crea un usuario con permisos en la base de datos
4. **Ejecutar script SQL**: Ejecuta el contenido de `setup_database.sql`

### Paso 3: Configurar Variables de Entorno
1. **Copiar archivo**: Copia `env.production.example` como `.env`
2. **Editar configuración**:
   ```env
   DB_USER=tu_usuario_mysql
   DB_PASSWORD=tu_contraseña_mysql
   JWT_SECRET=clave_secreta_muy_segura_para_produccion
   ```

### Paso 4: Configurar Aplicación Node.js
1. **Acceder a cPanel**: Setup Node.js App
2. **Configurar aplicación**:
   - **Startup File**: `passenger_app.js`
   - **Node.js Version**: 18.x o superior
   - **Environment Variables**: Copia todas las variables del archivo `.env`

### Paso 5: Instalar Dependencias
En la terminal de cPanel:
```bash
cd /home/tu_usuario/diario.trigamer.xyz
npm install
npm install undici@5.28.4 --save
```

### Paso 6: Reiniciar Aplicación
1. En cPanel > Setup Node.js App
2. Haz clic en **"Restart"** en tu aplicación

## 🔍 Verificación Post-Deploy

### 1. Verificar Sitio Web
- Visita: https://diario.trigamer.xyz
- Debería cargar el panel de login

### 2. Probar Login
- **Email**: `test@test.com`
- **Contraseña**: `123456`
- Debería iniciar sesión exitosamente

### 3. Probar API
```bash
curl -X POST https://diario.trigamer.xyz/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### 4. Verificar Panel Administrativo
- Login con credenciales de administrador
- Debería mostrar el dashboard

## 📋 Credenciales de Prueba

### Usuario Test
- **Email**: `test@test.com`
- **Contraseña**: `123456`
- **Rol**: Usuario

### Administrador
- **Email**: `matias4315@gmail.com`
- **Contraseña**: `w35115415`
- **Rol**: Administrador

## 🔧 Troubleshooting

### Si el sitio no carga:
1. **Verificar logs**: cPanel > Error Logs
2. **Revisar configuración**: Setup Node.js App > Environment Variables
3. **Reiniciar aplicación**: Setup Node.js App > Restart

### Si el login no funciona:
1. **Verificar base de datos**: phpMyAdmin > trigamer_diario > users
2. **Comprobar variables**: DB_USER, DB_PASSWORD en .env
3. **Verificar JWT_SECRET**: Debe ser una clave segura

### Si hay errores 503/500:
1. **Revisar dependencias**: `npm install` en terminal
2. **Verificar Node.js version**: Debe ser 18.x o superior
3. **Comprobar memoria**: Ajustar NODE_OPTIONS si es necesario

## 📞 Soporte Rápido

### Comandos Útiles en Terminal de cPanel:
```bash
# Verificar estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar aplicación
pm2 restart all

# Verificar puertos
netstat -tulpn | grep :3001
```

### Verificar Base de Datos:
```sql
-- Verificar usuarios
SELECT u.id, u.nombre, u.email, r.nombre as role, u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id;

-- Verificar roles
SELECT * FROM roles;
```

## 🎉 Éxito Esperado

Una vez completado el deploy, deberías poder:

✅ **Acceder al sitio**: https://diario.trigamer.xyz
✅ **Iniciar sesión**: Con credenciales de prueba
✅ **Crear usuarios**: Desde el panel administrativo
✅ **Ver noticias**: En el feed principal
✅ **Usar API**: Todos los endpoints funcionando

## 🚀 Próximos Pasos

1. **Subir archivos** al hosting
2. **Configurar base de datos** en phpMyAdmin
3. **Configurar variables** de entorno
4. **Instalar dependencias** y reiniciar
5. **Verificar funcionamiento** con las pruebas

---

## 📞 Contacto

Si encuentras problemas durante el deploy:
1. Revisa los logs de error en cPanel
2. Verifica la configuración de la base de datos
3. Comprueba que todas las variables de entorno estén configuradas
4. Reinicia la aplicación desde cPanel

**¡Tu aplicación está lista para funcionar en producción!** 🎉 

## 🔧 Solución al Error

El error ocurre porque estás intentando usar `viewModels()` sin tener las dependencias correctas configuradas. Aquí está la solución:

### 1. **Agregar las dependencias necesarias en `build.gradle` (app)**

```gradle
dependencies {
    // ViewModel y LiveData
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    implementation 'androidx.activity:activity-ktx:1.8.2'
    implementation 'androidx.fragment:fragment-ktx:1.6.2'
    
    // Retrofit para API calls
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    
    // OkHttp para logging y interceptors
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

### 2. **Crear el LoginViewModel correctamente**

Crea el archivo `LoginViewModel.kt`:

```kotlin
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {
    private val repository = FeedRepository()
    
    private val _loginState = MutableLiveData<LoginState>()
    val loginState: LiveData<LoginState> = _loginState
    
    fun login(email: String, password: String) {
        _loginState.value = LoginState.Loading
        
        viewModelScope.launch {
            try {
                val result = repository.login(email, password)
                result.fold(
                    onSuccess = { response ->
                        _loginState.value = LoginState.Success(response.token, response.user)
                    },
                    onFailure = { error ->
                        _loginState.value = LoginState.Error(error.message ?: "Error de login")
                    }
                )
            } catch (e: Exception) {
                _loginState.value = LoginState.Error(e.message ?: "Error desconocido")
            }
        }
    }
}

sealed class LoginState {
    object Loading : LoginState()
    data class Success(val token: String, val user: UserData) : LoginState()
    data class Error(val message: String) : LoginState()
}
```

### 3. **Corregir LoginActivity**

Actualiza tu `LoginActivity.kt`:

```kotlin
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private val loginViewModel: LoginViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Verificar si ya hay un token guardado
        checkSavedToken()
        
        setupViews()
        observeViewModel()
    }
    
    private fun checkSavedToken() {
        val prefs = getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
        val token = prefs.getString("auth_token", null)
        
        if (token != null) {
            // Si hay token, ir directamente a MainActivity
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
    }
    
    private fun setupViews() {
        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString()
            val password = binding.etPassword.text.toString()
            
            if (email.isNotEmpty() && password.isNotEmpty()) {
                loginViewModel.login(email, password)
            } else {
                showError("Por favor completa todos los campos")
            }
        }
    }
    
    private fun observeViewModel() {
        loginViewModel.loginState.observe(this) { state ->
            when (state) {
                is LoginState.Loading -> showLoading()
                is LoginState.Success -> {
                    hideLoading()
                    saveAuthToken(state.token)
                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                }
                is LoginState.Error -> {
                    hideLoading()
                    showError(state.message)
                }
            }
        }
    }
    
    private fun saveAuthToken(token: String) {
        val prefs = getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("auth_token", token).apply()
    }
    
    private fun showLoading() {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false
    }
    
    private fun hideLoading() {
        binding.progressBar.visibility = View.GONE
        binding.btnLogin.isEnabled = true
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
```

### 4. **Verificar que tienes el layout correcto**

Asegúrate de que tu `activity_login.xml` tenga los IDs correctos:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="32dp"
    android:gravity="center">

    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="16dp">

        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/et_email"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:hint="Email"
            android:inputType="textEmailAddress" />

    </com.google.android.material.textfield.TextInputLayout>

    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="24dp">

        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/et_password"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:hint="Contraseña"
            android:inputType="textPassword" />

    </com.google.android.material.textfield.TextInputLayout>

    <com.google.android.material.button.MaterialButton
        android:id="@+id/btn_login"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Iniciar Sesión"
        android:textSize="16sp" />

    <ProgressBar
        android:id="@+id/progress_bar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:visibility="gone" />

</LinearLayout>
```

### 5. **Verificar el AndroidManifest.xml**

Asegúrate de que tu `AndroidManifest.xml` tenga la configuración correcta:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="android.cdeluar">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.DarkActionBar">
        
        <activity
            android:name=".LoginActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <activity android:name=".MainActivity" />
        
    </application>
</manifest>
```

## 🔍 Pasos para Verificar

1. **Sincroniza el proyecto**: File > Sync Project with Gradle Files
2. **Limpia el proyecto**: Build > Clean Project
3. **Reconstruye**: Build > Rebuild Project
4. **Ejecuta la aplicación**

El error debería resolverse una vez que tengas todas las dependencias correctas y el ViewModel inicializado adecuadamente. 