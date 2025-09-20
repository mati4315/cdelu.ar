# 📱 Guía de Integración Android - API CdelU

> **Versión 1.0** - Guía completa para conectar tu app Android a la API de CdelU

## 🎯 Objetivo

Esta guía te permitirá crear una app Android que se conecte correctamente a la API de CdelU, siguiendo un enfoque paso a paso con verificaciones en cada etapa.

---

## 📋 Checklist de Preparación

Antes de comenzar, verifica que tengas:

- [ ] **Android Studio** instalado y actualizado
- [ ] **Kotlin** configurado en tu proyecto
- [ ] **Retrofit** y **OkHttp** como dependencias
- [ ] **Gson** para serialización JSON
- [ ] **Coroutines** para operaciones asíncronas

---

## 🔧 Paso 1: Configuración de Dependencias

### 1.1 Agregar dependencias en `build.gradle` (app)

```gradle
dependencies {
    // Retrofit para API calls
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    
    // OkHttp para logging y interceptors
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    
    // ViewModel y LiveData
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
}
```

### 1.2 Verificar configuración

✅ **Checkpoint 1**: Ejecuta `Sync Now` en Android Studio y verifica que no hay errores de compilación.

---

## 🌐 Paso 2: Configuración de la API Base

### 2.1 Crear archivo de configuración

Crea `ApiConfig.kt`:

```kotlin
object ApiConfig {
    // URLs de la API
    const val BASE_URL = "https://diario.trigamer.xyz"
    const val API_BASE_URL = "$BASE_URL/api/v1"
    
    // Endpoints principales
    const val AUTH_LOGIN = "/auth/login"
    const val AUTH_REGISTER = "/auth/register"
    const val NEWS_ENDPOINT = "/news"
    const val FEED_ENDPOINT = "/feed"
    const val USERS_ENDPOINT = "/users"
    
    // Timeouts
    const val CONNECT_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    
    // Headers
    const val CONTENT_TYPE = "application/json"
    const val AUTHORIZATION_HEADER = "Authorization"
    const val BEARER_PREFIX = "Bearer "
}
```

### 2.2 Verificar conectividad básica

✅ **Checkpoint 2**: Ejecuta este test para verificar que puedes conectarte:

```kotlin
// Test básico de conectividad
fun testConnection() {
    val client = OkHttpClient.Builder()
        .connectTimeout(ApiConfig.CONNECT_TIMEOUT, TimeUnit.SECONDS)
        .readTimeout(ApiConfig.READ_TIMEOUT, TimeUnit.SECONDS)
        .build()
    
    val request = Request.Builder()
        .url("${ApiConfig.BASE_URL}/health")
        .build()
    
    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            Log.e("API_TEST", "Error de conexión: ${e.message}")
        }
        
        override fun onResponse(call: Call, response: Response) {
            Log.d("API_TEST", "Respuesta: ${response.code}")
        }
    })
}
```

---

## 🔐 Paso 3: Configuración de Autenticación JWT

### 3.1 Crear modelos de datos

Crea `AuthModels.kt`:

```kotlin
// Modelos para autenticación
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val nombre: String,
    val email: String,
    val password: String,
    val role: String = "usuario"
)

data class AuthResponse(
    val token: String,
    val user: UserData
)

data class UserData(
    val id: Int,
    val nombre: String,
    val email: String,
    val role: String
)

data class ApiError(
    val message: String,
    val code: String? = null
)
```

### 3.2 Crear interceptor para JWT

Crea `AuthInterceptor.kt`:

```kotlin
class AuthInterceptor : Interceptor {
    private var authToken: String? = null
    
    fun setAuthToken(token: String) {
        authToken = token
    }
    
    fun clearAuthToken() {
        authToken = null
    }
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        val newRequest = if (authToken != null) {
            originalRequest.newBuilder()
                .header(ApiConfig.AUTHORIZATION_HEADER, "${ApiConfig.BEARER_PREFIX}$authToken")
                .build()
        } else {
            originalRequest
        }
        
        return chain.proceed(newRequest)
    }
}
```

### 3.3 Verificar autenticación

✅ **Checkpoint 3**: Test de login básico:

