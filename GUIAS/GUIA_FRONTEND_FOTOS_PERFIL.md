# 📸 GUÍA FRONTEND - FOTOS DE PERFIL

## 🎯 Objetivo
Implementar la funcionalidad completa de fotos de perfil en el frontend, permitiendo a los usuarios subir, ver, actualizar y eliminar sus fotos de perfil.

## 🚀 API Endpoints Disponibles

### **1. Subir/Actualizar Foto de Perfil**
```http
POST /api/v1/profile/picture
```

**Headers requeridos:**
```javascript
{
  "Authorization": "Bearer " + token,
  "Content-Type": "multipart/form-data" // Se establece automáticamente con FormData
}
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('profile_picture', fileInput.files[0]);
```

**Respuesta exitosa (200):**
```json
{
  "message": "Foto de perfil actualizada correctamente",
  "profile_picture_url": "/uploads/profile-pictures/profile-1642345678901-123456789.jpg"
}
```

**Errores comunes:**
```json
// Sin autenticación (401)
{
  "error": "Token de acceso requerido",
  "details": "Debe proporcionar un token JWT válido en el header Authorization"
}

// Archivo no válido (400)
{
  "error": "Tipo de archivo no permitido",
  "details": "Solo se permiten los siguientes tipos: image/jpeg, image/jpg, image/png, image/webp",
  "received": "image/gif"
}

// Archivo muy grande (400)
{
  "error": "El archivo es demasiado grande. Máximo permitido: 5MB"
}

// Rate limit excedido (429)
{
  "error": "Demasiados intentos de subida",
  "details": "Máximo 5 subidas de fotos por minuto. Intente nuevamente más tarde."
}
```

### **2. Eliminar Foto de Perfil**
```http
DELETE /api/v1/profile/picture
```

**Headers:**
```javascript
{
  "Authorization": "Bearer " + token
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Foto de perfil eliminada correctamente"
}
```

### **3. Obtener Mi Perfil Completo**
```http
GET /api/v1/profile/me
```

**Headers:**
```javascript
{
  "Authorization": "Bearer " + token
}
```

**Respuesta exitosa (200):**
```json
{
  "user": {
    "id": 123,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "usuario",
    "profile_picture_url": "/uploads/profile-pictures/profile-1642345678901-123456789.jpg",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T15:45:00.000Z"
  }
}
```

### **4. Obtener Perfil Público de Usuario**
```http
GET /api/v1/profile/{userId}
```

**Sin autenticación requerida**

**Respuesta exitosa (200):**
```json
{
  "user": {
    "id": 123,
    "nombre": "Juan Pérez",
    "rol": "usuario",
    "profile_picture_url": "/uploads/profile-pictures/profile-1642345678901-123456789.jpg",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

## 💡 Especificaciones Técnicas

### **Validaciones del Lado del Cliente**
```javascript
// Tipos de archivo permitidos
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Tamaño máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateImageFile(file) {
  // Verificar tipo
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Solo JPG, PNG y WebP.'
    };
  }

  // Verificar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande. Máximo 5MB.'
    };
  }

  return { valid: true };
}
```

### **URLs de Imágenes**
- **Formato:** `/uploads/profile-pictures/profile-{timestamp}-{random}.jpg`
- **Ejemplo:** `/uploads/profile-pictures/profile-1642345678901-123456789.jpg`
- **Base URL:** Concatenar con la URL base de tu API
- **Imagen por defecto:** Cuando `profile_picture_url` es `null`, usar un avatar por defecto

## 🛠️ Ejemplos de Implementación

### **1. Componente de Subida de Foto**

#### **HTML**
```html
<div class="profile-picture-upload">
  <!-- Mostrar foto actual o placeholder -->
  <div class="profile-picture-container">
    <img 
      id="profileImage" 
      src="/default-avatar.png" 
      alt="Foto de perfil"
      class="profile-picture"
    />
    <div class="profile-picture-overlay">
      <button type="button" onclick="openFileSelector()">
        📷 Cambiar foto
      </button>
      <button 
        type="button" 
        onclick="removeProfilePicture()" 
        id="removePhotoBtn"
        style="display: none;"
      >
        🗑️ Eliminar
      </button>
    </div>
  </div>

  <!-- Input oculto para seleccionar archivo -->
  <input 
    type="file" 
    id="profilePictureInput" 
    accept="image/*"
    style="display: none;"
    onchange="handleFileSelection(event)"
  />

  <!-- Indicador de carga -->
  <div id="uploadProgress" style="display: none;">
    <div class="spinner"></div>
    <span>Subiendo foto...</span>
  </div>

  <!-- Mensajes de estado -->
  <div id="uploadMessage" class="message"></div>
