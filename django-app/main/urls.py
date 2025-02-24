from django.urls import re_path as url
from django.conf.urls import  include
from django.contrib import admin
from django.views.generic.base import RedirectView

urlpatterns = [
    # Examples:
    url(r'^$', RedirectView.as_view(url='/bank/')),
    url(r'^admin/', admin.site.urls),
    url(r'^bank/', include('bank.urls', namespace='bank')),
    url(r'^bank_api/', include('bank_api.urls', namespace='bank_api'))
]
