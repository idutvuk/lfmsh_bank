from django.urls import path, include
from .views import *

app_name = 'api'
urlpatterns = [
    # djoser disabled while i mocking data todo remove
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    # path('auth/jwt/create/', mock_obtain_jwt, name='mock_obtain_jwt'),
    # path('auth/jwt/refresh/', RefreshJWT.as_view()),
    path('users/me/', UserProfileView.as_view()),
    path('users/me/counters/', UserCountersView.as_view()),
    path('users/', UsersListView.as_view()),
    path('transactions/', TransactionListCreate.as_view()),
    path('transactions/pending/', PendingTransactions.as_view()),
    path('transactions/<int:transaction_id>/', TransactionDetail.as_view()),
    path('transactions/<int:transaction_id>/approve/', TransactionApprove.as_view()),
    path('transactions/<int:transaction_id>/reject/', TransactionReject.as_view()),
    path('pioneers/', PioneersList.as_view()),
    path('statistics/', StatisticsView.as_view()),
]
