# -*- coding: utf-8 -*-
#
# Quru Image Server
#
# Document:      test_portfolios.py
# Date started:  02 Mar 2018
# By:            Matt Fozard
# Purpose:       Contains the image server test suite for the portfolios feature
# Requires:
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
#

import os
import json
import zipfile
from datetime import datetime, timedelta

import tests as main_tests

from imageserver.flask_app import app as flask_app
from imageserver.flask_app import data_engine as dm
from imageserver.flask_app import task_engine as tm
from imageserver.flask_app import permissions_engine as pm

from imageserver.api_util import API_CODES
from imageserver.filesystem_manager import (
    copy_file, delete_dir, make_dirs, path_exists, get_abs_path, get_file_info,
    get_portfolio_export_file_path
)
from imageserver.filesystem_sync import auto_sync_existing_file, auto_sync_folder
from imageserver.models import (
    FolderPermission, Group,
    Folio, FolioImage, FolioPermission, FolioHistory, FolioExport
)
from imageserver.util import to_iso_datetime


class PortfoliosAPITests(main_tests.BaseTestCase):
    @classmethod
    def setUpClass(cls):
        super(PortfoliosAPITests, cls).setUpClass()
        main_tests.init_tests()

    def setUp(self):
        super(PortfoliosAPITests, self).setUp()
        # Restore clean test data before each test
        self.reset_fixtures()

    def reset_fixtures(self):
        # Wipe the old data
        db_session = dm.db_get_session()
        db_session.query(FolioImage).delete()
        db_session.query(FolioPermission).delete()
        db_session.query(FolioHistory).delete()
        db_session.query(FolioExport).delete()
        db_session.query(Folio).delete()
        db_session.commit()
        # Create private, internal and public test portfolios
        db_user = main_tests.setup_user_account('foliouser')
        db_group = db_user.groups[-1]
        db_group.permissions.folios = True
        dm.save_object(db_group)
        self.create_portfolio('private', db_user,
                              FolioPermission.ACCESS_NONE, FolioPermission.ACCESS_NONE)
        self.create_portfolio('internal', db_user,
                              FolioPermission.ACCESS_DOWNLOAD, FolioPermission.ACCESS_NONE)
        self.create_portfolio('public', db_user,
                              FolioPermission.ACCESS_DOWNLOAD, FolioPermission.ACCESS_DOWNLOAD)

    # Creates a demo portfolio with 2 images and a basic audit trail
    def create_portfolio(self, human_id, owner, internal_access, public_access):
        db_img_1 = auto_sync_existing_file('test_images/blue bells.jpg', dm, tm)
        db_img_2 = auto_sync_existing_file('test_images/cathedral.jpg', dm, tm)
        db_pub_group = dm.get_group(Group.ID_PUBLIC)
        db_normal_group = dm.get_group(Group.ID_EVERYONE)
        folio = Folio(human_id, 'Test %s Portfolio' % human_id.capitalize(), 'Description', owner)
        db_folio = dm.save_object(folio)
        dm.save_object(FolioHistory(db_folio, owner, FolioHistory.ACTION_CREATED, 'Created'))
        dm.save_object(FolioImage(db_folio, db_img_1))
        dm.save_object(FolioImage(db_folio, db_img_2))
        dm.save_object(FolioHistory(db_folio, owner, FolioHistory.ACTION_IMAGE_CHANGE, 'Added image 1'))
        dm.save_object(FolioHistory(db_folio, owner, FolioHistory.ACTION_IMAGE_CHANGE, 'Added image 2'))
        dm.save_object(FolioPermission(db_folio, db_pub_group, public_access))
        dm.save_object(FolioPermission(db_folio, db_normal_group, internal_access))

    # Publishes a portfolio and waits for the task to finish,
    # returning the associated FolioExport object
    def publish_portfolio(self, folio, description, originals=True, image_params_dict=None, expiry_time=None):
        if not image_params_dict:
            image_params_dict = {}
        if not expiry_time:
            expiry_time = datetime.utcnow() + timedelta(days=365)
        api_url = '/api/portfolios/' + str(folio.id) + '/exports/'
        main_tests.setup_user_account('folioadmin', user_type='admin_folios')
        self.login('folioadmin', 'folioadmin')
        rv = self.app.post(api_url, data={
            'description': description,
            'originals': originals,
            'image_parameters': json.dumps(image_params_dict),
            'expiry_time': to_iso_datetime(expiry_time)
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS_TASK_ACCEPTED)
        obj = json.loads(rv.data)
        task = tm.wait_for_task(obj.task_id, 20)
        self.assertIsNotNone(task, 'Portfolio export task was cleaned up')
        return task.result

    # Tests portfolio creation and permissions
    def test_folio_create(self):
        api_url = '/api/portfolios/'
        # Must be logged in to create
        rv = self.app.post(api_url)
        self.assertEqual(rv.status_code, API_CODES.REQUIRES_AUTH)
        # Must have folio permission to create
        main_tests.setup_user_account('testuser')
        self.login('testuser', 'testuser')
        rv = self.app.post(api_url)
        self.assertEqual(rv.status_code, API_CODES.UNAUTHORISED)
        # So this should work
        db_owner = dm.get_user(username='foliouser')
        self.login('foliouser', 'foliouser')
        rv = self.app.post(api_url, data={
            'human_id': 'mypf1',
            'name': 'Portfolio 1',
            'description': 'This is a test portfolio',
            'internal_access': FolioPermission.ACCESS_NONE,
            'public_access': FolioPermission.ACCESS_NONE
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        self.assertGreater(obj['data']['id'], 0)
        self.assertEqual(obj['data']['human_id'], 'mypf1')
        self.assertEqual(obj['data']['description'], 'This is a test portfolio')
        self.assertEqual(obj['data']['owner_id'], db_owner.id)
        # Audit trail should have a "created" entry
        db_folio = dm.get_portfolio(obj['data']['id'], load_history=True)
        self.assertIsNotNone(db_folio)
        self.assertEqual(len(db_folio.history), 1)
        self.assertEqual(db_folio.history[0].action, FolioHistory.ACTION_CREATED)

    # Test the human ID value when creating portfolios
    def test_folio_human_id(self):
        api_url = '/api/portfolios/'
        self.login('foliouser', 'foliouser')
        # Creation - blank human ID should have one allocated
        rv = self.app.post(api_url, data={
            'human_id': '',
            'name': 'Test portfolio',
            'description': 'This is a test portfolio',
            'internal_access': FolioPermission.ACCESS_NONE,
            'public_access': FolioPermission.ACCESS_NONE
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        self.assertGreater(len(obj['data']['human_id']), 0)
        # Creation - duplicate human ID should not be allowed
        rv = self.app.post(api_url, data={
            'human_id': 'private',          # see reset_fixtures()
            'name': 'Test portfolio',
            'description': 'This is a test portfolio',
            'internal_access': FolioPermission.ACCESS_NONE,
            'public_access': FolioPermission.ACCESS_NONE
        })
        self.assertEqual(rv.status_code, API_CODES.ALREADY_EXISTS)
        # Updates - blank human ID should have one allocated
        db_folio = dm.get_portfolio(human_id='public')
        api_url = '/api/portfolios/' + str(db_folio.id) + '/'
        rv = self.app.put(api_url, data={
            'id': db_folio.id,
            'human_id': '',
            'name': 'Test portfolio',
            'description': 'This is a test portfolio',
            'internal_access': FolioPermission.ACCESS_NONE,
            'public_access': FolioPermission.ACCESS_NONE
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        self.assertGreater(len(obj['data']['human_id']), 0)
        self.assertNotEqual(obj['data']['human_id'], 'public')
        # Updates - duplicate human ID should not be allowed
        rv = self.app.put(api_url, data={
            'id': db_folio.id,
            'human_id': 'private',          # see reset_fixtures()
            'name': 'Test portfolio',
            'description': 'This is a test portfolio',
            'internal_access': FolioPermission.ACCESS_NONE,
            'public_access': FolioPermission.ACCESS_NONE
        })
        self.assertEqual(rv.status_code, API_CODES.ALREADY_EXISTS)
        # A human ID of all whitespace should be treated the same as a blank
        rv = self.app.post(api_url, data={
            'human_id': '  ',
            'name': 'Test portfolio',
            'description': 'This is a test portfolio',
            'internal_access': FolioPermission.ACCESS_NONE,
            'public_access': FolioPermission.ACCESS_NONE
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        self.assertGreater(len(obj['data']['human_id']), 0)
        self.assertNotEqual(obj['data']['human_id'].strip(), '')

    # Tests adding and removing images from a portfolio
    def test_folio_add_remove_image(self):
        db_folio = dm.get_portfolio(human_id='private')
        db_img = auto_sync_existing_file('test_images/thames.jpg', dm, tm)
        api_url = '/api/portfolios/' + str(db_folio.id) + '/images/'
        self.login('foliouser', 'foliouser')
        # Get the initial image list
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        self.assertEqual(len(obj['data']), 2)  # see reset_fixtures()
        # Add another image
        rv = self.app.post(api_url, data={
            'image_id': db_img.id
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        # Get the new image list
        db_folio = dm.get_portfolio(db_folio.id, load_images=True, load_history=True)
        self.assertEqual(len(db_folio.images), 3)  # initial + 1
        # Check the audit trail was updated
        add_history = db_folio.history[-1]
        self.assertEqual(add_history.action, FolioHistory.ACTION_IMAGE_CHANGE)
        self.assertIn(db_img.src, add_history.action_info)
        # Check that we can't add a duplicate image
        rv = self.app.post(api_url, data={
            'image_id': db_img.id
        })
        self.assertEqual(rv.status_code, API_CODES.ALREADY_EXISTS)
        # Remove the image
        api_url = '/api/portfolios/' + str(db_folio.id) + '/images/' + str(db_img.id) + '/'
        rv = self.app.delete(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        # Check the image list again
        db_folio = dm.get_portfolio(db_folio.id, load_images=True, load_history=True)
        self.assertEqual(len(db_folio.images), 2)  # back to initial
        # Check the audit trail was updated again
        del_history = db_folio.history[-1]
        self.assertEqual(del_history.action, FolioHistory.ACTION_IMAGE_CHANGE)
        self.assertIn(db_img.src, del_history.action_info)
        self.assertGreater(del_history.id, add_history.id)
        # Check that we can't remove it again
        rv = self.app.delete(api_url)
        self.assertEqual(rv.status_code, API_CODES.NOT_FOUND)

    # Tests handling of bad permissions when adding and removing images
    def test_folio_add_remove_image_permissions(self):
        db_folio = dm.get_portfolio(human_id='private')
        db_img = auto_sync_existing_file('test_images/thames.jpg', dm, tm)
        api_url = '/api/portfolios/' + str(db_folio.id) + '/images/'
        # Must be logged in
        rv = self.app.post(api_url, data={
            'image_id': db_img.id
        })
        self.assertEqual(rv.status_code, API_CODES.REQUIRES_AUTH)
        # Cannot change another user's portfolio
        db_user = main_tests.setup_user_account('anotherfoliouser')
        db_group = db_user.groups[-1]
        db_group.permissions.folios = True
        dm.save_object(db_group)
        self.login('anotherfoliouser', 'anotherfoliouser')
        rv = self.app.post(api_url, data={
            'image_id': db_img.id
        })
        self.assertEqual(rv.status_code, API_CODES.UNAUTHORISED)
        # The portfolio owner must have view permission for the image being added
        self.login('foliouser', 'foliouser')
        db_owner = dm.get_user(username='foliouser', load_groups=True)
        self.assertEqual(len(db_owner.groups), 1)  # Ensure no other group permissions need changing
        db_group = db_owner.groups[-1]
        unauth_image_dir = '/secret_images'
        unauth_image_path = unauth_image_dir + '/cathedral.jpg'
        try:
            # Put an image into a folder that is not viewable by foliouser
            make_dirs(unauth_image_dir)
            copy_file('test_images/cathedral.jpg', unauth_image_path)
            db_folder = auto_sync_folder(unauth_image_dir, dm, tm, False)
            fp = FolderPermission(db_folder, db_group, FolderPermission.ACCESS_NONE)
            dm.save_object(fp)
            pm.reset_folder_permissions()
            # Now try to add that image
            db_img = auto_sync_existing_file(unauth_image_path, dm, tm)
            rv = self.app.post(api_url, data={
                'image_id': db_img.id
            })
            self.assertEqual(rv.status_code, API_CODES.UNAUTHORISED)
            # This is a complicated test, so prove that it does work with the correct permission
            fp.access = FolderPermission.ACCESS_VIEW
            dm.save_object(fp)
            pm.reset_folder_permissions()
            rv = self.app.post(api_url, data={
                'image_id': db_img.id
            })
            self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        finally:
            delete_dir(unauth_image_dir, recursive=True)

    # Test image reordering
    def test_folio_reordering(self):
        # Get starting portfolio - see also reset_fixtures()
        db_folio = dm.get_portfolio(human_id='public')
        db_img = auto_sync_existing_file('test_images/tiger.svg', dm, tm)
        dm.save_object(FolioImage(db_folio, db_img))
        db_folio = dm.get_portfolio(human_id='public', load_images=True, load_history=True)
        # Check starting list, should be the order in which the images were added
        self.assertEqual(len(db_folio.images), 3)
        self.assertEqual(db_folio.images[0].image.src, 'test_images/blue bells.jpg')
        self.assertEqual(db_folio.images[1].image.src, 'test_images/cathedral.jpg')
        self.assertEqual(db_folio.images[2].image.src, 'test_images/tiger.svg')
        start_history_len = len(db_folio.history)
        # Check that non-owners don't have permission to reorder
        api_url = '/api/portfolios/' + str(db_folio.id) + '/images/' + str(db_img.id) + '/position/'
        main_tests.setup_user_account('anna')
        self.login('anna', 'anna')
        rv = self.app.put(api_url, data={
            'index': 0
        })
        self.assertEqual(rv.status_code, API_CODES.UNAUTHORISED)
        # OK log in as the owner
        self.login('foliouser', 'foliouser')
        # Setting index before list start should use index 0
        rv = self.app.put(api_url, data={
            'index': -10
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        db_folio = dm.get_portfolio(human_id='public', load_images=True, load_history=True)
        self.assertEqual(db_folio.images[0].image.src, 'test_images/tiger.svg')
        self.assertEqual(db_folio.images[1].image.src, 'test_images/blue bells.jpg')
        self.assertEqual(db_folio.images[2].image.src, 'test_images/cathedral.jpg')
        # Setting index to the middle should do as asked
        rv = self.app.put(api_url, data={
            'index': 1
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        db_folio = dm.get_portfolio(human_id='public', load_images=True, load_history=True)
        self.assertEqual(db_folio.images[0].image.src, 'test_images/blue bells.jpg')
        self.assertEqual(db_folio.images[1].image.src, 'test_images/tiger.svg')
        self.assertEqual(db_folio.images[2].image.src, 'test_images/cathedral.jpg')
        # Setting index after list end should use index len(list)-1
        rv = self.app.put(api_url, data={
            'index': 999
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        db_folio = dm.get_portfolio(human_id='public', load_images=True, load_history=True)
        self.assertEqual(db_folio.images[0].image.src, 'test_images/blue bells.jpg')
        self.assertEqual(db_folio.images[1].image.src, 'test_images/cathedral.jpg')
        self.assertEqual(db_folio.images[2].image.src, 'test_images/tiger.svg')
        # After 3 successful moves we should have 3 more audit trail entries
        self.assertEqual(len(db_folio.history), start_history_len + 3)
        self.assertEqual(db_folio.history[-1].action, FolioHistory.ACTION_IMAGE_CHANGE)
        self.assertEqual(db_folio.history[-2].action, FolioHistory.ACTION_IMAGE_CHANGE)
        self.assertEqual(db_folio.history[-3].action, FolioHistory.ACTION_IMAGE_CHANGE)
        self.assertIn(db_img.src, db_folio.history[-3].action_info)

    # Test folio discoverability
    def test_folio_listing(self):
        api_url = '/api/portfolios/'
        # Public users should only see public portfolios
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        hids = [folio.human_id for folio in obj['data']]
        self.assertEqual(len(hids), 1)
        self.assertEqual(hids[0], 'public')
        # Internal users should see internal + public portfolios
        main_tests.setup_user_account('janeaustin')
        self.login('janeaustin', 'janeaustin')
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        hids = [folio.human_id for folio in obj['data']]
        self.assertEqual(len(hids), 2)
        self.assertIn('public', hids)
        self.assertIn('internal', hids)
        # Portfolio owners should see their own + internal + public portfolios
        self.login('foliouser', 'foliouser')
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        hids = [folio.human_id for folio in obj['data']]
        self.assertEqual(len(hids), 3)
        self.assertIn('public', hids)
        self.assertIn('internal', hids)
        self.assertIn('private', hids)

    # Tests that the portfolio listing API contains the expected data fields
    def test_folio_listing_fields(self):
        api_url = '/api/portfolios/'
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        self.assertGreater(len(obj['data']), 0)
        folio = obj['data'][0]
        # Check that the viewing URL is included
        self.assertTrue(hasattr(folio, 'url'))
        self.assertEqual(
            folio.url,
            flask_app.config['PREFERRED_URL_SCHEME'] + '://' +
            flask_app.config['PUBLIC_HOST_NAME'] +
            flask_app.config['APPLICATION_ROOT'] +
            'portfolios/' + str(folio.human_id) + '/'
        )
        # We're not expecting the image list or audit trail
        # (this is only a performance concern, not a functional one)
        self.assertFalse(hasattr(folio, 'images'))
        self.assertFalse(hasattr(folio, 'history'))

    # Tests viewing of portfolios
    def test_folio_viewing(self):
        # Set up test URLs
        db_public_folio = dm.get_portfolio(human_id='public')
        db_internal_folio = dm.get_portfolio(human_id='internal')
        db_private_folio = dm.get_portfolio(human_id='private')
        public_api_url = '/api/portfolios/' + str(db_public_folio.id) + '/'
        public_view_url = '/portfolios/' + str(db_public_folio.human_id) + '/'
        internal_api_url = '/api/portfolios/' + str(db_internal_folio.id) + '/'
        internal_view_url = '/portfolios/' + str(db_internal_folio.human_id) + '/'
        private_api_url = '/api/portfolios/' + str(db_private_folio.id) + '/'
        private_view_url = '/portfolios/' + str(db_private_folio.human_id) + '/'
        # On top of the standard test fixtures, create another private portfolio
        priv_user2 = main_tests.setup_user_account('janeaustin')
        self.create_portfolio('private2', priv_user2, FolioPermission.ACCESS_NONE, FolderPermission.ACCESS_NONE)
        db_private2_folio = dm.get_portfolio(human_id='private2')
        private2_api_url = '/api/portfolios/' + str(db_private2_folio.id) + '/'
        private2_view_url = '/portfolios/' + str(db_private2_folio.human_id) + '/'

        def view_pf(api_url, view_url, expect_success):
            rv = self.app.get(api_url)
            self.assertEqual(
                rv.status_code,
                API_CODES.SUCCESS if expect_success else API_CODES.UNAUTHORISED
            )
            rv = self.app.get(view_url)
            self.assertEqual(
                rv.status_code,
                API_CODES.SUCCESS if expect_success else API_CODES.UNAUTHORISED
            )

        def run_test_cases(test_cases):
            for tc in test_cases:
                view_pf(tc[0], tc[1], tc[2])

        # Public user should be able to view public portfolio, not others
        test_cases = [
            (public_api_url, public_view_url, True),
            (internal_api_url, internal_view_url, False),
            (private_api_url, private_view_url, False),
        ]
        run_test_cases(test_cases)
        # Internal user should be able to view internal + public portfolio, not private
        test_cases = [
            (public_api_url, public_view_url, True),
            (internal_api_url, internal_view_url, True),
            (private_api_url, private_view_url, False),
        ]
        main_tests.setup_user_account('plainuser')
        self.login('plainuser', 'plainuser')
        run_test_cases(test_cases)
        # Portfolio owners should see their own + internal + public portfolios, not another private
        test_cases = [
            (public_api_url, public_view_url, True),
            (internal_api_url, internal_view_url, True),
            (private_api_url, private_view_url, True),
            (private2_api_url, private2_view_url, False),
        ]
        self.login('foliouser', 'foliouser')
        run_test_cases(test_cases)

    # Tests that the portfolio viewing API contains the expected data fields
    def test_folio_viewing_fields(self):
        db_public_folio = dm.get_portfolio(human_id='public')
        api_url = '/api/portfolios/' + str(db_public_folio.id) + '/'
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        folio = obj['data']
        self.assertTrue(hasattr(folio, 'owner'))
        self.assertGreater(len(folio.images), 0)
        self.assertGreater(len(folio.permissions), 0)
        self.assertGreater(len(folio.history), 0)
        self.assertTrue(hasattr(folio, 'downloads'))
        self.assertTrue(hasattr(folio, 'url'))
        self.assertEqual(
            folio.url,
            flask_app.config['PREFERRED_URL_SCHEME'] + '://' +
            flask_app.config['PUBLIC_HOST_NAME'] +
            flask_app.config['APPLICATION_ROOT'] +
            'portfolios/' + str(db_public_folio.human_id) + '/'
        )

    # Tests that single-image parameters get stored and get applied
    def test_image_parameters(self):
        db_folio = dm.get_portfolio(human_id='private', load_images=True)
        db_img = db_folio.images[0]
        api_url = '/api/portfolios/' + str(db_folio.id) + '/images/' + str(db_img.id) + '/'
        self.login('foliouser', 'foliouser')
        # Invalid image parameters should fail validation
        params = {'width': 'badnumber'}
        rv = self.app.put(api_url, data={
            'image_parameters': json.dumps(params)
        })
        self.assertEqual(rv.status_code, API_CODES.INVALID_PARAM)
        # Valid image parameters should get saved
        params = {'width': 800, 'format': 'tif'}
        rv = self.app.put(api_url, data={
            'image_parameters': json.dumps(params)
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        # The API should return the parameters in the generated image URLs
        api_url = '/api/portfolios/' + str(db_folio.id) + '/'
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        folio = obj['data']
        self.assertTrue(hasattr(folio.images[0], 'url'))
        self.assertIn('width=800', folio.images[0].url)
        self.assertIn('format=tif', folio.images[0].url)
        # And again
        api_url = '/api/portfolios/' + str(db_folio.id) + '/images/'
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        obj = json.loads(rv.data)
        image_list = obj['data']
        self.assertTrue(hasattr(image_list[0], 'url'))
        self.assertIn('width=800', image_list[0].url)
        self.assertIn('format=tif', image_list[0].url)

    # Tests deletion of portfolios
    def test_folio_delete(self):
        db_folio = dm.get_portfolio(human_id='private')
        api_url = '/api/portfolios/' + str(db_folio.id) + '/'
        # Public access should be denied
        rv = self.app.delete(api_url)
        self.assertEqual(rv.status_code, API_CODES.UNAUTHORISED)
        # Deleting another user's portfolio should be denied
        main_tests.setup_user_account('plainuser')
        self.login('plainuser', 'plainuser')
        rv = self.app.delete(api_url)
        self.assertEqual(rv.status_code, API_CODES.UNAUTHORISED)
        # Deleting your own portfolio should work
        self.login('foliouser', 'foliouser')
        rv = self.app.delete(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        # Check it's really gone
        db_folio = dm.get_portfolio(db_folio.id)
        self.assertIsNone(db_folio)

    # Tests that folio administrators can change other user's portfolios
    def test_folio_administrator_permission(self):
        db_folio = dm.get_portfolio(human_id='private')
        api_url = '/api/portfolios/' + str(db_folio.id) + '/'
        main_tests.setup_user_account('folioadmin', user_type='admin_folios')
        self.login('folioadmin', 'folioadmin')
        # Edit permission
        rv = self.app.put(api_url, data={
            'id': db_folio.id,
            'human_id': db_folio.human_id,
            'name': 'Change name',
            'description': 'Change description',
            'internal_access': FolioPermission.ACCESS_NONE,
            'public_access': FolioPermission.ACCESS_NONE
        })
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        # Delete permission
        rv = self.app.delete(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)

    # Tests an export of image originals
    def test_publish_originals(self):
        db_folio = dm.get_portfolio(human_id='public')
        export = self.publish_portfolio(
            db_folio, 'Test export of public portfolio', originals=True
        )
        self.assertGreater(len(export.filename), 0)
        self.assertGreater(export.filesize, 0)
        published_filepath = get_portfolio_export_file_path(export)
        self.assertTrue(path_exists(published_filepath, require_file=True))
        try:
            # Audit trail should have been updated
            db_folio = dm.get_portfolio(db_folio.id, load_images=True, load_history=True)
            self.assertEqual(db_folio.history[-1].action, FolioHistory.ACTION_PUBLISHED)
            # Check the images in the zip are in order and match the originals
            exzip = zipfile.ZipFile(get_abs_path(published_filepath), 'r')
            try:
                zip_list = exzip.infolist()
                for idx, entry in enumerate(zip_list):
                    img_file_path = db_folio.images[idx].image.src
                    img_info = get_file_info(img_file_path)
                    self.assertIsNotNone(img_info)
                    self.assertEqual(entry.filename, os.path.basename(img_file_path))
                    self.assertEqual(entry.file_size, img_info['size'])
            finally:
                exzip.close()
        finally:
            # Clean up
            delete_dir(os.path.dirname(published_filepath), recursive=True)

    # Tests an export of resized images
    def test_publish_resized(self):
        db_folio = dm.get_portfolio(human_id='public')
        export = self.publish_portfolio(
            db_folio, 'Test export of public portfolio', originals=False,
            image_params_dict={'width': 200}
        )
        self.assertGreater(len(export.filename), 0)
        self.assertGreater(export.filesize, 0)
        published_filepath = get_portfolio_export_file_path(export)
        self.assertTrue(path_exists(published_filepath, require_file=True))
        try:
            # Check the images in the zip have been resized
            exzip = zipfile.ZipFile(get_abs_path(published_filepath), 'r')
            try:
                zip_list = exzip.infolist()
                for idx, entry in enumerate(zip_list):
                    img_file_path = db_folio.images[idx].image.src
                    img_info = get_file_info(img_file_path)
                    self.assertIsNotNone(img_info)
                    self.assertLess(entry.file_size, img_info['size'])
            finally:
                exzip.close()
        finally:
            # Clean up
            delete_dir(os.path.dirname(published_filepath), recursive=True)

    # Tests an export with both portfolio level and single image changes
    def test_publish_mixed_changes(self):
        # Set the portfolio files as renamed and resized
        db_folio = dm.get_portfolio(human_id='internal', load_images=True)
        db_folio.images[0].filename = 'image1.jpg'
        db_folio.images[0].parameters = {'width': 100}
        dm.save_object(db_folio.images[0])
        db_folio.images[1].filename = 'image2.jpg'
        db_folio.images[1].parameters = {'width': 100}
        dm.save_object(db_folio.images[1])
        # Now export the portfolio as PNG files
        export = self.publish_portfolio(
            db_folio, 'Test export of internal portfolio', originals=False,
            image_params_dict={'format': 'png'}
        )
        published_filepath = get_portfolio_export_file_path(export)
        self.assertTrue(path_exists(published_filepath, require_file=True))
        try:
            # Check the images in the zip have been renamed, resized, and saved as PNG
            exzip = zipfile.ZipFile(get_abs_path(published_filepath), 'r')
            try:
                entries = exzip.infolist()
                self.assertEqual(entries[0].filename, 'image1.png')
                self.assertEqual(entries[1].filename, 'image2.png')
                for fname in ['image1.png', 'image2.png']:
                    img_file = exzip.open(fname, 'r')
                    png_dims = main_tests.get_png_dimensions(img_file.read())
                    self.assertEqual(png_dims[0], 100)
            finally:
                exzip.close()
        finally:
            # Clean up
            delete_dir(os.path.dirname(published_filepath), recursive=True)

    # Tests access required for publishing
    def test_publish_permissions(self):
        db_folio = dm.get_portfolio(human_id='public')
        api_url = '/api/portfolios/' + str(db_folio.id) + '/exports/'
        # A portfolio user cannot publish another user's portfolio, even a public one
        db_user = main_tests.setup_user_account('anotherfoliouser')
        db_group = db_user.groups[-1]
        db_group.permissions.folios = True
        dm.save_object(db_group)
        self.login('anotherfoliouser', 'anotherfoliouser')
        rv = self.app.post(api_url, data={
            'description': 'Test',
            'originals': True,
            'image_parameters': '{}',
            'expiry_time': to_iso_datetime(datetime.utcnow())
        })
        self.assertEqual(rv.status_code, API_CODES.UNAUTHORISED)

    def test_portfolio_download(self):
        # Publish the public portfolio
        db_public_folio = dm.get_portfolio(human_id='public')
        public_export = self.publish_portfolio(db_public_folio, 'Public export', True)
        self.assertGreater(len(public_export.filename), 0)
        # Publish the internal portfolio
        db_internal_folio = dm.get_portfolio(human_id='internal')
        internal_export = self.publish_portfolio(db_internal_folio, 'Internal export', True)
        self.assertGreater(len(internal_export.filename), 0)
        # Public download of a public portfolio should be OK
        api_url = '/portfolios/public/downloads/' + public_export.filename
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        # Public download of an internal portfolio should not be allowed
        api_url = '/portfolios/internal/downloads/' + internal_export.filename
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.UNAUTHORISED)
        # But when logged in it should work
        main_tests.setup_user_account('emilybronte')
        self.login('emilybronte', 'emilybronte')
        rv = self.app.get(api_url)
        self.assertEqual(rv.status_code, API_CODES.SUCCESS)
        # Check that we got back a valid zip file
        self.assertIn('application/zip', rv.headers['Content-Type'])
        self.assertIn('attachment', rv.headers['Content-Disposition'])
        temp_zip_file = '/tmp/qis_download.zip'
        try:
            with open(temp_zip_file, 'wb') as f:
                f.write(rv.data)
            dlzip = zipfile.ZipFile(temp_zip_file, 'r')
            try:
                entries = dlzip.infolist()
                # These should match what reset_fixtures() does
                self.assertEqual(entries[0].filename, 'blue bells.jpg')
                self.assertEqual(entries[1].filename, 'cathedral.jpg')
            finally:
                dlzip.close()
        finally:
            os.remove(temp_zip_file)
        # Check the audit trail was updated
        db_internal_folio = dm.get_portfolio(db_internal_folio.id, load_history=True)
        self.assertEqual(db_internal_folio.history[-1].action, FolioHistory.ACTION_DOWNLOADED)
        self.assertIn('emilybronte', db_internal_folio.history[-1].action_info)


# test directory traversal via zip name

# API delete portfolio - test all files removed after delete

# API test unpublish
#     test files removed
#     test audit trail

# API test export expiry
#     test files removed
#     test audit trail

# API test files folder removed when empty