```kotlin
fun testLogin() {
    val loginRequest = LoginRequest(
        email = "test@test.com",
        password = "123456"
    )
    
    // Aquí irá tu llamada a la API
    // Deberías recibir un token JWT válido
}
```

---

## 📰 Paso 4: Configuración del Feed de Noticias

### 4.1 Crear modelos para el feed

Crea `FeedModels.kt`:

```kotlin
// Tipos de contenido
enum class FeedType(val value: Int) {
    NEWS(1),
    COMMUNITY(2)
}

enum class FeedTab {
    TODO,
    NOTICIAS,
    COMUNIDAD
}

// Modelo principal del feed
data class FeedItem(
    val id: Int,
    val titulo: String,
    val descripcion: String,
    val resumen: String?,
    val image_url: String?,
    val type: Int,
    val original_id: Int,
    val user_id: Int?,
    val user_name: String?,
    val published_at: String?,
    val created_at: String,
    val updated_at: String,
    val original_url: String?,
    val is_oficial: Boolean?,
    val video_url: String?,
    val likes_count: Int,
    val comments_count: Int
)

// Respuesta paginada
data class FeedResponse(
    val data: List<FeedItem>,
    val pagination: FeedPagination
)

data class FeedPagination(
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrev: Boolean
)
```

### 4.2 Crear parámetros de consulta

```kotlin
data class FeedParams(
    val page: Int = 1,
    val limit: Int = 10,
    val type: Int? = null,
    val sort: String = "published_at",
    val order: String = "desc"
)
```

### 4.3 Verificar obtención de feed

✅ **Checkpoint 4**: Test de obtención de feed:

```kotlin
fun testFeedRetrieval() {
    // Deberías poder obtener el feed sin autenticación
    // GET /api/v1/feed
    // Respuesta esperada: FeedResponse con lista de FeedItem
}
```

---

## 🔌 Paso 5: Configuración de Retrofit

### 5.1 Crear interfaces de API

Crea `ApiService.kt`:

```kotlin
interface ApiService {
    // Autenticación
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse
    
    // Feed
    @GET("feed")
    suspend fun getFeed(@QueryMap params: Map<String, String>): FeedResponse
    
    @GET("feed/noticias")
    suspend fun getNews(@QueryMap params: Map<String, String>): FeedResponse
    
    @GET("feed/comunidad")
    suspend fun getCommunity(@QueryMap params: Map<String, String>): FeedResponse
    
    // Noticias individuales
    @GET("news/{id}")
    suspend fun getNewsById(@Path("id") id: Int): FeedItem
    
    // Usuario
    @GET("users/profile")
    suspend fun getUserProfile(): UserData
}
```

### 5.2 Configurar cliente Retrofit

Crea `RetrofitClient.kt`:

```kotlin
object RetrofitClient {
    private val authInterceptor = AuthInterceptor()
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(ApiConfig.CONNECT_TIMEOUT, TimeUnit.SECONDS)
        .readTimeout(ApiConfig.READ_TIMEOUT, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(ApiConfig.API_BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val apiService: ApiService = retrofit.create(ApiService::class.java)
    
    fun setAuthToken(token: String) {
        authInterceptor.setAuthToken(token)
    }
    
    fun clearAuthToken() {
        authInterceptor.clearAuthToken()
    }
}
```

### 5.3 Verificar configuración de Retrofit

✅ **Checkpoint 5**: Test de llamada básica:

```kotlin
fun testRetrofitConnection() {
    CoroutineScope(Dispatchers.IO).launch {
        try {
            val response = RetrofitClient.apiService.getFeed(mapOf(
                "page" to "1",
                "limit" to "5"
            ))
            Log.d("RETROFIT_TEST", "Feed obtenido: ${response.data.size} items")
        } catch (e: Exception) {
            Log.e("RETROFIT_TEST", "Error: ${e.message}")
        }
    }
}
```

---

## 🏗️ Paso 6: Configuración de Repository

### 6.1 Crear Repository

Crea `FeedRepository.kt`:

