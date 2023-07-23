# coding=utf-8
from bank.constants.user_groups import UserGroups
import datetime

__author__ = 'nkorobkov'

SIGN = '@'
BANKIR_USERNAME = 'bank_manager'

PERMISSION_RESPONSIBLE_GROUPS = [
    UserGroups.staff.value, UserGroups.student.value, UserGroups.admin.value
]

FIRST_DAY_DATE = datetime.datetime(2023, 8, 8, 0, 0).date()

BOOK_CERTIFICATE_VALUE = 30
INITIAL_MONEY = 80
INITIAL_MONEY_DESC = 'Поздравляем с началом экономической игры!'

WORKOUT_BUDGET = 50.
EXAM_BUDGET = 54.
ACTIVITY_REWARD = {
    'sport_activity': {
        'single': [20., 15., 10., 5.]
    },
    'evening_activity': {
        'single': [20., 15., 10., 5],
        'team': [120., 100., 80., 30]
    },
    'day_activity': {
        'single': [20., 15., 10., 5],
        'team': [120., 100., 80., 30]
    }
}
DS_REWARD = { 'serving': 50.}

OBL_STUDY_NEEDED = 20
OBL_STUDY_NEEDED_EQUATOR = 10
LAB_PASS_NEEDED = {7: 3, 8: 3, 9: 2, 10: 2, 11: 2}
LAB_PASS_NEEDED_EQUATOR = 1
FAC_PASS_NEEDED = {7: 0, 8: 0, 9: 1, 10: 1, 11: 1}

LAB_PENALTY = 50  # for each unmade lab
LECTURE_PENALTY_INITIAL = 10
LECTURE_PENALTY_STEP = 20  # for each missed on new miss
FAC_PENALTY = 100  # for each not attended fac
SEM_NOT_READ_PEN = 100

INITIAL_STEP_OBL_STD = 15  # for first
STEP_OBL_STD = 5  # cumulative constant for each next

NUM_OF_PARTIES = 4

BALANCE_DANGER = 0
BALANCE_WARNING = 20

USE_PICS = True
DEFAULT_PIC_PATH = 'bank/avatars/default.jpg'

TAX_FROM_DAY = {
    1: 20,
    2: 20,
    3: 20,
    4: 20,
    5: 20,
    6: 20,
    7: 20,
    8: 20,
    9: 20,
    10: 20,
    11: 20,
    12: 20,
    13: 20,
    14: 20,
    15: 20,
    16: 20,
    17: 20,
    18: 20,
    19: 20,
    20: 20,
    21: 20
}
