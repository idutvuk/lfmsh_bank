from sqlalchemy.orm import Session
from app.core.constants import States, TransactionTypeEnum
from app.models.transaction import TransactionState, TransactionType
from loguru import logger

def init_transaction_states(db: Session) -> None:
    """Initialize transaction states in the database if they don't exist."""
    try:
        logger.info("Initializing transaction states...")
        
        # Check existing states
        existing_states = db.query(TransactionState.name).all()
        existing_state_names = [state[0] for state in existing_states]
        
        logger.info(f"Found existing states: {existing_state_names}")
        
        # Create each state defined in the enum if it doesn't exist
        for state in States:
            if state.value not in existing_state_names:
                new_state = TransactionState(name=state.value, readable_name=state.value.capitalize())
                
                # Set counted=True for processed state
                if state == States.processed:
                    new_state.counted = True
                    
                db.add(new_state)
                logger.info(f"Added transaction state: {state.value}")
        
        db.commit()
        
        # After commit, retrieve states for transitions
        created_state = db.query(TransactionState).filter_by(name='created').first()
        processed_state = db.query(TransactionState).filter_by(name='processed').first()
        declined_state = db.query(TransactionState).filter_by(name='declined').first()
        substituted_state = db.query(TransactionState).filter_by(name='substituted').first()
        
        if created_state and processed_state:
            logger.info("Setting up state transitions...")
            
            # created → [processed, declined, substituted]
            if processed_state not in created_state.possible_transitions:
                created_state.possible_transitions.append(processed_state)
                logger.info("Added transition: created → processed")
            
            if declined_state and declined_state not in created_state.possible_transitions:
                created_state.possible_transitions.append(declined_state)
                logger.info("Added transition: created → declined")
                
            if substituted_state and substituted_state not in created_state.possible_transitions:
                created_state.possible_transitions.append(substituted_state)
                logger.info("Added transition: created → substituted")
                
            # processed → [substituted]
            if substituted_state and substituted_state not in processed_state.possible_transitions:
                processed_state.possible_transitions.append(substituted_state)
                logger.info("Added transition: processed → substituted")
                
            db.commit()
            logger.info("Transaction states initialized successfully")
        else:
            logger.warning("Some transaction states were not found after creation. State transitions could not be set up.")
            
    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing transaction states: {str(e)}")
        raise

def init_transaction_types(db: Session) -> None:
    """Initialize transaction types in the database if they don't exist."""
    try:
        logger.info("Initializing transaction types...")
        
        # Check existing types
        existing_types = db.query(TransactionType.name).all()
        existing_type_names = [type[0] for type in existing_types]
        
        logger.info(f"Found existing types: {existing_type_names}")
        
        # Create each type defined in the enum if it doesn't exist
        for type_enum in TransactionTypeEnum:
            if type_enum.value not in existing_type_names:
                new_type = TransactionType(
                    name=type_enum.value, 
                    readable_name=type_enum.value.replace('_', ' ').capitalize()
                )
                db.add(new_type)
                logger.info(f"Added transaction type: {type_enum.value}")
                
        db.commit()
        logger.info("Transaction types initialized successfully")
    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing transaction types: {str(e)}")
        raise

def init_db(db: Session) -> None:
    """Initialize the database with required data."""
    try:
        logger.info("Starting database initialization...")
        init_transaction_states(db)
        init_transaction_types(db)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        # Don't propagate the exception to prevent app startup failure
        # Just log it for troubleshooting 