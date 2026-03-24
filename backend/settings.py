"""
Django settings for backend project.
"""

from pathlib import Path
from datetime import timedelta # <-- Movido arriba (Buenas prácticas de Python)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-4)$gcvxv&7ry&se=m2&z%mo8jt#w3c6*(f6s0unfc#k#(j1pzx'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',         # Para crear la API
    'corsheaders',            # Para que React pueda conectarse
    'gestion_clinica',        # Tu app de la clínica
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # <--- AQUÍ ESTÁ, LISTO PARA FUNCIONAR
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'clinica_dental',       
        'USER': 'postgres',              
        'PASSWORD': 'admin',       
        'HOST': '127.0.0.1',             
        'PORT': '5432',                  
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

# Internationalization
LANGUAGE_CODE = 'es-bo' # <--- Español de Bolivia
TIME_ZONE = 'America/La_Paz' # <--- Tu zona horaria
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'

# ==========================================
# CONFIGURACIÓN DE SEGURIDAD (CORS)
# ==========================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ==========================================
# CONFIGURACIÓN DE API (JWT Tokens)
# ==========================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60), 
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),    
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False, # Apagado temporalmente para no pedirte nuevas migraciones
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ==========================================
# CONFIGURACIÓN DE CORREOS REALES
# ==========================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'isacc.mealla.psn@gmail.com'  
EMAIL_HOST_PASSWORD = 'kmmp rcny urga htqa'