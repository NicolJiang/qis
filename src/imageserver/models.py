#
# Quru Image Server
#
# Document:      models.py
# Date started:  08 Aug 2011
# By:            Matt Fozard
# Purpose:       Image server SQLAlchemy-based database models
# Requires:      Flask, SQLAlchemy
# Copyright:     Quru Ltd (www.quru.com)
# Licence:
#
#   This program is free software: you can redistribute it and/or modify
#   it under the terms of the GNU Affero General Public License as published
#   by the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.
#
#   This program is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU Affero General Public License for more details.
#
#   You should have received a copy of the GNU Affero General Public License
#   along with this program.  If not, see http://www.gnu.org/licenses/
#
# Last Changed:  $Date$ $Rev$ by $Author$
#
# Notable modifications:
# Date       By    Details
# =========  ====  ============================================================
# 19Mar2015  Matt  Added DatabaseModel base class
# 03Sep2015  Matt  Change classes to SQLAlchemy declarative syntax
# 28Feb2018  Matt  Add portfolios models
#

import locale
import os.path
import uuid
from datetime import datetime

from sqlalchemy import func
from sqlalchemy import ForeignKey
from sqlalchemy import BigInteger, Boolean, Column, DateTime, Float, Index
from sqlalchemy import Integer, LargeBinary, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import backref, relationship
from werkzeug.security import generate_password_hash, check_password_hash

Base = declarative_base()
CacheBase = declarative_base()


class BaseMixin(object):
    """
    Base mixin for all our database models.
    """
    def __str__(self):
        return self.__class__.__name__


class IDEqualityMixin(object):
    """
    Helper class to provide __eq__, __ne__, and __hash__ functionality
    for any class defining a unique 'id' attribute.
    """
    def __eq__(self, other):
        if isinstance(other, type(self)):
            return self.id == other.id if self.id > 0 else object.__eq__(self, other)
        return False

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return self.id if self.id > 0 else object.__hash__(self)


class CacheEntry(CacheBase, BaseMixin):
    """
    SQLAlchemy ORM wrapper for an entry in the image cache control database.
    """
    key = Column(String(256), nullable=False, primary_key=True)
    valuesize = Column(BigInteger, nullable=False)
    searchfield1 = Column(BigInteger, nullable=True)
    searchfield2 = Column(BigInteger, nullable=True)
    searchfield3 = Column(BigInteger, nullable=True)
    searchfield4 = Column(BigInteger, nullable=True)
    searchfield5 = Column(BigInteger, nullable=True)
    extradata = Column(LargeBinary, nullable=True)

    __tablename__ = 'cachectl'
    __table_args__ = (
        Index('idx_cc_search', searchfield1, searchfield2),
    )

    def __init__(self, key, valuesize, searchfield1=None, searchfield2=None,
                 searchfield3=None, searchfield4=None, searchfield5=None, extradata=None):
        self.key = key
        self.valuesize = valuesize
        self.searchfield1 = searchfield1
        self.searchfield2 = searchfield2
        self.searchfield3 = searchfield3
        self.searchfield4 = searchfield4
        self.searchfield5 = searchfield5
        self.extradata = extradata