```kotlin
class FeedRepository {
    private val apiService = RetrofitClient.apiService
    
    suspend fun getFeed(params: FeedParams): Result<FeedResponse> {
        return try {
            val queryParams = mutableMapOf<String, String>()
            queryParams["page"] = params.page.toString()
            queryParams["limit"] = params.limit.toString()
            queryParams["sort"] = params.sort
            queryParams["order"] = params.order
            
            params.type?.let { queryParams["type"] = it.toString() }
            
            val response = apiService.getFeed(queryParams)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val request = LoginRequest(email, password)
            val response = apiService.login(request)
            RetrofitClient.setAuthToken(response.token)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getNews(params: FeedParams): Result<FeedResponse> {
        return try {
            val queryParams = mutableMapOf<String, String>()
            queryParams["page"] = params.page.toString()
            queryParams["limit"] = params.limit.toString()
            queryParams["sort"] = params.sort
            queryParams["order"] = params.order
            
            val response = apiService.getNews(queryParams)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getCommunity(params: FeedParams): Result<FeedResponse> {
        return try {
            val queryParams = mutableMapOf<String, String>()
            queryParams["page"] = params.page.toString()
            queryParams["limit"] = params.limit.toString()
            queryParams["sort"] = params.sort
            queryParams["order"] = params.order
            
            val response = apiService.getCommunity(queryParams)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 6.2 Verificar Repository

✅ **Checkpoint 6**: Test del repository:

```kotlin
fun testRepository() {
    val repository = FeedRepository()
    
    CoroutineScope(Dispatchers.IO).launch {
        val result = repository.getFeed(FeedParams(page = 1, limit = 5))
        result.fold(
            onSuccess = { response ->
                Log.d("REPO_TEST", "Éxito: ${response.data.size} items")
            },
            onFailure = { error ->
                Log.e("REPO_TEST", "Error: ${error.message}")
            }
        )
    }
}
```

---

## 📱 Paso 7: Configuración de ViewModel

### 7.1 Crear FeedViewModel

Crea `FeedViewModel.kt`:

```kotlin
class FeedViewModel : ViewModel() {
    private val repository = FeedRepository()
    
    private val _feedState = MutableLiveData<FeedState>()
    val feedState: LiveData<FeedState> = _feedState
    
    private val _currentTab = MutableLiveData<FeedTab>(FeedTab.TODO)
    val currentTab: LiveData<FeedTab> = _currentTab
    
    private var currentPage = 1
    private var isLoading = false
    
    init {
        loadFeed()
    }
    
    fun loadFeed(refresh: Boolean = false) {
        if (isLoading) return
        
        if (refresh) {
            currentPage = 1
        }
        
        isLoading = true
        _feedState.value = FeedState.Loading
        
        viewModelScope.launch {
            val params = FeedParams(
                page = currentPage,
                limit = 10,
                sort = "published_at",
                order = "desc"
            )
            
            val result = when (_currentTab.value) {
                FeedTab.TODO -> repository.getFeed(params)
                FeedTab.NOTICIAS -> repository.getNews(params)
                FeedTab.COMUNIDAD -> repository.getCommunity(params)
                else -> repository.getFeed(params)
            }
            
            result.fold(
                onSuccess = { response ->
                    val newState = if (refresh) {
                        FeedState.Success(response.data)
                    } else {
                        val currentData = _feedState.value?.data ?: emptyList()
                        FeedState.Success(currentData + response.data)
                    }
                    _feedState.value = newState
                    currentPage++
                },
                onFailure = { error ->
                    _feedState.value = FeedState.Error(error.message ?: "Error desconocido")
                }
            )
            
            isLoading = false
        }
    }
    
    fun switchTab(tab: FeedTab) {
        _currentTab.value = tab
        currentPage = 1
        loadFeed(refresh = true)
    }
    
    fun refreshFeed() {
        loadFeed(refresh = true)
    }
}

