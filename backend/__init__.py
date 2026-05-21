<<<<<<< Updated upstream
try:
    from .celery import app as celery_app
except ImportError:
    celery_app = None
=======
from .celery import app as celery_app
>>>>>>> Stashed changes

__all__ = ('celery_app',)
