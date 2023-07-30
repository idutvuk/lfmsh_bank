from django.contrib.auth.models import User

from bank.constants import TransactionTypeEnum, AttendanceTypeEnum, BOOK_CERTIFICATE_VALUE
from bank.controls.transaction_controllers.TableTransactionController import TableTransactionController
from bank.forms import CertificateForm
from bank.models.TransactionType import TransactionType
from bank.models.Attendance import Attendance
from bank.models.AttendanceType import AttendanceType
from bank.models.Transaction import Transaction


class CertificateTransactionController(TableTransactionController):
  template_url = 'bank/add/add_certificate.html'

  value_show_name = 'Заслужил'
  header = 'Начисление сертификатов'

  @staticmethod
  def _get_kernel_form():
    return CertificateForm

  @staticmethod
  def get_transaction_from_form_data(formset_data, update_of):
    first_form = formset_data[0]
    creator = User.objects.get(username=first_form['creator_username'])
    new_transaction = Transaction.new_transaction(
        creator,
        TransactionType.objects.get(name=TransactionTypeEnum.certificate.value),
        formset_data, update_of)

    for atomic_data in formset_data:
      attended = atomic_data['attended']
      if attended:
        receiver = User.objects.get(username=atomic_data['receiver_username'])
        Attendance.new_attendance(
            receiver, BOOK_CERTIFICATE_VALUE,
            AttendanceType.objects.get(
                name=AttendanceTypeEnum.book_certificate.value),
            first_form['description'], first_form['date'], new_transaction)

    return new_transaction