sealed class FeedState {
    object Loading : FeedState()
    data class Success(val data: List<FeedItem>) : FeedState()
    data class Error(val message: String) : FeedState()
}
```

### 7.2 Verificar ViewModel

✅ **Checkpoint 7**: Test del ViewModel:

```kotlin
fun testViewModel() {
    val viewModel = FeedViewModel()
    
    viewModel.feedState.observe(lifecycleOwner) { state ->
        when (state) {
            is FeedState.Loading -> Log.d("VM_TEST", "Cargando...")
            is FeedState.Success -> Log.d("VM_TEST", "Éxito: ${state.data.size} items")
            is FeedState.Error -> Log.e("VM_TEST", "Error: ${state.message}")
        }
    }
}
```

---

## 🎨 Paso 8: Configuración de UI Básica

### 8.1 Crear RecyclerView Adapter

Crea `FeedAdapter.kt`:

```kotlin
class FeedAdapter : RecyclerView.Adapter<FeedAdapter.FeedViewHolder>() {
    
    private var items = listOf<FeedItem>()
    
    fun updateItems(newItems: List<FeedItem>) {
        items = newItems
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FeedViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_feed, parent, false)
        return FeedViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: FeedViewHolder, position: Int) {
        holder.bind(items[position])
    }
    
    override fun getItemCount() = items.size
    
    class FeedViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val titleTextView: TextView = itemView.findViewById(R.id.tv_title)
        private val descriptionTextView: TextView = itemView.findViewById(R.id.tv_description)
        private val userTextView: TextView = itemView.findViewById(R.id.tv_user)
        private val dateTextView: TextView = itemView.findViewById(R.id.tv_date)
        private val imageView: ImageView = itemView.findViewById(R.id.iv_image)
        
        fun bind(item: FeedItem) {
            titleTextView.text = item.titulo
            descriptionTextView.text = item.descripcion
            userTextView.text = item.user_name ?: "Usuario"
            dateTextView.text = formatDate(item.created_at)
            
            // Cargar imagen con Glide o Picasso
            item.image_url?.let { url ->
                Glide.with(itemView.context)
                    .load(url)
                    .placeholder(R.drawable.placeholder_image)
                    .into(imageView)
            }
        }
        
        private fun formatDate(dateString: String): String {
            // Implementar formateo de fecha
            return dateString
        }
    }
}
```

### 8.2 Layout para item del feed

Crea `item_feed.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.cardview.widget.CardView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_margin="8dp"
    app:cardCornerRadius="8dp"
    app:cardElevation="4dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <ImageView
            android:id="@+id/iv_image"
            android:layout_width="match_parent"
            android:layout_height="200dp"
            android:scaleType="centerCrop"
            android:src="@drawable/placeholder_image" />

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="16dp">

            <TextView
                android:id="@+id/tv_title"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:textSize="18sp"
                android:textStyle="bold"
                android:textColor="@android:color/black" />

            <TextView
                android:id="@+id/tv_description"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="8dp"
                android:textSize="14sp"
                android:maxLines="3"
                android:ellipsize="end" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="8dp"
                android:orientation="horizontal">

                <TextView
                    android:id="@+id/tv_user"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:textSize="12sp"
                    android:textColor="@android:color/darker_gray" />

                <TextView
                    android:id="@+id/tv_date"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:textSize="12sp"
                    android:textColor="@android:color/darker_gray" />

            </LinearLayout>

        </LinearLayout>

    </LinearLayout>

