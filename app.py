from flask import Flask, jsonify
from flask_cors import CORS
from db import get_connection

app = Flask(__name__)
CORS(app)

@app.route("/api/db-test")
def db_test():
    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 AS result")
            row = cursor.fetchone()
        return jsonify(row)

    finally:
        conn.close()

if __name__ == "__main__":
    app.run(port=8000,debug=True)
