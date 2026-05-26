import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_connection
import cv2
from pyzbar.pyzbar import decode

app = Flask(__name__)
CORS(app)

Uploadfolder = "uploads"
os.makedirs(Uploadfolder, exist_ok=True)


def decodeqr(filepath):
    try:
        img = cv2.imread(filepath)
        decodedobj = decode(img)
        if not decodedobj:
            return None
        return decodedobj[0].data.decode('utf-8')
    except Exception as e:
        print("qr 디코딩 에러")
        return None


@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        name = request.form.get('name')
        studentid = request.form.get('studentid')
        password = request.form.get('password')
        phone = request.form.get('phone')

        file = request.files['qrimage']
        filename = file.filename
        filepath = os.path.join(Uploadfolder, filename)
        file.save(filepath)
        qrtext = decodeqr(filepath)
        if (os.path.exists(filepath)):
            os.remove(filepath)
        if not qrtext:
            return jsonify({"message": "qr 코드 인식 불가"}), 400

        if studentid not in qrtext:
            print("가입실패")
            return jsonify({"message": "입력한 학번과 학생증의 QR정보가 일치하지 않습니다"}), 400

        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                check_sql = "SELECT * FROM users WHERE student_number=%s"
                cursor.execute(check_sql, (studentid,))
                if (cursor.fetchone()):
                    return jsonify({"message": "이미 가입된 학생입니다"}), 400
                insert_sql = """
                         INSERT INTO users (student_number, password_hash, name, phone, role, status, overdue_count,
                                            block_period, created_at)
                         values (%s, %s, %s, %s, 'student', 'pending', 0, NULL, NOW()) 
                         """
                cursor.execute(insert_sql, (studentid, password, name, phone))

            conn.commit()
            print("db 저장됨")

        except Exception as e:
            print(f"db 저장에러: {e}")
            return jsonify({"message": "db 저장 중 에러가 발생했습니다"}), 500
        finally:
            conn.close()

        return jsonify({"message": "회원가입이 완료되었습니다"}), 200

    except Exception as e:
        print("서버에러")
        return jsonify({"message": "서버에러발생"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        studentid = data.get("studentid")
        password = data.get("password")
        if not studentid or not password:
            return jsonify({"message": "학번과 이름을 모두 입력해주세요"}),400
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                check_sql = "SELECT * FROM users WHERE student_number=%s"
                cursor.execute(check_sql, (studentid,))
                user = cursor.fetchone()
                if not user:
                    return jsonify({"message": "존재하지 않는 학번입니다"})
                db_password = user['password_hash']
                db_role = user['role']
                db_name = user['name']
                db_phone = user['phone']
                db_overdue_count = user['overdue_count']

                if db_password != password:
                    return jsonify({"message":"비밀번호가 일치하지 않습니다"}),401
                return jsonify({"message":"로그인 성공"
                                , "user":{"studentid":studentid,
                                          "role": db_role,
                                          "name":db_name,
                                          "phone":db_phone,
                                          "overdue_count":db_overdue_count

                                          }}),200
        except Exception as e:
            print("db 접속에러 {e}")
            return jsonify({"message" : "db접속오류"}),500
        finally:
            conn.close()
    except Exception as e:
        print("로그인 에러 {e}")
        return jsonify({"message":"로그인서버오류"}),500


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



@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name FROM categories")
            rows = cursor.fetchall()
        return jsonify(rows), 200
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

@app.route('/api/items', methods=['GET'])
def get_items():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    i.id,
                    i.name,
                    i.category_id,
                    i.img_url AS image,
                    i.total_count,
                    i.preparing_count AS preparing,
                    COALESCE(SUM(CASE 
                        WHEN r.status IN ('approved', 'rented', 'overdue') 
                        THEN r.quantity ELSE 0 
                    END), 0) AS inUse
                FROM items i
                LEFT JOIN rentals r ON r.item_id = i.id
                GROUP BY i.id
            """)
            rows = cursor.fetchall()
            for row in rows:
                row['available'] = row['total_count'] - row['preparing'] - row['inUse']
                del row['total_count']
        return jsonify(rows), 200
    finally:
        conn.close()


@app.route('/api/dashboard/kpi', methods=['GET'])
def dashboard_kpi():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total_items FROM items")
            total_items = cursor.fetchone()['total_items']

            cursor.execute("SELECT COALESCE(SUM(quantity), 0) AS rented FROM rentals WHERE status IN ('approved', 'rented', 'overdue')")
            rented = cursor.fetchone()['rented']

            cursor.execute("SELECT COUNT(*) AS pending FROM rentals WHERE status = 'pending'")
            pending = cursor.fetchone()['pending']

            cursor.execute("SELECT COUNT(*) AS overdue FROM rentals WHERE status = 'overdue'")
            overdue = cursor.fetchone()['overdue']

            cursor.execute("SELECT COUNT(*) AS active_users FROM users WHERE status = 'active' AND role = 'student'")
            active_users = cursor.fetchone()['active_users']

        return jsonify({
            "total_items": total_items,
            "rented": rented,
            "pending": pending,
            "overdue": overdue,
            "active_users": active_users
        }), 200
    finally:
        conn.close()


@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT c.name, COUNT(i.id) AS count
                FROM categories c
                LEFT JOIN items i ON c.id = i.category_id
                GROUP BY c.id
            """)
            categories = cursor.fetchall()

        return jsonify({
            "categories": categories
        }), 200
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(port=8000, debug=True)
