import os
import tempfile
import pytest

# Configure a temporary SQLite database for tests before importing app
os.environ['DB_HOST'] = ''
os.environ['DB_PORT'] = ''
os.environ['DB_USER'] = ''
os.environ['DB_PASSWORD'] = ''
os.environ['DB_NAME'] = ''

from app import app, db, Message  # noqa: E402

@pytest.fixture(autouse=True)
def setup_db():
    # Override to SQLite in-memory for tests
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()


def test_insert_and_list_messages():
    client = app.test_client()
    resp = client.post('/submit', data={'name': 'Tester', 'message': 'Hello'}, follow_redirects=True)
    assert resp.status_code == 200
    assert b'Message saved successfully!' in resp.data
    page = client.get('/')
    assert b'Tester' in page.data
    assert b'Hello' in page.data


def test_validation():
    client = app.test_client()
    resp = client.post('/submit', data={'name': '', 'message': 'Hi'}, follow_redirects=True)
    assert b'Name and message are required.' in resp.data
