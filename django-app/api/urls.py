from django.urls import path, include
from .views import *

app_name = 'api'
urlpatterns = [
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    path('users/me/', UserProfileView.as_view()),
    path('users/me/counters/', UserCountersView.as_view()),
    path('users/<int:user_id>/', UserDetailView.as_view()),
    path('users/', UsersListView.as_view()),
    path('transactions/', TransactionListCreate.as_view()),
    path('transactions/pending/', PendingTransactions.as_view()),
    path('transactions/<int:transaction_id>/', TransactionDetail.as_view()),
    path('transactions/<int:transaction_id>/approve/', TransactionApprove.as_view()),
    path('transactions/<int:transaction_id>/reject/', TransactionReject.as_view()),
    path('pioneers/', PioneersList.as_view()),
    path('statistics/', StatisticsView.as_view()),
]
