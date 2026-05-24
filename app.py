from flask import Flask, jsonify, request
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

@app.route("/api/users/<int:user_id>/status")
def user_status(user_id):
    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, status FROM users WHERE id = %s",
                (user_id,)
            )
            row = cursor.fetchone()

        if row is None:
            return jsonify({
                "success": False,
                "status": ""
            })

        return jsonify({
            "success": True,
            "status": row["status"]
        })

    finally:
        conn.close()


@app.route("/api/inquiries", methods=["POST"])
def create_inquiry():
    data = request.get_json()

    user_id = data.get("user_id")
    munititle = data.get("munititle")
    municontent = data.get("municontent")

    if munititle == "" or municontent == "":
        return jsonify({
            "success": False,
            "message": "문의 제목과 문의 내용을 입력해주세요."
        })

    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, status FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()

            if user is None:
                return jsonify({
                    "success": False,
                    "message": "사용자를 찾을 수 없습니다."
                })

            if user["status"] != "active":
                return jsonify({
                    "success": False,
                    "message": "회원가입 승인된 학생만 문의를 보낼 수 있습니다."
                })

            cursor.execute(
                """
                INSERT INTO inquiries (user_id, title, content)
                VALUES (%s, %s, %s)
                """,
                (user_id, munititle, municontent)
            )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "문의사항이 저장되었습니다."
        })

    except Exception:
        conn.rollback()

        return jsonify({
            "success": False,
            "message": "문의사항 저장 중 오류가 발생했습니다."
        })

    finally:
        conn.close()

if __name__ == "__main__":
    app.run(port=8000,debug=True)