</androidx.cardview.widget.CardView>
```

### 8.3 Verificar UI básica

✅ **Checkpoint 8**: Test de la UI:

```kotlin
fun testUI() {
    // Configurar RecyclerView
    val recyclerView = findViewById<RecyclerView>(R.id.recycler_view)
    val adapter = FeedAdapter()
    recyclerView.adapter = adapter
    recyclerView.layoutManager = LinearLayoutManager(this)
    
    // Observar ViewModel
    viewModel.feedState.observe(this) { state ->
        when (state) {
            is FeedState.Success -> adapter.updateItems(state.data)
            is FeedState.Error -> showError(state.message)
            is FeedState.Loading -> showLoading()
        }
    }
}
```

---

## 🔧 Paso 9: Configuración de Autenticación en UI

### 9.1 Crear LoginActivity

Crea `LoginActivity.kt`:

```kotlin
class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private val viewModel: LoginViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupViews()
        observeViewModel()
    }
    
    private fun setupViews() {
        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString()
            val password = binding.etPassword.text.toString()
            
            if (email.isNotEmpty() && password.isNotEmpty()) {
                viewModel.login(email, password)
            } else {
                showError("Por favor completa todos los campos")
            }
        }
    }
    
    private fun observeViewModel() {
        viewModel.loginState.observe(this) { state ->
            when (state) {
                is LoginState.Loading -> showLoading()
                is LoginState.Success -> {
                    hideLoading()
                    // Guardar token en SharedPreferences
                    saveAuthToken(state.token)
                    // Navegar a MainActivity
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

### 9.2 Layout para login

Crea `activity_login.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="32dp"
    android:gravity="center">

    <ImageView
        android:layout_width="120dp"
        android:layout_height="120dp"
        android:src="@drawable/logo"
        android:layout_marginBottom="32dp" />

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

### 9.3 Verificar autenticación

✅ **Checkpoint 9**: Test de login:

```kotlin
fun testLoginFlow() {
    // 1. Verificar que LoginActivity se abre correctamente
    // 2. Ingresar credenciales válidas
    // 3. Verificar que se obtiene token JWT
    // 4. Verificar que se navega a MainActivity
    // 5. Verificar que el token se guarda en SharedPreferences
}
```

---

## 🎯 Paso 10: Configuración Final y Testing

### 10.1 Crear MainActivity con navegación

Crea `MainActivity.kt`:

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val feedViewModel: FeedViewModel by viewModels()
    private lateinit var feedAdapter: FeedAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupViews()
        setupNavigation()
        observeViewModel()
    }
    
    private fun setupViews() {
        feedAdapter = FeedAdapter()
        binding.recyclerView.apply {
            adapter = feedAdapter
            layoutManager = LinearLayoutManager(this@MainActivity)
        }
        
        binding.swipeRefresh.setOnRefreshListener {
            feedViewModel.refreshFeed()
        }
    }
    
    private fun setupNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    feedViewModel.switchTab(FeedTab.TODO)
                    true
                }
                R.id.nav_news -> {
                    feedViewModel.switchTab(FeedTab.NOTICIAS)
                    true
                }
                R.id.nav_community -> {
                    feedViewModel.switchTab(FeedTab.COMUNIDAD)
                    true
                }
                R.id.nav_profile -> {
                    // Navegar a perfil
                    true
                }
                else -> false
            }
        }
    }
    
    private fun observeViewModel() {
        feedViewModel.feedState.observe(this) { state ->
            binding.swipeRefresh.isRefreshing = false
            
            when (state) {
                is FeedState.Loading -> {
                    // Mostrar loading
                }
                is FeedState.Success -> {
                    feedAdapter.updateItems(state.data)
                }
                is FeedState.Error -> {
                    showError(state.message)
                }
            }
        }
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
```

### 10.2 Layout principal

Crea `activity_main.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipe_refresh"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toTopOf="@id/bottom_navigation"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <androidx.recyclerview.widget.RecyclerView
            android:id="@+id/recycler_view"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:clipToPadding="false"
            android:paddingBottom="8dp" />

    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

    <com.google.android.material.bottomnavigation.BottomNavigationView
        android:id="@+id/bottom_navigation"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:menu="@menu/bottom_nav_menu" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

### 10.3 Verificación final

✅ **Checkpoint 10**: Test completo de la app:

```kotlin
fun testCompleteApp() {
    // 1. Verificar que la app inicia correctamente
    // 2. Verificar que se muestra el feed
    // 3. Verificar que funciona el pull-to-refresh
    // 4. Verificar que funcionan las pestañas de navegación
    // 5. Verificar que se cargan las imágenes
    // 6. Verificar que funciona el infinite scroll
    // 7. Verificar que funciona la autenticación
    // 8. Verificar que se manejan los errores correctamente
}
```

---

## 🔍 Troubleshooting

### Problemas Comunes y Soluciones

#### ❌ Error de conexión
```kotlin
// Verificar URL base
const val BASE_URL = "https://diario.trigamer.xyz"
// Verificar que el endpoint /health responde
```

#### ❌ Error de autenticación
```kotlin
// Verificar que el token se envía correctamente
// Verificar formato: "Bearer TOKEN"
// Verificar que el token no ha expirado
```

#### ❌ Error de parsing JSON
```kotlin
// Verificar que los modelos coinciden con la API
// Verificar que Gson está configurado correctamente
```

#### ❌ Error de imágenes
```kotlin
// Verificar que las URLs de imágenes son válidas
// Verificar permisos de internet en AndroidManifest.xml
```

---

## 📋 Checklist Final

- [ ] ✅ Dependencias configuradas correctamente
- [ ] ✅ Conexión básica a la API funciona
- [ ] ✅ Autenticación JWT funciona
- [ ] ✅ Feed se carga correctamente
- [ ] ✅ UI muestra los datos
- [ ] ✅ Navegación entre pestañas funciona
- [ ] ✅ Pull-to-refresh funciona
- [ ] ✅ Infinite scroll funciona
- [ ] ✅ Manejo de errores funciona
- [ ] ✅ App funciona en diferentes tamaños de pantalla

---

## 🚀 Próximos Pasos

1. **Implementar detalle de noticias**: Crear pantalla para ver noticia completa
2. **Implementar comentarios**: Agregar funcionalidad de comentarios
3. **Implementar likes**: Agregar funcionalidad de likes
4. **Implementar búsqueda**: Agregar funcionalidad de búsqueda
5. **Implementar notificaciones**: Agregar sistema de notificaciones
6. **Optimizar rendimiento**: Implementar caching y optimizaciones
7. **Testing**: Agregar tests unitarios y de UI

---

## 📞 Soporte

Si encuentras problemas durante la implementación:

1. **Revisar logs**: Usar Logcat para ver errores detallados
2. **Verificar API**: Usar Postman para testear endpoints
3. **Revisar documentación**: Consultar la documentación de la API
4. **Contactar equipo**: Reportar problemas específicos

---

> **¡Felicidades!** 🎉 Si has completado todos los checkpoints, tu app Android está correctamente conectada a la API de CdelU y lista para ser expandida con nuevas funcionalidades. 

## 🎯 **Resumen de Configuraciones para Apps Móviles**

He implementado todas las configuraciones necesarias para que tu backend soporte apps móviles:

### ✅ **Configuraciones Realizadas:**

1. **CORS Mejorado**: Permitir todos los orígenes (`*`) para apps móviles
2. **Headers Específicos**: Agregados headers para apps móviles
3. **Endpoints Móviles**: Creados endpoints optimizados para Android/iOS
4. **Configuración Móvil**: Endpoint que devuelve configuración específica
5. **Health Check Móvil**: Endpoint optimizado para verificar conectividad
6. **Feed Móvil**: Endpoint optimizado con datos específicos para móviles
7. **Login Móvil**: Endpoint de autenticación optimizado
8. **Script de Testing**: Para verificar que todo funciona correctamente

###  **Para Activar los Cambios:**

1. **Reiniciar el servidor**:
```bash
npm run start
```

2. **Verificar que funciona**:
```bash
<code_block_to_apply_changes_from>
```

3. **Verificar en producción** (si tienes acceso):
```bash
curl https://diario.trigamer.xyz/api/v1/mobile/config
```

###  **Endpoints Disponibles para Apps Móviles:**

- `GET /api/v1/mobile/config` - Configuración de la app
- `GET /api/v1/mobile/health` - Health check optimizado
- `GET /api/v1/mobile/feed` - Feed optimizado para móviles
- `POST /api/v1/mobile/login` - Login optimizado

### 🎯 **Beneficios para el Frontend Android:**

- ✅ **CORS configurado** para permitir conexiones desde apps móviles
- ✅ **Headers optimizados** para mejor rendimiento
- ✅ **Endpoints específicos** con datos optimizados
- ✅ **Autenticación mejorada** con respuestas específicas para móviles
- ✅ **Configuración automática** que la app puede obtener al iniciar

¡Tu backend ya está completamente preparado para recibir conexiones desde apps Android! El equipo de frontend puede usar la guía que creamos y estos endpoints específicos para una integración perfecta. 