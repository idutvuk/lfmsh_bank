from enum import Enum

# Currency sign
SIGN_BUCKS = "@"
SIGN_CERTS = "🕮"

# Academic constants
SEM_NOT_READ_PEN = 100
LAB_PENALTY = 30
STEP_OBL_STD = 5
INITIAL_STEP_OBL_STD = 5
LAB_PASS_NEEDED_EQUATOR = 1
OBL_STUDY_NEEDED = 4
OBL_STUDY_NEEDED_EQUATOR = 2
FAC_PASS_NEEDED = {8: 0, 9: 1, 10: 1}
FAC_PENALTY = 30
LECTURE_PENALTY_STEP = 10
LECTURE_PENALTY_INITIAL = 10

# limits
LAB_NEEDED = {8: 3, 9: 3, 10: 2}
FAC_NEEDED = 20 # at lfmsh 38 todo addd equator handling
SEM_NEEDED = 1
LEC_NEEDED = 13 # at lfmsh 38

# Daily tax amount
DAILY_TAX_AMOUNT = 20.0


# Enums for transaction states and types
class States(Enum):
    created = "created"
    processed = "processed"
    declined = "declined"
    substituted = "substituted"


class TransactionTypeEnum(Enum):
    p2p = "p2p"
    fine = "fine"
    activity = "activity"
    seminar = "seminar"
    lecture = "lecture"
    table = "table"
    fac_attend = "fac_attend"
    fac_pass = "fac_pass"
    lab = "lab"
    lab_pass = "lab_pass"
    lec_attend = "lec_attend"
    sem_attend = "sem_attend"
    workout = "workout"
    purchase = "purchase"
    general = "general"
    ds = "ds"
    exam = "exam"


class AttendanceTypeEnum(Enum):
    seminar_attend = "seminar_attend"
    seminar_pass = "seminar_pass"
    lecture_attend = "lecture_attend"
    lecture_miss = "lecture_miss"
    fac_pass = "fac_pass"
    fac_attend = "fac_attend"
    lab_pass = "lab_pass"
    workout_attend = "workout_attend"


class AttendanceBlockEnum(Enum):
    first = "first"
    second = "second"
    third = "third"
    fourth = "fourth"
    fifth = "fifth"
    evening = "evening"