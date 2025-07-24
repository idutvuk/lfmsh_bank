from enum import Enum

# Currency sign
SIGN_BUCKS = "@"
SIGN_CERTS = "🕮"

# Academic constants
SEM_NOT_READ_PEN = 80
LAB_PASS_NEEDED_EQUATOR = 1
LAB_PENALTY = 30
STEP_OBL_STD = 5
INITIAL_STEP_OBL_STD = 5
OBL_STUDY_NEEDED = 4
OBL_STUDY_NEEDED_EQUATOR = 2
FAC_PASS_NEEDED = {8: 0, 9: 1, 10: 1}
FAC_PENALTY = 30
LECTURE_PENALTY_STEP = 10
LECTURE_PENALTY_INITIAL = 10

# limits
LAB_NEEDED = {8: 3, 9: 3, 10: 2}
FAC_NEEDED = 20 # at lfmsh 38
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

    # +
    initial = "initial"
    staff_help = "staff_help"
    dining_services = "dining_services"
    table = "table"
    sem_attend = "sem_attend"
    workout = "workout" # зарядка
    general = "general"
    sport_event = "sport_event"
    activity = "activity"
    olympiad = "olympiad"
    problem = "problem" # убойки


    # + study
    exam = "exam"
    class_pass= "class_pas"
    fac_attend = "fac_attend"
    fac_pass = "fac_pass"
    lab = "lab"
    lec_attend = "lec_attend"
    seminar = "seminar"

    # -
    purchase = "purchase"
    purchase_book= "purchase_boo"
    purchase_auction= "purchase_auction"

    fine = "fine"
    fine_lab= "fine_lab"
    fine_lecture= "fine_lecture"
    fine_equatorial= "fine_equatorial"
    fine_final= "fine_fina"

    fine_schedule= "fine_schedule"
    fine_damage= "fine_damage"
    fine_moral= "fine_mora"
    fine_language= "fine_language"
    fine_safety = "fine_safety"

    tax = "tax"


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
