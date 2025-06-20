import itertools
from django.contrib.auth.models import AbstractUser
from django.db import models
from bank.constants import SIGN, SEM_NOT_READ_PEN, AttendanceTypeEnum, LAB_PENALTY, \
    STEP_OBL_STD, INITIAL_STEP_OBL_STD, LAB_PASS_NEEDED, LAB_PASS_NEEDED_EQUATOR, \
    OBL_STUDY_NEEDED, OBL_STUDY_NEEDED_EQUATOR, FAC_PASS_NEEDED, FAC_PENALTY, \
    LECTURE_PENALTY_STEP, LECTURE_PENALTY_INITIAL


class Account(AbstractUser):
  balance = models.FloatField(default=0)
  middle_name = models.CharField(max_length=40, default='Not stated')
  party = models.IntegerField(default=0)
  grade = models.IntegerField(blank=True, default=0)
  
  def get_counter(self, counter_name):
    return int(sum([
        a.value for a in self.received_attendance.filter(
            type__name=counter_name, counted=True
        )
    ]))

  def __str__(self):
    return f"{self.short_name()} {self.get_balance()}" if self.balance else self.short_name()

  def name_with_balance(self):
    return f"{self.last_name} {self.first_name} {self.get_balance()}"

  def long_name(self):
    return f"{self.last_name} {self.first_name}"

  def short_name(self):
    if self.first_name and self.middle_name:
      return f"{self.last_name} {self.first_name[0]}. {self.middle_name[0]}."
    return self.last_name

  def get_balance(self):
    return f"{int(self.balance) if abs(self.balance) > 9.99 else round(self.balance, 1)}{SIGN}"

  def get_all_money(self):
    transactions = list(self.received_money.all()) + list(
      itertools.chain(*[list(t.related_money_atomics.all()) for t in self.created_transactions.all()])
    )
    transactions.sort(key=lambda t: t.creation_timestamp)
    return transactions

  def get_final_study_fine(self):
    return sum([
      self.get_sem_fine(),
      self.get_obl_study_fine(),
      self.get_lab_fine(),
      self.get_fac_fine(),
    ])

  def get_equator_study_fine(self):
    return self.get_obl_study_fine_equator() + self.get_lab_fine_equator()

  def get_sem_fine(self):
    return SEM_NOT_READ_PEN * max(0, 1 - self.get_counter(AttendanceTypeEnum.seminar_pass.value))

  def get_lab_fine(self):
    return max(0, self.lab_needed() - self.get_counter(AttendanceTypeEnum.lab_pass.value)) * LAB_PENALTY
    
  def get_lab_fine_equator(self):
    return max(0, (LAB_PASS_NEEDED_EQUATOR - int(
      self.get_counter(AttendanceTypeEnum.lab_pass.value)))) * LAB_PENALTY

  def get_obl_study_fine(self):
    deficit = max(0, (OBL_STUDY_NEEDED - int(
      self.get_counter(AttendanceTypeEnum.seminar_attend.value) +
      self.get_counter(AttendanceTypeEnum.fac_attend.value))))
    single_fine = INITIAL_STEP_OBL_STD
    fine = 0
    for _ in range(deficit):
      fine += single_fine
      single_fine += STEP_OBL_STD
    return fine

  def get_obl_study_fine_equator(self):
    deficit = max(0, (OBL_STUDY_NEEDED_EQUATOR - int(
      self.get_counter(AttendanceTypeEnum.seminar_attend.value) +
      self.get_counter(AttendanceTypeEnum.fac_attend.value))))
    single_fine = INITIAL_STEP_OBL_STD
    fine = 0
    for _ in range(deficit):
      fine += single_fine
      single_fine += STEP_OBL_STD
    return fine

  def get_fac_fine(self):
    return max(0, (self.fac_needed() - int(
        self.get_counter(AttendanceTypeEnum.fac_pass.value)))) * FAC_PENALTY

  def lab_needed(self):
    return LAB_PASS_NEEDED[self.grade]

  def fac_needed(self):
    return FAC_PASS_NEEDED[self.grade]

  def get_next_missed_lec_penalty(self):
    return (self.get_counter(AttendanceTypeEnum.lecture_miss.value)
           ) * LECTURE_PENALTY_STEP + LECTURE_PENALTY_INITIAL

  def full_info_as_list(self):
    return [
      self.first_name, self.last_name, self.middle_name,
      self.username, self.party, self.grade, self.balance
    ]

  def full_info_as_map(self, with_balance=True):
    m = {
      'first_name': self.first_name,
      'last_name': self.last_name,
      'middle_name': self.middle_name,
      'username': self.username,
      'party': self.party,
      'grade': self.grade,
    }
    if with_balance:
      m['balance'] = self.balance
    return m

  def full_info_headers_as_list(self):
    return [
        'first_name', 'last_name', 'middle_name', 'username', 'party', 'grade',
        'balance'
    ]
    
