from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.accounts.views import LoginView, MeView, RoleViewSet, UserViewSet, RolePermissionViewSet
from apps.academics.views import (
    AcademicYearViewSet, TermViewSet, ClassLevelViewSet,
    SectionViewSet, SubjectViewSet, EnrollmentViewSet
)
from apps.profiles.views import (
    StudentProfileViewSet, TeacherProfileViewSet,
    ParentProfileViewSet, StudentParentViewSet
)
from apps.timetable.views import TimetableViewSet
from apps.attendance.views import AttendanceViewSet
from apps.exams.views import ExamTypeViewSet, MarkViewSet
from apps.finance.views import (
    FeeTypeViewSet, FeeStructureViewSet,
    StudentInvoiceViewSet, PaymentViewSet
)
from apps.analytics.views import AnalyticsViewSet

router = DefaultRouter()
# Accounts & Identity
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'role-permissions', RolePermissionViewSet, basename='role-permission')
router.register(r'users', UserViewSet, basename='user')

# Academics
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'terms', TermViewSet, basename='term')
router.register(r'class-levels', ClassLevelViewSet, basename='class-level')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')

# Profiles & Directory
router.register(r'students', StudentProfileViewSet, basename='student')
router.register(r'teachers', TeacherProfileViewSet, basename='teacher')
router.register(r'parents', ParentProfileViewSet, basename='parent')
router.register(r'student-parents', StudentParentViewSet, basename='student-parent')

# Operations
router.register(r'timetables', TimetableViewSet, basename='timetable')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'exam-types', ExamTypeViewSet, basename='exam-type')
router.register(r'marks', MarkViewSet, basename='mark')

# Finance
router.register(r'fee-types', FeeTypeViewSet, basename='fee-type')
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'invoices', StudentInvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')

# Analytics & AI Notes
router.register(r'analytics/notes', AnalyticsViewSet, basename='analytics-notes')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/login/', LoginView.as_view(), name='api-login'),
    path('api/v1/auth/me/', MeView.as_view(), name='api-me'),
    path('api/v1/', include(router.urls)),
]