</div>
```

#### **JavaScript Completo**
```javascript
class ProfilePictureManager {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
    this.currentProfileUrl = null;
  }

  // Cargar perfil del usuario
  async loadUserProfile() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/profile/me`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        this.updateProfileDisplay(result.user);
        return result.user;
      } else {
        const error = await response.json();
        this.showMessage(error.error || 'Error al cargar perfil', 'error');
      }
    } catch (error) {
      this.showMessage('Error de conexión', 'error');
      console.error('Error:', error);
    }
  }

  // Actualizar la visualización del perfil
  updateProfileDisplay(user) {
    const profileImg = document.getElementById('profileImage');
    const removeBtn = document.getElementById('removePhotoBtn');

    // Actualizar imagen
    if (user.profile_picture_url) {
      profileImg.src = user.profile_picture_url;
      this.currentProfileUrl = user.profile_picture_url;
      removeBtn.style.display = 'inline-block';
    } else {
      profileImg.src = '/default-avatar.png';
      this.currentProfileUrl = null;
      removeBtn.style.display = 'none';
    }

    // Actualizar otros datos del usuario si es necesario
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    
    if (userName) userName.textContent = user.nombre;
    if (userEmail) userEmail.textContent = user.email;
  }

  // Abrir selector de archivos
  openFileSelector() {
    document.getElementById('profilePictureInput').click();
  }

  // Manejar selección de archivo
  async handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar archivo
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      this.showMessage(validation.error, 'error');
      return;
    }

    // Mostrar preview inmediato
    this.showImagePreview(file);

    // Subir archivo
    await this.uploadProfilePicture(file);
  }

  // Validar archivo de imagen
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo JPG, PNG y WebP.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 5MB.'
      };
    }

    return { valid: true };
  }

  // Mostrar preview de la imagen seleccionada
  showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('profileImage').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Subir foto de perfil
  async uploadProfilePicture(file) {
    const progressDiv = document.getElementById('uploadProgress');
    const messageDiv = document.getElementById('uploadMessage');

    try {
      // Mostrar indicador de carga
      progressDiv.style.display = 'block';
      messageDiv.innerHTML = '';

      // Crear FormData
      const formData = new FormData();
      formData.append('profile_picture', file);

      // Realizar petición
      const response = await fetch(`${this.apiBaseUrl}/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        // Éxito
        this.currentProfileUrl = result.profile_picture_url;
        document.getElementById('profileImage').src = result.profile_picture_url;
        document.getElementById('removePhotoBtn').style.display = 'inline-block';
        this.showMessage(result.message, 'success');
      } else {
        // Error del servidor
        this.showMessage(result.error || 'Error al subir la imagen', 'error');
        // Revertir preview si hay error
        if (this.currentProfileUrl) {
          document.getElementById('profileImage').src = this.currentProfileUrl;
        } else {
          document.getElementById('profileImage').src = '/default-avatar.png';
        }
      }
    } catch (error) {
      // Error de red
      this.showMessage('Error de conexión. Intente nuevamente.', 'error');
      console.error('Upload error:', error);
    } finally {
      // Ocultar indicador de carga
      progressDiv.style.display = 'none';
      // Limpiar input
      document.getElementById('profilePictureInput').value = '';
    }
  }

  // Eliminar foto de perfil
  async removeProfilePicture() {
    if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/profile/picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        // Éxito
        this.currentProfileUrl = null;
        document.getElementById('profileImage').src = '/default-avatar.png';
        document.getElementById('removePhotoBtn').style.display = 'none';
        this.showMessage(result.message, 'success');
      } else {
        this.showMessage(result.error || 'Error al eliminar la imagen', 'error');
      }
    } catch (error) {
      this.showMessage('Error de conexión. Intente nuevamente.', 'error');
      console.error('Remove error:', error);
    }
  }

  // Mostrar mensajes al usuario
  showMessage(message, type) {
    const messageDiv = document.getElementById('uploadMessage');
    messageDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 5000);
  }
}