class User(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a basic user record.
    """
    AUTH_TYPE_PASSWORD = 1
    AUTH_TYPE_LDAP = 2

    STATUS_DELETED = 0
    STATUS_ACTIVE = 1

    id = Column(Integer, nullable=False, autoincrement=True, primary_key=True)
    first_name = Column(String(120), nullable=False)
    last_name = Column(String(120), nullable=False)
    email = Column(String(120), nullable=False)
    username = Column(String(120), nullable=False)
    password = Column(String(120), nullable=False)
    auth_type = Column(Integer, nullable=False)
    allow_api = Column(Boolean, nullable=False)
    status = Column(Integer, nullable=False)

    groups = relationship(
        'Group',
        secondary=lambda: UserGroup.__table__,
        order_by=lambda: Group.name
    )

    __tablename__ = 'users'
    __table_args__ = (
        Index('idx_us_username', func.lower(username), unique=True),
    )

    def __init__(self, first_name, last_name, email, username, password,
                 auth_type, allow_api, status):
        self.id = None
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.username = username
        self.set_password(password)
        self.auth_type = auth_type
        self.allow_api = allow_api
        self.status = status

    def __str__(self):
        return self.get_full_name()

    def set_password(self, pwd):
        self.password = generate_password_hash(pwd, 'sha1') if pwd else ''

    def check_password(self, pwd):
        return check_password_hash(self.password, pwd)

    def get_full_name(self):
        fname = ' '.join((self.first_name, self.last_name)).strip()
        if not fname:
            fname = self.username
        return fname


class Group(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a group record.
    """
    ID_PUBLIC = 1
    ID_EVERYONE = 2
    ID_ADMINS = 3

    GROUP_TYPE_SYSTEM = 1
    GROUP_TYPE_LOCAL = 2
    GROUP_TYPE_LDAP = 3

    id = Column(Integer, nullable=False, autoincrement=True, primary_key=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    group_type = Column(Integer, nullable=False)

    users = relationship(
        'User',
        secondary=lambda: UserGroup.__table__,
        order_by=lambda: User.username
    )
    permissions = relationship(
        'SystemPermissions',
        lazy='joined',
        uselist=False,
        cascade='all, delete-orphan'
    )
    folder_permissions = relationship(
        'FolderPermission',
        cascade='all, delete-orphan'
    )
    folio_permissions = relationship(
        'FolioPermission',
        cascade='all, delete-orphan'
    )

    __tablename__ = 'groups'
    __table_args__ = (
        Index('idx_gp_name', name, unique=True),
    )

    def __init__(self, name, description, group_type):
        self.id = None
        self.name = name
        self.description = description
        self.group_type = group_type

    def __str__(self):
        return self.name


class UserGroup(Base, BaseMixin):
    """
    SQLAlchemy ORM wrapper for a user-group link record.
    This class is only used internally by SQLAlchemy - these records are
    normally maintained via the user.groups or group.users properties.
    """
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, primary_key=True)
    group_id = Column(Integer, ForeignKey('groups.id'), nullable=False, primary_key=True)

    __tablename__ = 'usergroups'


class SystemPermissions(Base, BaseMixin):
    """
    SQLAlchemy ORM wrapper for a system permissions record.
    These control access to global functions
    (all other permissions being based on the file-system/folder tree).
    """
    PERMIT_FOLIOS = 'folios'
    PERMIT_REPORTS = 'reports'
    PERMIT_ADMIN_USERS = 'admin_users'
    PERMIT_ADMIN_FILES = 'admin_files'
    PERMIT_ADMIN_FOLIOS = 'admin_folios'
    PERMIT_ADMIN_PERMISSIONS = 'admin_permissions'
    PERMIT_SUPER_USER = 'admin_all'

    group_id = Column(Integer, ForeignKey('groups.id'), nullable=False, unique=True, primary_key=True)
    folios = Column(Boolean, nullable=False)
    reports = Column(Boolean, nullable=False)
    admin_users = Column(Boolean, nullable=False)
    admin_files = Column(Boolean, nullable=False)
    admin_folios = Column(Boolean, nullable=False)
    admin_permissions = Column(Boolean, nullable=False)
    admin_all = Column(Boolean, nullable=False)

    group = relationship('Group')

    __tablename__ = 'syspermissions'

    def __init__(self, group, folios, reports, admin_users, admin_files,
                 admin_folios, admin_permissions, admin_all):
        self.group = group
        self.folios = folios
        self.reports = reports
        self.admin_users = admin_users
        self.admin_files = admin_files
        self.admin_folios = admin_folios
        self.admin_permissions = admin_permissions
        self.admin_all = admin_all

    def __str__(self):
        return 'SystemPermissions: Group ' + str(self.group_id)


class Folder(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a disk folder record.
    """
    STATUS_DELETED = 0
    STATUS_ACTIVE = 1

    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    name = Column(String(1024), nullable=False)
    path = Column(String(1024), nullable=False)
    parent_id = Column(BigInteger, ForeignKey('folders.id'), nullable=True)
    status = Column(Integer, nullable=False)

    children = relationship(
        'Folder',
        join_depth=1,
        backref=backref('parent', remote_side=lambda: Folder.id),
        order_by=lambda: Folder.name
    )

    __tablename__ = 'folders'
    __table_args__ = (
        Index('idx_fr_path', path, unique=True),
        Index('idx_fr_parent', parent_id),
    )

    def __init__(self, name, path, parent, status):
        self.id = None
        self.name = name
        self.path = path
        self.parent = parent
        self.status = status

    def __str__(self):
        return self.path

    def is_root(self):
        # Use path to avoid lazy load (rather than "parent is None")
        return self.path == '' or self.path == os.path.sep


class FolderPermission(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a folder permissions record.
    These specify the image access levels across the folder tree, by group.
    """
    ACCESS_NONE = 0
    ACCESS_VIEW = 10
    ACCESS_DOWNLOAD = 20
    ACCESS_EDIT = 30
    ACCESS_UPLOAD = 40
    ACCESS_DELETE = 50
    ACCESS_CREATE_FOLDER = 60
    ACCESS_DELETE_FOLDER = 70
    ACCESS_ALL = ACCESS_DELETE_FOLDER

    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    folder_id = Column(BigInteger, ForeignKey('folders.id'), nullable=False)
    group_id = Column(Integer, ForeignKey('groups.id'), nullable=False)
    access = Column(Integer, nullable=False)

    folder = relationship('Folder')
    group = relationship('Group')

    __tablename__ = 'folderpermissions'
    __table_args__ = (
        Index('idx_fp_pk', folder_id, group_id, unique=True),
    )

    def __init__(self, folder, group, access):
        self.id = None
        self.folder = folder
        self.group = group
        self.access = access

    def __str__(self):
        return 'FolderPermission: Folder %d + Group %d = %d' % (
            self.folder_id, self.group_id, self.access
        )


class Image(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for an image record.
    """
    STATUS_DELETED = 0
    STATUS_ACTIVE = 1

    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    src = Column(String(1024), nullable=False)
    folder_id = Column(BigInteger, ForeignKey('folders.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    status = Column(Integer, nullable=False)

    folder = relationship('Folder', lazy='joined')
    history = relationship(
        'ImageHistory',
        order_by=lambda: ImageHistory.id,
        cascade='all, delete-orphan'
    )

    __tablename__ = 'images'
    __table_args__ = (
        Index('idx_im_src', src, unique=True),
        Index('idx_im_folder', folder_id, status),
    )

    def __init__(self, src, folder, title, description, width, height, status):
        self.id = None
        self.src = src
        self.folder = folder
        self.title = title
        self.description = description
        self.width = width
        self.height = height
        self.status = status

    def __str__(self):
        return self.src + ' [' + str(self.width) + ',' + str(self.height) + ']'


class ImageTemplate(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for an image processing template.
    """
    id = Column(Integer, nullable=False, autoincrement=True, primary_key=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    template = Column(JSON, nullable=False)

    __tablename__ = 'imagetemplates'
    __table_args__ = (
        Index('idx_it_name', func.lower(name), unique=True),
    )

    def __init__(self, name, description, template_dict):
        self.id = None
        self.name = name
        self.description = description
        self.template = template_dict

    def __str__(self):
        return self.name


class ImageHistory(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for an image history (audit) record.
    """
    ACTION_DELETED = 0
    ACTION_CREATED = 1
    ACTION_REPLACED = 2
    ACTION_EDITED = 3
    ACTION_MOVED = 4

    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    image_id = Column(BigInteger, ForeignKey('images.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(Integer, nullable=False)
    action_info = Column(Text, nullable=False)
    action_time = Column(DateTime, nullable=False)

    image = relationship('Image')
    user = relationship('User', lazy='joined', innerjoin=False)

    __tablename__ = 'imagesaudit'
    __table_args__ = (
        Index('idx_ia_image_action', image_id, action, unique=False),
        Index('idx_ia_user', user_id, unique=False),
        Index('idx_ia_time', action_time, unique=False),
    )

    def __init__(self, image, user, action, action_info):
        self.id = None
        self.image = image
        self.user = user
        self.action = action
        self.action_info = action_info
        self.action_time = datetime.utcnow()

    def __str__(self):
        return 'Image ' + str(self.image_id) + ': Action ' + \
               str(self.action) + ' at ' + str(self.action_time)


class ImageStats(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for an image statistics record.
    """
    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    image_id = Column(BigInteger, ForeignKey('images.id'), nullable=False)
    requests = Column(BigInteger, nullable=False)
    views = Column(BigInteger, nullable=False)
    cached_views = Column(BigInteger, nullable=False)
    downloads = Column(BigInteger, nullable=False)
    total_bytes = Column(BigInteger, nullable=False)
    request_seconds = Column(Float, nullable=False)
    max_request_seconds = Column(Float, nullable=False)
    from_time = Column(DateTime, nullable=False)
    to_time = Column(DateTime, nullable=False)

    __tablename__ = 'imagestats'
    __table_args__ = (
        Index('idx_is_image', image_id, from_time, unique=False),
        Index('idx_is_time', from_time, unique=False),
    )

    def __init__(self, image_id, req_count, view_count, view_cached_count, download_count,
                 total_bytes, request_seconds, max_request_seconds, from_time, to_time):
        self.id = None
        self.image_id = image_id
        self.requests = req_count
        self.views = view_count
        self.cached_views = view_cached_count
        self.downloads = download_count
        self.total_bytes = total_bytes
        self.request_seconds = request_seconds
        self.max_request_seconds = max_request_seconds
        self.from_time = from_time
        self.to_time = to_time

    def __str__(self):
        return 'ImageStats: ' + str(self.image_id) + ' v=' + str(self.views) + \
               ', d=' + str(self.downloads) + ' at ' + str(self.to_time)


class SystemStats(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a system statistics record.
    """
    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    requests = Column(BigInteger, nullable=False)
    views = Column(BigInteger, nullable=False)
    cached_views = Column(BigInteger, nullable=False)
    downloads = Column(BigInteger, nullable=False)
    total_bytes = Column(BigInteger, nullable=False)
    request_seconds = Column(Float, nullable=False)
    max_request_seconds = Column(Float, nullable=False)
    cpu_pc = Column(Float, nullable=False)
    memory_pc = Column(Float, nullable=False)
    cache_pc = Column(Float, nullable=False)
    from_time = Column(DateTime, nullable=False)
    to_time = Column(DateTime, nullable=False)

    __tablename__ = 'systemstats'
    __table_args__ = (
        Index('idx_ss_time', from_time, unique=True),
    )

    def __init__(self, req_count, view_count, view_cached_count, download_count,
                 total_bytes, request_seconds, max_request_seconds,
                 cpu_percent, memory_percent, cache_percent,
                 from_time, to_time):
        self.id = None
        self.requests = req_count
        self.views = view_count
        self.cached_views = view_cached_count
        self.downloads = download_count
        self.total_bytes = total_bytes
        self.request_seconds = request_seconds
        self.max_request_seconds = max_request_seconds
        self.cpu_pc = cpu_percent
        self.memory_pc = memory_percent
        self.cache_pc = cache_percent
        self.from_time = from_time
        self.to_time = to_time

    def __str__(self):
        return 'SystemStats: To ' + str(self.to_time)


class Task(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a background task record.
    The model definition allows only one instance of a particular task
    (the combination of function name + parameters) to exist at once.
    """
    STATUS_PENDING = 0
    STATUS_ACTIVE = 1
    STATUS_COMPLETE = 2

    PRIORITY_HIGH = 10
    PRIORITY_NORMAL = 20
    PRIORITY_LOW = 30

    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    name = Column(String(100), nullable=False)
    funcname = Column(String(100), nullable=False)
    params = Column(LargeBinary, nullable=True)
    priority = Column(Integer, nullable=False)
    log_level = Column(String(8), nullable=False)
    error_log_level = Column(String(8), nullable=False)
    status = Column(Integer, nullable=False)
    result = Column(LargeBinary, nullable=True)
    lock_id = Column(String(50), nullable=True)
    keep_for = Column(Integer, nullable=False)
    keep_until = Column(DateTime, nullable=True)

    user = relationship('User', lazy='joined', innerjoin=False)

    __tablename__ = 'tasks'
    __table_args__ = (
        Index('idx_tk_function', funcname, params, unique=True),
    )

    def __init__(self, user, name, funcname, params, priority,
                 log_level, error_log_level, keep_for):
        self.id = None
        self.user = user
        self.name = name
        self.funcname = funcname
        self.params = params
        self.priority = priority
        self.log_level = log_level
        self.error_log_level = error_log_level
        self.status = Task.STATUS_PENDING
        self.result = None
        self.lock_id = None
        self.keep_for = keep_for
        self.keep_until = None

    def __str__(self):
        return 'Task: ' + self.name


class Property(Base, BaseMixin):
    """
    SQLAlchemy ORM wrapper for a simple key/value properties store.
    """
    CLUSTER_ID = 'cluster_id'
    DATABASE_MIGRATION_VERSION = 'db_migration_version'
    FOLDER_PERMISSION_VERSION = 'fp_version'
    FOLIO_PERMISSION_VERSION = 'foliop_version'
    IMAGE_TEMPLATES_VERSION = 'template_version'
    DEFAULT_TEMPLATE = 'pubimage_default_template'

    key = Column(String(50), nullable=False, unique=True, primary_key=True)
    value = Column(Text, nullable=True)

    __tablename__ = 'properties'

    def __init__(self, key, value):
        self.key = key
        self.value = value

    def __str__(self):
        return 'Property: ' + self.key + '=' + str(self.value)


class Folio(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a portfolio header record.
    """
    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    human_id = Column(String(64), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    last_updated = Column(DateTime, nullable=False)

    owner = relationship(
        'User',
        lazy='joined'
    )
    images = relationship(
        'FolioImage',
        order_by='FolioImage.order_num, FolioImage.id',
        cascade='all, delete-orphan'
    )
    permissions = relationship(
        'FolioPermission',
        lazy='joined',
        cascade='all, delete-orphan'
    )
    history = relationship(
        'FolioHistory',
        order_by='FolioHistory.id',
        cascade='all, delete-orphan'
    )
    downloads = relationship(
        'FolioExport',
        lazy='joined',
        cascade='all, delete-orphan'
    )

    __tablename__ = 'folios'
    __table_args__ = (
        Index('idx_folio_hid', human_id, unique=True),
        Index('idx_folio_owner', owner_id),
    )

    def __init__(self, human_id, name, description, owner):
        self.id = None
        self.human_id = human_id
        self.name = name
        self.description = description
        self.owner = owner
        self.last_updated = datetime.utcnow()

    def __str__(self):
        return 'Portfolio: ' + self.human_id

    @staticmethod
    def create_human_id():
        """
        Returns a probably-unique "short URL" type string.
        """
        BASE58 = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
        LEN_BASE58 = len(BASE58)
        uid = uuid.uuid1().int >> 64
        hid = ''
        while uid >= LEN_BASE58:
            div, mod = divmod(uid, LEN_BASE58)
            hid = BASE58[mod] + hid
            uid = int(div)
        return BASE58[uid] + hid


class FolioImage(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a portfolio image record.
    """
    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    folio_id = Column(BigInteger, ForeignKey('folios.id'), nullable=False)
    image_id = Column(BigInteger, ForeignKey('images.id'), nullable=False)
    parameters = Column(JSON, nullable=False)
    filename = Column(String(255), nullable=False)
    order_num = Column(Integer, nullable=False)

    portfolio = relationship('Folio')
    image = relationship('Image', lazy='joined')

    __tablename__ = 'folioimages'
    __table_args__ = (
        Index('idx_folimg_pk', folio_id, image_id, unique=True),
    )

    def __init__(self, portfolio, image, image_params_dict=None, image_filename='', order_num=0):
        self.id = None
        self.portfolio = portfolio
        self.image = image
        self.parameters = image_params_dict or {}
        self.filename = image_filename
        self.order_num = order_num

    def __str__(self):
        return 'PortfolioImage: Portfolio %d + Image %d' % (
            self.folio_id, self.image_id
        )


class FolioPermission(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a portfolio permission record.
    """
    ACCESS_NONE = 0
    ACCESS_VIEW = 10
    ACCESS_DOWNLOAD = 20
    ACCESS_EDIT = 30
    ACCESS_DELETE = 50  # To match FolderPermission
    ACCESS_ALL = ACCESS_DELETE

    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    folio_id = Column(BigInteger, ForeignKey('folios.id'), nullable=False)
    group_id = Column(Integer, ForeignKey('groups.id'), nullable=False)
    access = Column(Integer, nullable=False)

    portfolio = relationship('Folio')
    group = relationship('Group')

    __tablename__ = 'foliopermissions'
    __table_args__ = (
        Index('idx_folperm_pk', folio_id, group_id, unique=True),
    )

    def __init__(self, portfolio, group, access):
        self.id = None
        self.portfolio = portfolio
        self.group = group
        self.access = access

    def __str__(self):
        return 'PortfolioPermission: Portfolio %d + Group %d = %d' % (
            self.folio_id, self.group_id, self.access
        )


class FolioHistory(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a portfolio history (audit) record.
    """
    ACTION_CREATED = 1
    ACTION_EDITED = 2
    ACTION_IMAGE_CHANGE = 3
    ACTION_PUBLISHED = 4
    ACTION_DOWNLOADED = 5
    ACTION_UNPUBLISHED = 6

    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    folio_id = Column(BigInteger, ForeignKey('folios.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(Integer, nullable=False)
    action_info = Column(Text, nullable=False)
    action_time = Column(DateTime, nullable=False)

    portfolio = relationship('Folio')
    user = relationship('User', lazy='joined', innerjoin=False)

    __tablename__ = 'foliosaudit'
    __table_args__ = (
        Index('idx_fola_folio_action', folio_id, action, unique=False),
        Index('idx_fola_user', user_id, unique=False),
        Index('idx_fola_time', action_time, unique=False),
    )

    def __init__(self, portfolio, user, action, action_info):
        self.id = None
        self.portfolio = portfolio
        self.user = user
        self.action = action
        self.action_info = action_info
        self.action_time = datetime.utcnow()

    def __str__(self):
        return 'Portfolio ' + str(self.folio_id) + ': Action ' + \
               str(self.action) + ' at ' + str(self.action_time)


class FolioExport(Base, BaseMixin, IDEqualityMixin):
    """
    SQLAlchemy ORM wrapper for a portfolio export record.
    """
    id = Column(BigInteger, nullable=False, autoincrement=True, primary_key=True)
    folio_id = Column(BigInteger, ForeignKey('folios.id'), nullable=False)
    description = Column(Text, nullable=False)
    originals = Column(Boolean, nullable=False)
    parameters = Column(JSON, nullable=False)
    task_id = Column(BigInteger, ForeignKey('tasks.id'), nullable=True)
    filename = Column(String(255), nullable=False)
    filesize = Column(BigInteger, nullable=False)
    created = Column(DateTime, nullable=False)
    keep_until = Column(DateTime, nullable=False)

    portfolio = relationship('Folio')

    __tablename__ = 'folioexports'
    __table_args__ = (
        Index('idx_folex_folio', folio_id, unique=False),
        Index('idx_folex_filename', filename, unique=True, postgresql_where=func.length(filename) > 0),
        Index('idx_folex_expiry', keep_until, unique=False),
    )

    def __init__(self, portfolio, description, originals, image_params_dict=None, keep_until=None):
        self.id = None
        self.portfolio = portfolio
        self.description = description
        self.originals = originals
        self.parameters = image_params_dict or {}
        self.task_id = None
        self.filename = ''
        self.filesize = 0
        self.created = datetime.utcnow()
        self.keep_until = keep_until or datetime(2099, 12, 31)

    def __str__(self):
        return 'PortfolioExport: ' + (self.filename or 'Pending')

    def is_outdated(self):
        """
        Returns whether the portfolio has had image modifications made since
        this export was created.
        """
        return self.created < self.portfolio.last_updated

    def describe(self, add_image_info=False):
        """
        Returns a description of this export. This will be the 'description'
        attribute if set, or some other text if not. When add_image_info is
        True, details about the 'originals' and 'parameters' attributes will
        be included.
        """
        desc = self.description or self.filename or 'Untitled'
        desc += ' (expires ' + self.keep_until.strftime(locale.nl_langinfo(locale.D_T_FMT)) + ' UTC'
        if add_image_info:
            if self.originals:
                desc += ', images are unmodified originals'
            elif not self.parameters:
                desc += ', images use default settings'
            else:
                desc += ', images have changes applied'
        desc += ')'
        return desc

    @staticmethod
    def create_filename():
        """
        Returns a unique and non-guessable filename (without a file extension).
        """
        return uuid.uuid4().hex
