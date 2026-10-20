import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.accounts.models import Role, RolePermission, User
from apps.academics.models import AcademicYear, Term, ClassLevel, Section, Subject, Enrollment
from apps.profiles.models import StudentProfile, TeacherProfile, ParentProfile, StudentParent
from apps.timetable.models import Timetable
from apps.attendance.models import Attendance
from apps.exams.models import ExamType, Mark
from apps.finance.models import FeeType, FeeStructure, StudentInvoice, Payment
from apps.analytics.models import AIStudentNote


class Command(BaseCommand):
    help = 'Seeds initial test data into the Smart School Management System database'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        # 1. Create Roles
        roles_data = [
            ('super_admin', 'Super Administrator with full global rights'),
            ('school_admin', 'School Administrator managing day-to-day operations'),
            ('teacher', 'Teacher with grading, attendance, and timetable rights'),
            ('accountant', 'Financial Officer managing billing and collections'),
            ('parent', 'Parent or Legal Guardian tracking children'),
            ('student', 'Student viewing schedule, grades, and notices'),
        ]
        role_objs = {}
        for name, desc in roles_data:
            role, _ = Role.objects.get_or_create(name=name, defaults={'description': desc})
            role_objs[name] = role

        # 2. Base Admin User
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@smartschool.edu',
                'role': role_objs['super_admin'],
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin_user.set_password('Admin123!')
            admin_user.save()
            self.stdout.write("Created default super_admin (admin / Admin123!)")

        # 3. Academic Year & Terms
        ay, _ = AcademicYear.objects.get_or_create(
            name='2024-2025',
            defaults={
                'start_date': datetime.date(2024, 9, 1),
                'end_date': datetime.date(2025, 6, 30),
                'is_active': True,
            }
        )
        term1, _ = Term.objects.get_or_create(
            academic_year=ay,
            name='Term 1 (Fall)',
            defaults={
                'start_date': datetime.date(2024, 9, 1),
                'end_date': datetime.date(2024, 12, 20),
            }
        )
        term2, _ = Term.objects.get_or_create(
            academic_year=ay,
            name='Term 2 (Spring)',
            defaults={
                'start_date': datetime.date(2025, 1, 10),
                'end_date': datetime.date(2025, 6, 30),
            }
        )

        # 4. Class Levels & Sections
        grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5']
        class_level_objs = []
        for g in grades:
            cl, _ = ClassLevel.objects.get_or_create(name=g)
            class_level_objs.append(cl)

        section_objs = []
        for cl in class_level_objs:
            s1, _ = Section.objects.get_or_create(class_level=cl, name='Section A', defaults={'capacity': 30})
            s2, _ = Section.objects.get_or_create(class_level=cl, name='Section B', defaults={'capacity': 30})
            section_objs.extend([s1, s2])

        # 5. Subjects
        subjects_data = [
            ('Mathematics', 'MATH-101'),
            ('Science', 'SCI-101'),
            ('English Language', 'ENG-101'),
            ('Arabic Language', 'ARB-101'),
            ('Social Studies', 'SOC-101'),
            ('Computer Science', 'CS-101'),
        ]
        subject_objs = []
        for name, code in subjects_data:
            subj, _ = Subject.objects.get_or_create(code=code, defaults={'name': name})
            subject_objs.append(subj)

        # 6. Teachers
        teachers_data = [
            ('teacher_ahmad', 'ahmad@smartschool.edu', 'Ahmad', 'Al-Mansoor'),
            ('teacher_fatima', 'fatima@smartschool.edu', 'Fatima', 'Al-Zahra'),
            ('teacher_john', 'john.smith@smartschool.edu', 'John', 'Smith'),
        ]
        teacher_profile_objs = []
        for username, email, first, last in teachers_data:
            t_user, c = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'role': role_objs['teacher'],
                    'is_active': True,
                }
            )
            if c:
                t_user.set_password('Teacher123!')
                t_user.save()
            tp, _ = TeacherProfile.objects.get_or_create(
                user=t_user,
                defaults={'first_name': first, 'last_name': last, 'hire_date': datetime.date(2022, 8, 15)}
            )
            teacher_profile_objs.append(tp)

        # 7. Parent & Students
        p_user, c = User.objects.get_or_create(
            username='parent_khalid',
            defaults={
                'email': 'khalid@parent.com',
                'role': role_objs['parent'],
                'is_active': True,
            }
        )
        if c:
            p_user.set_password('Parent123!')
            p_user.save()
        parent_prof, _ = ParentProfile.objects.get_or_create(
            user=p_user,
            defaults={'first_name': 'Khalid', 'last_name': 'Al-Sabah', 'phone_number': '+966-555-123456'}
        )

        students_data = [
            ('student_omar', 'omar@student.com', 'Omar', 'Al-Sabah', 'Male', 'O+'),
            ('student_layla', 'layla@student.com', 'Layla', 'Al-Sabah', 'Female', 'A+'),
            ('student_yousef', 'yousef@student.com', 'Yousef', 'Al-Ghamdi', 'Male', 'B+'),
            ('student_sara', 'sara@student.com', 'Sara', 'Al-Otaibi', 'Female', 'O-'),
            ('student_tariq', 'tariq@student.com', 'Tariq', 'Hassan', 'Male', 'AB+'),
        ]
        student_profile_objs = []
        for i, (uname, email, first, last, gender, blood) in enumerate(students_data):
            s_user, c = User.objects.get_or_create(
                username=uname,
                defaults={
                    'email': email,
                    'role': role_objs['student'],
                    'is_active': True,
                }
            )
            if c:
                s_user.set_password('Student123!')
                s_user.save()
            sp, _ = StudentProfile.objects.get_or_create(
                user=s_user,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'gender': gender,
                    'blood_type': blood,
                    'date_of_birth': datetime.date(2014, 5, 10 + i),
                    'enrollment_date': datetime.date(2024, 9, 1),
                    'national_id': f'109876543{i}',
                    'address': 'King Fahd Road, Riyadh',
                    'phone_number': f'+966-500-00000{i}',
                }
            )
            student_profile_objs.append(sp)

            # Link Omar and Layla to Khalid
            if i in (0, 1):
                StudentParent.objects.get_or_create(student=sp, parent=parent_prof)

            # Enroll in section
            target_sec = section_objs[i % len(section_objs)]
            Enrollment.objects.get_or_create(student=sp, academic_year=ay, defaults={'section': target_sec})

        # 8. Timetable
        sec_a = section_objs[0]  # Grade 1 Section A
        t1, _ = Timetable.objects.get_or_create(
            section=sec_a,
            subject=subject_objs[0],  # Math
            teacher=teacher_profile_objs[0],
            day_of_week='Sunday',
            start_time=datetime.time(8, 0),
            end_time=datetime.time(8, 45),
            defaults={'classroom': 'Room 101'}
        )
        t2, _ = Timetable.objects.get_or_create(
            section=sec_a,
            subject=subject_objs[1],  # Science
            teacher=teacher_profile_objs[1],
            day_of_week='Sunday',
            start_time=datetime.time(8, 50),
            end_time=datetime.time(9, 35),
            defaults={'classroom': 'Lab 1'}
        )
        t3, _ = Timetable.objects.get_or_create(
            section=sec_a,
            subject=subject_objs[2],  # English
            teacher=teacher_profile_objs[2],
            day_of_week='Sunday',
            start_time=datetime.time(9, 50),
            end_time=datetime.time(10, 35),
            defaults={'classroom': 'Room 101'}
        )

        # 9. Attendance
        today = timezone.now().date()
        for i, sp in enumerate(student_profile_objs[:3]):
            status_val = 'Present' if i != 2 else 'Late'
            Attendance.objects.get_or_create(
                student=sp,
                timetable=t1,
                date=today,
                defaults={'status': status_val, 'remarks': 'On time' if status_val == 'Present' else 'Traffic delay'}
            )

        # 10. Exam Types & Marks
        midterm, _ = ExamType.objects.get_or_create(name='Midterm Exam', defaults={'weight_percentage': 40.0})
        final_exam, _ = ExamType.objects.get_or_create(name='Final Exam', defaults={'weight_percentage': 60.0})

        for i, sp in enumerate(student_profile_objs):
            score_val = 85.0 + (i * 2.5) if i != 4 else 52.0  # Tariq has lower score for alert testing
            Mark.objects.get_or_create(
                student=sp,
                subject=subject_objs[0],
                exam_type=midterm,
                term=term1,
                defaults={'score': score_val, 'max_score': 100.0}
            )

        # 11. Fees, Invoices & Payments
        ft_tuition, _ = FeeType.objects.get_or_create(name='Tuition Fee', defaults={'description': 'Annual tuition charges'})
        ft_bus, _ = FeeType.objects.get_or_create(name='Transportation', defaults={'description': 'School bus service'})

        fs_tuition, _ = FeeStructure.objects.get_or_create(
            fee_type=ft_tuition,
            class_level=class_level_objs[0],
            academic_year=ay,
            defaults={'amount': 5000.0}
        )

        for i, sp in enumerate(student_profile_objs[:3]):
            inv, created = StudentInvoice.objects.get_or_create(
                student=sp,
                fee_structure=fs_tuition,
                defaults={
                    'issue_date': datetime.date(2024, 9, 1),
                    'due_date': datetime.date(2024, 10, 15),
                    'amount_due': 5000.0,
                    'status': 'UNPAID',
                }
            )
            if created and i == 0:
                Payment.objects.create(
                    invoice=inv,
                    amount_paid=5000.0,
                    payment_method='Credit Card',
                    transaction_id='TXN-998811'
                )
            elif created and i == 1:
                Payment.objects.create(
                    invoice=inv,
                    amount_paid=2500.0,
                    payment_method='Bank Transfer',
                    transaction_id='TXN-445522'
                )

        # 12. AI Student Notes
        AIStudentNote.objects.get_or_create(
            student=student_profile_objs[4],  # Tariq
            defaults={
                'note_content': 'Academic Alert for Tariq Hassan: Midterm Exam score in Mathematics is 52.0% (below 60% threshold). Recommended Action: Teacher follow-up and tutoring.',
                'insights_json': {'subject': 'Mathematics', 'score': 52.0, 'threshold': 60.0},
                'requires_intervention': True,
            }
        )
        AIStudentNote.objects.get_or_create(
            student=student_profile_objs[0],  # Omar
            defaults={
                'note_content': 'Satisfactory Performance: Omar Al-Sabah maintains an excellent grade of 85.0% and 100% attendance.',
                'insights_json': {'attendance': 100.0, 'score': 85.0},
                'requires_intervention': False,
            }
        )

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
