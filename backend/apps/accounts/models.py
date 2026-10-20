from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import check_password as django_check_password, make_password
from .hashers import RawArgon2PasswordHasher

hasher = RawArgon2PasswordHasher()


class Role(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    id = models.AutoField(primary_key=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, db_column='role_id', related_name='permissions')
    resource_name = models.CharField(max_length=100)
    can_create = models.BooleanField(default=False)
    can_read = models.BooleanField(default=False)
    can_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        db_table = 'role_permissions'
        unique_together = (('role', 'resource_name'),)
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'

    def __str__(self):
        return f"{self.role.name} - {self.resource_name}"


class CustomUserManager(models.Manager):
    def create_user(self, username, email, password=None, role=None, **extra_fields):
        if not username:
            raise ValueError('The Username is required')
        if not email:
            raise ValueError('The Email is required')
        user = self.model(username=username, email=email, role=role, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        admin_role, _ = Role.objects.get_or_create(
            name='Admin',
            defaults={'description': 'System Administrator'}
        )
        return self.create_user(username, email, password, role=admin_role, **extra_fields)


class User(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255, db_column='hashed_password')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, db_column='role_id', related_name='users')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_superuser(self):
        return bool(self.role and self.role.name.lower() in ('admin', 'super_admin'))

    @property
    def is_staff(self):
        return bool(self.role and self.role.name.lower() in ('admin', 'super_admin', 'school_admin'))

    def set_password(self, raw_password):
        self.password = hasher.encode(raw_password)

    def check_password(self, raw_password):
        if not self.password:
            return False
        # Try custom RawArgon2PasswordHasher first
        if hasher.verify(raw_password, self.password):
            return True
        # Try django default check_password
        return django_check_password(raw_password, self.password)

    def get_username(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No Role'})"
