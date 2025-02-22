import csv
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.conf import settings
from django.db import IntegrityError

from bank.models.Account import Account
from bank.helper_functions import generate_password
from transliterate import translit


class Command(BaseCommand):
    help = "Merge users from CSV into DB with individual conflict resolving if users don't match."

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            required=True,
            help='Relative path (from STATIC_DATA_PATH) to the CSV file (e.g., "staff.csv" or "student.csv").'
        )
        parser.add_argument(
            '--group',
            type=str,
            required=True,
            help='User group to assign the imported users (e.g., "staff" or "student").'
        )

    def handle(self, *args, **options):
        csv_relative_path = options['csv']
        group_name = options['group']
        static_data_path = os.path.join(settings.BASE_DIR, 'meta_files', 'users_data')

        csv_full_path = os.path.join(static_data_path, csv_relative_path)
        if not os.path.exists(csv_full_path):
            self.stdout.write(self.style.ERROR(f"CSV file not found at {csv_full_path}"))
            return

        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Group '{group_name}' does not exist."))
            return

        with open(csv_full_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                # Skip empty rows.
                if not row or len(row) < 2:
                    continue

                # Expected CSV format: last_name, first_name, [middle_name], [party], [grade]
                last_name = row[0].strip()
                first_name = row[1].strip()
                middle_name = row[2].strip() if len(row) > 2 else ''
                party = int(row[3].strip()) if len(row) > 3 and row[3].strip().isdigit() else 0
                grade = int(row[4].strip()) if len(row) > 4 and row[4].strip().isdigit() else 0

                login = self.generate_login(first_name, last_name, middle_name)
                password = generate_password(8)

                try:
                    user = User.objects.get(username=login)
                    updated = False
                    # Compare and resolve differences for User fields.
                    if user.first_name != first_name:
                        self.stdout.write(f"[Conflict] User '{login}': first_name DB='{user.first_name}' vs CSV='{first_name}'")
                        if self.confirm_update(f"Update first_name for '{login}'?"):
                            user.first_name = first_name
                            updated = True

                    if user.last_name != last_name:
                        self.stdout.write(f"[Conflict] User '{login}': last_name DB='{user.last_name}' vs CSV='{last_name}'")
                        if self.confirm_update(f"Update last_name for '{login}'?"):
                            user.last_name = last_name
                            updated = True

                    # Compare and resolve differences for Account fields.
                    account = user.account
                    if account.middle_name != middle_name:
                        self.stdout.write(f"[Conflict] User '{login}': middle_name DB='{account.middle_name}' vs CSV='{middle_name}'")
                        if self.confirm_update(f"Update middle_name for '{login}'?"):
                            account.middle_name = middle_name
                            updated = True

                    if account.party != party:
                        self.stdout.write(f"[Conflict] User '{login}': party DB='{account.party}' vs CSV='{party}'")
                        if self.confirm_update(f"Update party for '{login}'?"):
                            account.party = party
                            updated = True

                    if account.grade != grade:
                        self.stdout.write(f"[Conflict] User '{login}': grade DB='{account.grade}' vs CSV='{grade}'")
                        if self.confirm_update(f"Update grade for '{login}'?"):
                            account.grade = grade
                            updated = True

                    if updated:
                        user.save()
                        account.save()
                        self.stdout.write(self.style.SUCCESS(f"User '{login}' updated."))
                    else:
                        self.stdout.write(f"User '{login}' exists and matches CSV data.")

                except User.DoesNotExist:
                    # Create new user if not exists.
                    try:
                        user = User.objects.create_user(username=login, first_name=first_name, last_name=last_name, password=password)
                        group.user_set.add(user)
                        account = Account(user=user, middle_name=middle_name, party=party, grade=grade)
                        account.save()
                        self.stdout.write(self.style.SUCCESS(f"Created user '{login}' with password: {password}"))
                    except IntegrityError as e:
                        self.stdout.write(self.style.ERROR(f"Failed to create user '{login}': {e}"))

    def generate_login(self, first_name, last_name, middle_name=''):
        """
        Generate a login using the same logic as in the original add_users command.
        """
        middle_name_repr = ('.' + translit(middle_name[0], 'ru', reversed=True).lower() + '.') if middle_name else ''
        first_name_processed = ''.join(filter(str.isalpha, translit(first_name, 'ru', reversed=True))).lower()
        last_name_processed = ''.join(filter(str.isalpha, translit(last_name, 'ru', reversed=True))).lower()
        return last_name_processed + middle_name_repr + first_name_processed

    def confirm_update(self, prompt):
        """
        Prompt the admin for conflict resolution.
        """
        answer = input(f"{prompt} (yes/no): ")
        return answer.strip().lower() == 'yes'