// Funciones globales para usar en HTML
let profileManager;

function initProfileManager(apiBaseUrl, authToken) {
  profileManager = new ProfilePictureManager(apiBaseUrl, authToken);
  profileManager.loadUserProfile();
}

function openFileSelector() {
  profileManager.openFileSelector();
}

function handleFileSelection(event) {
  profileManager.handleFileSelection(event);
}

function removeProfilePicture() {
  profileManager.removeProfilePicture();
}
```

### **2. CSS Recomendado**
```css
.profile-picture-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 300px;
  margin: 0 auto;
}

.profile-picture-container {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.profile-picture {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.profile-picture-container:hover .profile-picture {
  transform: scale(1.05);
}

.profile-picture-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 8px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.profile-picture-container:hover .profile-picture-overlay {
  opacity: 1;
}

.profile-picture-overlay button {
  background: none;
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  margin: 2px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.profile-picture-overlay button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

#uploadProgress {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.message {
  width: 100%;
  text-align: center;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin: 8px 0;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
```

### **3. Inicialización en tu App**
```javascript
// Cuando el usuario se autentica
function onUserLogin(authToken) {
  // Guardar token
  localStorage.setItem('authToken', authToken);
  
  // Inicializar manager de fotos de perfil
  const apiBaseUrl = 'http://localhost:3000/api/v1'; // Cambiar por tu URL
  initProfileManager(apiBaseUrl, authToken);
}

// Al cargar la página, si hay token guardado
document.addEventListener('DOMContentLoaded', function() {
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    const apiBaseUrl = 'http://localhost:3000/api/v1'; // Cambiar por tu URL
    initProfileManager(apiBaseUrl, savedToken);
  }
});
```

## 🎯 Casos de Uso Específicos

### **1. Mostrar Avatar en Comentarios/Posts**
```javascript
function renderUserAvatar(user, size = 40) {
  const avatarUrl = user.profile_picture_url || '/default-avatar.png';
  return `
    <img 
      src="${avatarUrl}" 
      alt="${user.nombre}"
      class="user-avatar"
      style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover;"
      onerror="this.src='/default-avatar.png'"
    />
  `;
}

// Uso en comentarios
function renderComment(comment) {
  return `
    <div class="comment">
      ${renderUserAvatar(comment.user, 32)}
      <div class="comment-content">
        <strong>${comment.user.nombre}</strong>
        <p>${comment.content}</p>
      </div>
    </div>
  `;
}
```

### **2. Lista de Usuarios con Fotos**
```javascript
async function loadUsersList() {
  try {
    const response = await fetch('/api/v1/users'); // Endpoint de usuarios
    const users = await response.json();
    
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = users.map(user => `
      <div class="user-card" onclick="viewUserProfile(${user.id})">
        ${renderUserAvatar(user, 50)}
        <div class="user-info">
          <h4>${user.nombre}</h4>
          <p>${user.rol}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}
```

### **3. Perfil Público de Usuario**
```javascript
async function loadPublicProfile(userId) {
  try {
    const response = await fetch(`/api/v1/profile/${userId}`);
    const result = await response.json();
    
    if (response.ok) {
      const user = result.user;
      document.getElementById('publicProfile').innerHTML = `
        <div class="public-profile">
          <div class="profile-header">
            ${renderUserAvatar(user, 120)}
            <h2>${user.nombre}</h2>
            <p class="user-role">${user.rol}</p>
            <p class="member-since">Miembro desde ${new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading public profile:', error);
  }
}
```

## 🔄 Actualizaciones del Sistema de Autenticación

### **Login Response Actualizado**
El endpoint de login ahora incluye `profile_picture_url`:

```javascript
// Respuesta del login
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "usuario",
    "profile_picture_url": "/uploads/profile-pictures/profile-1642345678901-123456789.jpg"
  }
}
```

### **Actualizar Datos del Usuario en el Frontend**
```javascript
function updateUserSession(loginResponse) {
  // Guardar datos del usuario
  const userData = {
    id: loginResponse.user.id,
    nombre: loginResponse.user.nombre,
    email: loginResponse.user.email,
    rol: loginResponse.user.rol,
    profile_picture_url: loginResponse.user.profile_picture_url,
    token: loginResponse.token
  };
  
  // Guardar en localStorage
  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('authToken', loginResponse.token);
  
  // Actualizar UI inmediatamente
  updateUIWithUserData(userData);
}

function updateUIWithUserData(userData) {
  // Actualizar avatar en navbar
  const navAvatar = document.getElementById('navUserAvatar');
  if (navAvatar) {
    navAvatar.src = userData.profile_picture_url || '/default-avatar.png';
  }
  
  // Actualizar nombre de usuario
  const userName = document.getElementById('navUserName');
  if (userName) {
    userName.textContent = userData.nombre;
  }
}
```

## 🐛 Manejo de Errores Comunes

### **1. Error de Autenticación**
```javascript
function handleAuthError(response) {
  if (response.status === 401) {
    // Token expirado o inválido
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  }
}
```

### **2. Error de Archivo**
```javascript
function handleFileError(error) {
  const errorMessages = {
    'Tipo de archivo no permitido': 'Solo se permiten imágenes JPG, PNG y WebP',
    'El archivo es demasiado grande': 'La imagen debe ser menor a 5MB',
    'Campo profile_picture requerido': 'Debe seleccionar una imagen'
  };
  
  const message = errorMessages[error] || error;
  showUserMessage(message, 'error');
}
```

### **3. Fallback para Imágenes**
```javascript
// Agregar a todas las imágenes de perfil
function addImageFallback(imgElement) {
  imgElement.onerror = function() {
    this.src = '/default-avatar.png';
    this.onerror = null; // Evitar loop infinito
  };
}
```

## 📱 Consideraciones Móviles

### **1. Captura de Cámara**
```html
<!-- Permitir captura directa desde cámara en móviles -->
<input 
  type="file" 
  accept="image/*"
  capture="user"
  id="profilePictureInput"
/>
```

### **2. Responsive Design**
```css
@media (max-width: 768px) {
  .profile-picture-container {
    width: 100px;
    height: 100px;
  }
  
  .profile-picture-overlay {
    font-size: 10px;
  }
  
  .profile-picture-overlay button {
    padding: 2px 6px;
    font-size: 10px;
  }
}
```

## 🚨 Notas Importantes

1. **URLs de Imágenes:** Todas las URLs son relativas. Concatena con tu base URL del API.

2. **Caching:** Las imágenes se cachean por el navegador. Si subes una nueva foto, podrías necesitar agregar un timestamp: `${url}?t=${Date.now()}`

3. **Seguridad:** Nunca exposites el token en logs o consola en producción.

4. **Performance:** Las imágenes se redimensionan automáticamente en el servidor a 300x300px.

5. **Fallbacks:** Siempre incluye imagen por defecto para usuarios sin foto.

## ✅ Checklist de Implementación

- [ ] Implementar componente de subida de fotos
- [ ] Agregar validaciones del lado del cliente
- [ ] Mostrar avatares en toda la aplicación
- [ ] Actualizar sistema de login para incluir foto
- [ ] Implementar manejo de errores
- [ ] Agregar estilos CSS responsivos
- [ ] Testear en dispositivos móviles
- [ ] Implementar fallbacks para imágenes
- [ ] Optimizar carga de imágenes
- [ ] Documentar para el equipo

---

¡Con esta guía tu desarrollador frontend tendrá todo lo necesario para implementar completamente la funcionalidad de fotos de perfil! 🚀 