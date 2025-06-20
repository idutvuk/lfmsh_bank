# coding=utf-8
__author__ = 'nkorobkov'

from django.contrib.auth import get_user_model; User = get_user_model()

for u in User.objects.filter(groups__name='student'):

  a = u.account
  g = a.party
  c = a.grade
  a.party = c
  a.grade = g
  a.save()
  u.save()
