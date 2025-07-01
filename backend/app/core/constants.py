from enum import Enum

# Currency sign
SIGN = '@'

# Academic constants
SEM_NOT_READ_PEN = 50
LAB_PENALTY = 30
STEP_OBL_STD = 5
INITIAL_STEP_OBL_STD = 5
LAB_PASS_NEEDED = {
    5: 2,
    6: 2,
    7: 3,
    8: 3
}
LAB_PASS_NEEDED_EQUATOR = 1
OBL_STUDY_NEEDED = 4
OBL_STUDY_NEEDED_EQUATOR = 2
FAC_PASS_NEEDED = {
    5: 1,
    6: 1,
    7: 1,
    8: 1
}
FAC_PENALTY = 30
LECTURE_PENALTY_STEP = 10
LECTURE_PENALTY_INITIAL = 10

# Daily tax amount
DAILY_TAX_AMOUNT = 1.0

# Enums for transaction states and types
class States(Enum):
    created = 'created'
    processed = 'processed'
    declined = 'declined'
    substituted = 'substituted'


class TransactionTypeEnum(Enum):
    p2p = 'p2p'
    fine = 'fine'
    activity = 'activity'
    seminar = 'seminar'
    lecture = 'lecture'
    table = 'table'
    fac_attend = 'fac_attend'
    fac_pass = 'fac_pass'
    lab = 'lab'
    lab_pass = 'lab_pass'
    lec_attend = 'lec_attend'
    sem_attend = 'sem_attend'
    workout = 'workout'
    purchase = 'purchase'
    general = 'general'
    ds = 'ds'
    exam = 'exam'


class MoneyTypeEnum(Enum):
    fine = 'Штраф'
    activity = 'Деятельность'
    seminar = 'Семинар'
    lecture = 'Лекция'
    fac_pass = 'Зачет по факультативу'
    lab = 'Лабораторная'
    ds = 'Дежурство'
    exam = 'Экзамен'
    general = 'Общее начисление'
    purchase = 'Покупка'
    p2p = 'Перевод'


class AttendanceTypeEnum(Enum):
    seminar_attend = 'seminar_attend'
    seminar_pass = 'seminar_pass'
    lecture_attend = 'lecture_attend'
    lecture_miss = 'lecture_miss'
    fac_pass = 'fac_pass'
    fac_attend = 'fac_attend'
    lab_pass = 'lab_pass'
    workout_attend = 'workout_attend'


class AttendanceBlockEnum(Enum):
    before_breakfast = 'before_breakfast'
    first = 'first'
    second = 'second'
    third = 'third'
    fourth = 'fourth'
    fifth = 'fifth'
    evening = 'evening'


class UserGroups(Enum):
    admin = 'admin'
    staff = 'staff'
    student = 'student' 