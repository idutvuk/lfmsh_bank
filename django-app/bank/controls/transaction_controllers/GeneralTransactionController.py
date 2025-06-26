from django.contrib.auth import get_user_model; User = get_user_model()

from bank.constants import MoneyTypeEnum, TransactionTypeEnum
from bank.controls.transaction_controllers.TableTransactionController import TableTransactionController
from bank.forms import GeneralMoneyKernelForm
from bank.models.Money import Money
from bank.models.TransactionType import TransactionType
from bank.models.MoneyType import MoneyType
from bank.models.Transaction import Transaction


class GeneralTransactionController(TableTransactionController):
  template_url = 'bank/add/add_general_money.html'
  value_show_name = 'Сумма'
  header = 'Начисление за все подряд'

  @staticmethod
  def _get_kernel_form():
    return GeneralMoneyKernelForm

  @staticmethod
  def get_initial_form_data(creator_username):
    initial = super(
        GeneralTransactionController,
        GeneralTransactionController).get_initial_form_data(creator_username)
    for in_data in initial:
      in_data['money_type'] = MoneyTypeEnum.staff_help.value
    return initial

  @staticmethod
  def get_transaction_from_form_data(formset_data, update_of):
    first_form = formset_data[0]
    creator = User.objects.get(username=first_form['creator_username'])

    new_transaction = Transaction.new_transaction(
        creator,
        TransactionType.objects.get(
            name=TransactionTypeEnum.general_money.value), formset_data,
        update_of)
    money_type = MoneyType.objects.get(name=first_form['money_type'])

    for atomic_data in formset_data:
      value = atomic_data['value']
      if value:
        receiver = User.objects.get(username=atomic_data['receiver_username'])
        Money.new_money(receiver, value, money_type, first_form['description'],
                        new_transaction)
    return new_transaction
  
  @staticmethod
  def build_transaction_from_api_request(creator, api_request_body):
    """
    Create a general money transaction from API request.
    
    Expected format:
    {
        "type": "general_money",
        "money_type": "staff_help",
        "description": "Some transaction description",
        "receivers": [
            {"username": "user1", "value": 100},
            {"username": "user2", "value": 200}
        ]
    }
    """
    # Validate required fields
    if not api_request_body.get('description'):
      raise ValueError("Description is required")
      
    if not api_request_body.get('money_type'):
      raise ValueError("Money type is required")
      
    if not api_request_body.get('receivers'):
      raise ValueError("Receivers list is required")
    
    # Get the transaction type
    transaction_type = TransactionType.objects.get(
        name=TransactionTypeEnum.general_money.value)
    
    # Create the transaction
    transaction = Transaction.new_transaction(
        creator=creator,
        type=transaction_type,
        creation_map=api_request_body
    )
    
    # Get the money type
    money_type = MoneyType.objects.get(name=api_request_body['money_type'])
    
    # Create money objects for each receiver
    for receiver_data in api_request_body['receivers']:
      if not receiver_data.get('username') or not receiver_data.get('value'):
        continue
        
      try:
        receiver = User.objects.get(username=receiver_data['username'])
        value = float(receiver_data['value'])
        
        # Create the money object
        Money.new_money(
            receiver=receiver,
            value=value,
            type=money_type,
            description=api_request_body['description'],
            related_transaction=transaction
        )
      except User.DoesNotExist:
        # Skip users that don't exist
        continue
      except ValueError:
        # Skip invalid values
        continue
    
    return transaction
