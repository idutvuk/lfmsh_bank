from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Avg, Sum
from bank.models.Transaction import Transaction
from bank.models.TransactionState import TransactionState
from bank.constants import AttendanceTypeEnum, States
from bank.controls.TransactionService import TransactionService
from bank.controls.stats_controller import StatsController
from loguru import logger
from django.contrib.auth.models import Group
from bank.constants import UserGroups

User = get_user_model()
_staff_group = Group.objects.get(name=UserGroups.student.value) # staff us equivalent to not student
def is_staff(user): #todo remove - this overlaps the permission functionality
    return not _staff_group.user_set.filter(id=user.id).exists()

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user


        profile_data = {
            "username": user.username,
            "name": f"{user.first_name} {user.last_name}",
            "staff": is_staff(user),
            "balance": 0,
            "expected_penalty": 0,
            "counters": []
        }

        # Only calculate counters and penalties for students (non-staff)
        if not is_staff(user):
            profile_data["balance"] = user.balance
            profile_data["expected_penalty"] = user.get_final_study_fine()
            profile_data["counters"] = [
                {
                    "counter_name": AttendanceTypeEnum.lab_pass.value,
                    "value": user.get_counter(AttendanceTypeEnum.lab_pass.value),
                    "max_value": user.lab_needed()
                },
                {
                    "counter_name": AttendanceTypeEnum.lecture_attend.value,
                    "value": user.get_counter(AttendanceTypeEnum.lecture_attend.value),
                    "max_value": 10
                },
                {
                    "counter_name": AttendanceTypeEnum.seminar_attend.value,
                    "value": user.get_counter(AttendanceTypeEnum.seminar_attend.value),
                    "max_value": 10
                },
                {
                    "counter_name": AttendanceTypeEnum.fac_attend.value,
                    "value": user.get_counter(AttendanceTypeEnum.fac_attend.value),
                    "max_value": 10
                },
                {
                    "counter_name": AttendanceTypeEnum.fac_pass.value,
                    "value": user.get_counter(AttendanceTypeEnum.fac_pass.value),
                    "max_value": user.fac_needed()
                }
            ]

        return Response(profile_data)

class UserCountersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Return empty counters for staff users
        if is_staff(user):
            return Response([])

        counters = [
            {
                "counter_name": AttendanceTypeEnum.lab_pass.value,
                "value": user.get_counter(AttendanceTypeEnum.lab_pass.value),
                "max_value": user.lab_needed()
            },
            {
                "counter_name": AttendanceTypeEnum.lecture_attend.value,
                "value": user.get_counter(AttendanceTypeEnum.lecture_attend.value),
                "max_value": 15
            },
            {
                "counter_name": AttendanceTypeEnum.fac_attend.value,
                "value": user.get_counter(AttendanceTypeEnum.fac_attend.value),
                "max_value": 1
            },
            {
                "counter_name": AttendanceTypeEnum.fac_pass.value,
                "value": user.get_counter(AttendanceTypeEnum.fac_pass.value),
                "max_value": user.fac_needed()
            }
        ]
        return Response(counters)

class TransactionListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if is_staff(request.user):
            transactions = Transaction.objects.all().order_by('-creation_timestamp')[:20]
        else:
            # Get transactions where the user is a receiver
            transactions = Transaction.objects.filter(
                related_money_atomics__receiver=request.user
            ).distinct().order_by('-creation_timestamp')[:20]

        return Response([self._format_transaction(tx) for tx in transactions])

    def post(self, request):
        try:
            transaction = TransactionService.create_transaction(request.user, request.data)
            return Response(self._format_transaction(transaction), status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _format_transaction(self, transaction):
        receivers_data = []
        money_atomics = transaction.related_money_atomics.all()
        attendance_atomics = transaction.related_attendance_atomics.all()

        receivers = {}
        for atomic in money_atomics:
            username = atomic.receiver.username
            if username not in receivers:
                receivers[username] = {
                    "username": username,
                    "bucks": 0,
                    "certs": 0,
                    "lab": 0,
                    "lec": 0,
                    "sem": 0,
                    "fac": 0
                }
            if atomic.type.name == "Сертификаты":
                receivers[username]["certs"] += atomic.value
            else:
                receivers[username]["bucks"] += atomic.value

        for atomic in attendance_atomics:
            username = atomic.receiver.username
            if username not in receivers:
                receivers[username] = {
                    "username": username,
                    "bucks": 0,
                    "certs": 0,
                    "lab": 0,
                    "lec": 0,
                    "sem": 0,
                    "fac": 0
                }

            if atomic.type.name == AttendanceTypeEnum.lab_pass.value:
                receivers[username]["lab"] += atomic.value
            elif atomic.type.name == AttendanceTypeEnum.lecture_attend.value:
                receivers[username]["lec"] += atomic.value
            elif atomic.type.name == AttendanceTypeEnum.seminar_attend.value:
                receivers[username]["sem"] += atomic.value
            elif atomic.type.name in [AttendanceTypeEnum.fac_attend.value, AttendanceTypeEnum.fac_pass.value]:
                receivers[username]["fac"] += atomic.value

        return {
            "id": transaction.id,
            "author": transaction.creator.username,
            "description": transaction.type.readable_name,
            "type": transaction.type.name,
            "status": transaction.state.name,
            "date_created": transaction.creation_timestamp,
            "receivers": list(receivers.values())
        }

class TransactionDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        try:
            transaction = get_object_or_404(Transaction, id=transaction_id)

            # Check if the user has permission to view this transaction
            if not is_staff(request.user) and not transaction.related_money_atomics.filter(receiver=request.user).exists():
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            view = TransactionListCreate()
            return Response(view._format_transaction(transaction))
        except Transaction.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

class PendingTransactions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only staff can view pending transactions
        if not is_staff(request.user):
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        created_state = get_object_or_404(TransactionState, name=States.created.value)
        transactions = Transaction.objects.filter(state=created_state).order_by('-creation_timestamp')

        view = TransactionListCreate()
        return Response([view._format_transaction(tx) for tx in transactions])

class TransactionApprove(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, transaction_id):
        # Only staff can approve transactions
        if not is_staff(request.user):
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        transaction = get_object_or_404(Transaction, id=transaction_id)

        try:
            transaction.process()
            view = TransactionListCreate()
            return Response(view._format_transaction(transaction))
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TransactionReject(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, transaction_id):
        # Only staff can reject transactions
        if not is_staff(request.user):
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        transaction = get_object_or_404(Transaction, id=transaction_id)

        try:
            transaction.decline()
            view = TransactionListCreate()
            return Response(view._format_transaction(transaction))
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PioneersList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only staff can access the full pioneers list
        if not is_staff(request.user):
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        pioneers = User.objects.filter(is_staff=False)
        return Response([
            {"username": user.username, "name": f"{user.first_name} {user.last_name}"}
            for user in pioneers
        ])

class UsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all users, both students and staff
        users = User.objects.all()

        # Format the response to match what the frontend expects
        users_data = [
            {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}",
                "balance": user.balance,
                "staff": is_staff(user),
                "party":user.party,
            }
            for user in users
        ]

        return Response(users_data)

class StatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only staff can access statistics
        if not is_staff(request.user):
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        stats = StatsController.get_general_stats()
        return Response({
            "avg_balance": stats.get("avg_balance", 0),
            "total_balance": stats.get("total_balance", 0)
        })

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        # Get the target user
        target_user = get_object_or_404(User, id=user_id)
        
        # Check permissions - staff can view any user, regular users can only view themselves
        if not is_staff(request.user) and request.user.id != user_id:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        profile_data = {
            "username": target_user.username,
            "name": f"{target_user.first_name} {target_user.last_name}",
            "staff": is_staff(target_user),
            "balance": 0,
            "expected_penalty": 0,
            "counters": []
        }

        # Only calculate counters and penalties for students (non-staff)
        if not is_staff(target_user):
            profile_data["balance"] = target_user.balance
            profile_data["expected_penalty"] = target_user.get_final_study_fine()
            profile_data["counters"] = [
                {
                    "counter_name": AttendanceTypeEnum.lab_pass.value,
                    "value": target_user.get_counter(AttendanceTypeEnum.lab_pass.value),
                    "max_value": target_user.lab_needed()
                },
                {
                    "counter_name": AttendanceTypeEnum.lecture_attend.value,
                    "value": target_user.get_counter(AttendanceTypeEnum.lecture_attend.value),
                    "max_value": 10
                },
                {
                    "counter_name": AttendanceTypeEnum.seminar_attend.value,
                    "value": target_user.get_counter(AttendanceTypeEnum.seminar_attend.value),
                    "max_value": 10
                },
                {
                    "counter_name": AttendanceTypeEnum.fac_attend.value,
                    "value": target_user.get_counter(AttendanceTypeEnum.fac_attend.value),
                    "max_value": 10
                },
                {
                    "counter_name": AttendanceTypeEnum.fac_pass.value,
                    "value": target_user.get_counter(AttendanceTypeEnum.fac_pass.value),
                    "max_value": target_user.fac_needed()
                }
            ]

        return Response(profile_data)
