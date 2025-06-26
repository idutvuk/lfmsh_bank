from bank.constants.bank_api_exeptions import TransactionTypeNotSupported
from django.contrib.auth import get_user_model
from bank.models.Transaction import Transaction
from bank.models.TransactionType import TransactionType
from django.shortcuts import get_object_or_404

User = get_user_model()

class TransactionController:

  @classmethod
  def get_render_map_update(cls):
    return {}

  @classmethod
  def get_blank_form(cls, creator_username):
    pass

  @staticmethod
  def build_transaction_from_api_request(creator, api_request_body):
    """
    Build a transaction from API request data.
    
    Args:
        creator: User object (authenticated user)
        api_request_body: Dictionary containing transaction data
        
    Returns:
        Created transaction object
        
    Raises:
        TransactionTypeNotSupported: If the transaction type is not supported
    """
    trans_type = api_request_body.get('type')
    if not trans_type:
      raise ValueError("Transaction type is required")
      
    # Get the transaction type object
    transaction_type = get_object_or_404(TransactionType, name=trans_type)
    
    # Prepare the creation_map (each controller will implement specifics)
    creation_map = api_request_body
    
    # Create the transaction
    transaction = Transaction.new_transaction(
        creator=creator,
        type=transaction_type,
        creation_map=creation_map
    )
    
    return transaction
