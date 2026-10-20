import os, sys, datetime
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(__file__))
import django
django.setup()
from apps.academics.models import AcademicYear, Term, Subject
from apps.profiles.models import StudentProfile
from apps.exams.models import ExamType, Mark

ay = AcademicYear.objects.filter(is_active=True).first() or AcademicYear.objects.first()
t1, _ = Term.objects.get_or_create(
    academic_year=ay,
    name='First Semester (Term 1)',
    defaults={
        'start_date': datetime.date(2026, 9, 1),
        'end_date': datetime.date(2027, 1, 15)
    }
)
t2, _ = Term.objects.get_or_create(
    academic_year=ay,
    name='Second Semester (Term 2)',
    defaults={
        'start_date': datetime.date(2027, 1, 16),
        'end_date': datetime.date(2027, 6, 15)
    }
)

midterm, _ = ExamType.objects.get_or_create(
    name='Midterm Assessment',
    defaults={'weight_percentage': 30.0}
)
final, _ = ExamType.objects.get_or_create(
    name='Final Examination',
    defaults={'weight_percentage': 50.0}
)
quiz, _ = ExamType.objects.get_or_create(
    name='Continuous Assessment & Quizzes',
    defaults={'weight_percentage': 20.0}
)

# Additional Subjects if only Math exists
phys, _ = Subject.objects.get_or_create(name='Physics', defaults={'code': 'PHYS101'})
eng, _ = Subject.objects.get_or_create(name='English Literature', defaults={'code': 'ENG101'})

subjects = [Subject.objects.get(name='Mathematics'), phys, eng]
students = list(StudentProfile.objects.all())

scores = {
    1: {'Mathematics': (88.5, 92.0), 'Physics': (85.0, 90.0), 'English Literature': (92.0, 95.0)},
    2: {'Mathematics': (74.0, 78.5), 'Physics': (71.0, 75.0), 'English Literature': (80.0, 84.0)},
    3: {'Mathematics': (62.0, 65.5), 'Physics': (59.0, 63.0), 'English Literature': (70.0, 72.0)},
    4: {'Mathematics': (96.0, 98.0), 'Physics': (94.0, 97.0), 'English Literature': (95.0, 99.0)},
    5: {'Mathematics': (81.0, 84.0), 'Physics': (83.0, 86.0), 'English Literature': (88.0, 90.0)},
}

created_count = 0
for student in students:
    st_scores = scores.get(student.id, {'Mathematics': (80.0, 85.0)})
    for subj in subjects:
        if subj.name in st_scores:
            m_score, f_score = st_scores[subj.name]
            # Midterm mark
            Mark.objects.get_or_create(
                student=student,
                subject=subj,
                exam_type=midterm,
                term=t1,
                defaults={'score': m_score}
            )
            # Final mark
            Mark.objects.get_or_create(
                student=student,
                subject=subj,
                exam_type=final,
                term=t1,
                defaults={'score': f_score}
            )
            created_count += 2

print(f'Seeded successfully: {ExamType.objects.count()} exam types, {Term.objects.count()} terms, {Mark.objects.count()} marks.')
