import os
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

# Configuration via environment variables
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'appuser')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'app_password')
DB_NAME = os.getenv('DB_NAME', 'textrepeater')
DB_SSL_MODE = os.getenv('DB_SSL_MODE', 'DISABLED')  # For Azure you will set to REQUIRED

# SQLAlchemy connection URI (add ssl_mode param if required)
base_params = ["charset=utf8mb4"]
if DB_SSL_MODE and DB_SSL_MODE.upper() == 'REQUIRED':
    # Azure Flexible Server requires SSL; PyMySQL uses 'ssl' dict, but we can pass ssl_mode in query
    base_params.append('ssl_mode=REQUIRED')
query_string = '&'.join(base_params)
SQLALCHEMY_DATABASE_URI = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?{query_string}"
)

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change')
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Optional pool tuning for Azure
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'pool_size': 5,
    'max_overflow': 5,
}

db = SQLAlchemy(app)

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<Message {self.id} {self.name}>"

@app.before_first_request
def create_tables():
    # Auto-create tables if they do not exist; in production you might prefer migrations
    db.create_all()

@app.route('/', methods=['GET'])
def index():
    # Display form and all messages (latest first)
    messages = Message.query.order_by(Message.created_at.desc()).all()
    return render_template('index.html', messages=messages)

@app.route('/submit', methods=['POST'])
def submit():
    name = request.form.get('name', '').strip()
    message_text = request.form.get('message', '').strip()

    if not name or not message_text:
        flash('Name and message are required.', 'error')
        return redirect(url_for('index'))

    if len(name) > 100:
        flash('Name must be at most 100 characters.', 'error')
        return redirect(url_for('index'))

    try:
        new_msg = Message(name=name, message=message_text)
        db.session.add(new_msg)
        db.session.commit()
        flash('Message saved successfully!', 'success')
    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.exception('Database error while inserting message')
        flash('An error occurred while saving your message.', 'error')
    return redirect(url_for('index'))

@app.route('/healthz')
def healthz():
    try:
        # Simple DB check
        db.session.execute('SELECT 1')
        return {'status': 'ok'}, 200
    except Exception as e:
        return {'status': 'error', 'details': str(e)}, 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port)
