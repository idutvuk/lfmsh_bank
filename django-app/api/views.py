from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status, permissions

# Примеры «мок» данных
@api_view(['POST'])
@permission_classes([AllowAny])
def mock_obtain_jwt(request):
    """
    Всегда возвращает фиктивные токены.
    """
    return Response({
        "access": "mocked-access-token",
        "refresh": "mocked-refresh-token"
    })

MOCK_USER = {
    "username": "petya.ivanov",
    "name": "Пётр Иванов",
    "staff": False,
    "balance": 120.50,
    "expected_penalty": 10
}
MOCK_COUNTERS = [
    {"counter_name": "lab", "value": 2, "max_value": 3},
    {"counter_name": "lec", "value": 5, "max_value": 10},
]
MOCK_TX = {
    "id": 123,
    "author": "staff.member",
    "description": "Бонус за экзамен",
    "type": "exam",
    "status": "created",
    "date_created": "2025-06-21T12:34:56Z",
    "receivers": [
        {"username": "ivan.petrov","bucks": 50,"certs": 0,"lab":0,"lec":0,"sem":0,"fac":0}
    ]
}
MOCK_TX_LIST = [MOCK_TX]

class ObtainJWT(APIView):
    permission_classes = []  # AllowAny
    def post(self, request):
        # вернём всегда один и тот же мок
        return Response({"access": "jwt-access-token", "refresh": "jwt-refresh-token"})

class RefreshJWT(APIView):
    permission_classes = []
    def post(self, request):
        return Response({"access": "new-jwt-access-token"})

class UserProfileView(APIView):
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]
    def get(self, request):
        profile_with_counters = {
            **MOCK_USER,
            "counters": MOCK_COUNTERS
        }
        return Response(profile_with_counters)

class UserCountersView(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]

    def get(self, request):
        # Можно проверить роль: request.user.is_staff / pioner
        return Response(MOCK_COUNTERS)

class TransactionListCreate(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(MOCK_TX_LIST)
    def post(self, request):
        return Response(MOCK_TX, status=status.HTTP_201_CREATED)

class TransactionDetail(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]

    def get(self, request, transaction_id):
        if transaction_id != MOCK_TX["id"]:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(MOCK_TX)

class PendingTransactions(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]

    def get(self, request):
        # Только staff
        return Response(MOCK_TX_LIST)

class TransactionApprove(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]

    def patch(self, request, transaction_id):
        tx = MOCK_TX.copy()
        tx["status"] = "approved"
        return Response(tx)

class TransactionReject(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]

    def patch(self, request, transaction_id):
        tx = MOCK_TX.copy()
        tx["status"] = "cancelled"
        return Response(tx)

class PioneersList(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]

    def get(self, request):
        return Response([
            {"username": "petya.ivanov","name": "Пётр Иванов"},
            {"username": "masha.sidorova","name": "Маша Сидорова"}
        ])

class StatisticsView(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"avg_balance": 75.32, "total_balance": 43210.50})
