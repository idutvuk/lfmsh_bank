"""
Django settings for mysite project.

Generated by 'django-admin startproject' using Django 1.8.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.8/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
import dotenv


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.dirname(BASE_DIR)
dotenv.load_dotenv(os.path.join(PROJECT_DIR, '.env'))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ['BANK_SECRET_KEY']

ALLOWED_HOSTS = ['.c9users.io', '.localhost', '127.0.0.1', '192.168.88.5', 'lfm.sh', '*']

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'bank',
    'bootstrap3',
    'django_tables2',
)

MIDDLEWARE = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
)

ROOT_URLCONF = 'main.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages'
            ],
        },
    },
]

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '%(levelname)s %(asctime)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'main/', 'warning_log.log'),
            'formatter': 'simple'
        },
        'errors_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'main/', 'error_log.log'),
            'formatter': 'simple'
        }
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'errors_file'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
        },
        'bank_log': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'bank_api_log': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'unexpected_things_logger': {
            'handlers': ['file'],
            'level': 'WARNING',
        }
    },
}

WSGI_APPLICATION = 'main.wsgi.application'

# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

#ESSION_COOKIE_SECURE = True
#CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

if os.environ.get('BANK_MODE', '') == 'docker-prod':
  DATABASES = {
      'default': {
          'ENGINE': 'django.db.backends.postgresql',
          'NAME': 'postgres',
          'USER': 'postgres',
          'PASSWORD': os.environ['BANK_POSTGRESS_PASSWORD'],
          'HOST': 'db',
          'PORT': 5432,
      }
  }
  DEBUG = False

# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Moscow'

# USE_I18N = True

# USE_L10N = True

USE_TZ = False

LOGIN_REDIRECT_URL = 'bank:index'
LOGIN_URL = 'bank:login'

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/
STATIC_ROOT = os.path.join(BASE_DIR, 'static/')
MEDIA_ROOT = os.path.join(BASE_DIR, 'media/')

DATA_UPLOAD_MAX_NUMBER_FIELDS = None

STATIC_URL = '/static/'

# Default settings
# The URL to the jQuery JavaScript file
BOOTSTRAP3 = {
    'css_url': {
        'url':
            os.path.join(STATIC_URL, 'bank', 'django-bootstrap', 'bootstrap',
                         'css', 'bootstrap.css'),
    },
    'javascript_url': {
        'url':
            os.path.join(STATIC_URL, 'bank', 'django-bootstrap', 'bootstrap',
                         'js', 'bootstrap.js'),
    },
    'jquery_url':
        os.path.join(STATIC_URL, 'bank', 'django-bootstrap', 'jquery.js'),
    'base_url':
        os.path.join(STATIC_URL, 'bank', 'django-bootstrap', 'bootstrap/')
}
