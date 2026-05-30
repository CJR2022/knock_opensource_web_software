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

#연체 횟수 공용 함수 rented 상태가
# check_overdue_rentals(conn)로 상태 확인 필요할떄 한번씩만 호출 하면 어느정도 되지 않을까 싶음
# 마이페이지나 물품 대여 같은 곳
def check_overdue_rentals(conn):
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT id, user_id
            FROM rentals
            WHERE status = 'rented'
              AND requested_return_at < NOW()
        """)
        rows = cursor.fetchall()

        for row in rows:
            cursor.execute("""
                UPDATE rentals
                SET status = 'overdue'
                WHERE id = %s
                  AND status = 'rented'
            """, (row["id"],))

            if cursor.rowcount == 1:
                cursor.execute("""
                    UPDATE users
                    SET overdue_count = overdue_count + 1
                    WHERE id = %s
                """, (row["user_id"],))

    conn.commit()


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
                             values (%s, %s, %s, %s, 'student', 'pending', 0, NULL, NOW()) \
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
    conn = get_connection()
    try:
        check_overdue_rentals(conn)

        data = request.get_json()
        studentid = data.get("studentid")
        password = data.get("password")
        if not studentid or not password:
            return jsonify({"message": "학번과 이름을 모두 입력해주세요"}), 400
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                check_sql = "SELECT * FROM users WHERE student_number=%s"
                cursor.execute(check_sql, (studentid,))
                user = cursor.fetchone()
                if not user:
                    return jsonify({"message": "존재하지 않는 학번입니다"}),404
                db_password = user['password_hash']
                db_role = user['role']
                db_name = user['name']
                db_phone = user['phone']
                db_overdue_count = user['overdue_count']
                db_id = user['id']

                if db_password != password:
                    return jsonify({"message": "비밀번호가 일치하지 않습니다"}), 401
                return jsonify({"message": "로그인 성공"
                                   , "user": {"id": db_id,
                                              "studentid": studentid,
                                              "role": db_role,
                                              "name": db_name,
                                              "phone": db_phone,
                                              "overdue_count": db_overdue_count
                                              }}), 200
        except Exception as e:
            print("db 접속에러 {e}")
            return jsonify({"message": "db접속오류"}), 500
        finally:
            conn.close()
    except Exception as e:
        print("로그인 에러 {e}")
        return jsonify({"message": "로그인서버오류"}), 500


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
                           SELECT i.id,
                                  i.name,
                                  i.category_id,
                                  i.img_url         AS image,
                                  i.total_count,
                                  i.preparing_count AS preparing,
                                  COALESCE(SUM(CASE
                                                   WHEN r.status IN ('approved', 'rented', 'overdue')
                                                       THEN r.quantity
                                                   ELSE 0
                                      END), 0)      AS inUse
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

            cursor.execute(
                "SELECT COALESCE(SUM(quantity), 0) AS rented FROM rentals WHERE status IN ('approved', 'rented', 'overdue')")
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
                               LEFT JOIN items i
                           ON c.id = i.category_id
                           GROUP BY c.id
                           """)
            categories = cursor.fetchall()

        return jsonify({
            "categories": categories
        }), 200
    finally:
        conn.close()

@app.route('/api/students/pending', methods=['GET'])
def dashboard_students():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, student_number, name, phone, created_at
                FROM users WHERE status = 'pending'
            """)
            new_student = cursor.fetchall()
        
        return jsonify(new_student), 200
    finally:
        conn.close()

@app.route('/api/students/active', methods=['GET'])
def get_active_students():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, student_number, name, phone, overdue_count, status, block_period, created_at
                FROM users
                WHERE status IN ('active', 'blocked') AND role = 'student'
            """)
            students = cursor.fetchall()

            cursor.execute("""
                SELECT r.user_id, i.name AS item_name, r.status, r.quantity
                FROM rentals r
                JOIN items i ON r.item_id = i.id
                WHERE r.status IN ('approved', 'rented', 'overdue')
            """)
            rentals = cursor.fetchall()

        rental_map = {}
        for r in rentals:
            uid = r['user_id']
            if uid not in rental_map:
                rental_map[uid] = []
            rental_map[uid].append({
                'item_name': r['item_name'],
                'status': r['status'],
                'quantity': r['quantity']
            })

        for s in students:
            s['is_blocked'] = s['status'] == 'blocked'
            s['current_rentals'] = rental_map.get(s['id'], [])
            del s['block_period']

        return jsonify(students), 200
    finally:
        conn.close()

@app.route('/api/students/<int:student_id>/approve', methods=['POST'])
def approve_student(student_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                UPDATE users
                SET status = 'active'
                WHERE id = %s AND status = 'pending'
            """
            cursor.execute(sql, (student_id,))
            conn.commit()

            if cursor.rowcount == 0:
                return jsonify({
                    "success": False,
                    "message": "이미 처리되었거나 존재하지 않는 학생입니다."
                }), 400

        return jsonify({
            "success": True,
            "message": "승인되었습니다."
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({
            "success": False,
            "message": "승인 처리 중 오류가 발생했습니다."
        }), 500

    finally:
        conn.close()


@app.route('/api/items/<int:item_id>/applicants', methods=['GET'])
def get_item_applicants(item_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT r.id        AS rental_id,
                                  r.user_id,
                                  r.item_id,
                                  r.quantity,
                                  r.requested_pickup_at,
                                  r.requested_return_at,
                                  r.status,
                                  u.name      AS user_name,
                                  u.student_number,
                                  u.phone,
                                  i.name      AS item_name,
                                  worker.name AS worker_name,
                                  u.overdue_count
                           FROM rentals r
                                    JOIN users u ON r.user_id = u.id
                                    JOIN items i ON r.item_id = i.id
                                    LEFT JOIN work_schedules ws
                                              ON ws.work_date = CASE DAYOFWEEK(r.requested_pickup_at)
                                                                    WHEN 2 THEN 'mon'
                                                                    WHEN 3 THEN 'tue'
                                                                    WHEN 4 THEN 'wed'
                                                                    WHEN 5 THEN 'thu'
                                                                    WHEN 6 THEN 'fri'
                                                  END
                                                  AND
                               TIME (r.requested_pickup_at) >= ws.start_time
                               AND TIME (r.requested_pickup_at)
                              < ws.end_time
                               LEFT JOIN users worker
                           ON ws.admin_id = worker.id
                           WHERE r.item_id = %s
                             AND r.status = 'pending'
                           ORDER BY r.requested_pickup_at ASC
                           """, (item_id,))
            rows = cursor.fetchall()

            for row in rows:
                row["requested_pickup_at"] = row["requested_pickup_at"].strftime("%Y-%m-%d %H:%M")
                row["requested_return_at"] = row["requested_return_at"].strftime("%Y-%m-%d %H:%M")

        return jsonify(rows), 200
    finally:
        conn.close()


@app.route('/api/rentals/<int:rental_id>/approve', methods=['POST'])
def approve_rental(rental_id):
    data = request.get_json()
    admin_id = data.get("admin_id")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           UPDATE rentals
                           SET status            = 'approved',
                               approved_admin_id = %s,
                               approved_at       = NOW()
                           WHERE id = %s
                             AND status = 'pending'
                           """, (admin_id, rental_id))

        conn.commit()
        return jsonify({"success": True, "message": "예약을 승인했습니다."}), 200
    except Exception:
        conn.rollback()
        return jsonify({"success": False, "message": "예약 승인 중 오류가 발생했습니다."}), 500
    finally:
        conn.close()


@app.route('/api/rentals/<int:rental_id>/reject', methods=['POST'])
def reject_rental(rental_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           UPDATE rentals
                           SET status        = 'rejected',
                               reject_reason = '관리자 거절'
                           WHERE id = %s
                             AND status = 'pending'
                           """, (rental_id,))

        conn.commit()
        return jsonify({"success": True, "message": "예약을 거절했습니다."}), 200
    except Exception:
        conn.rollback()
        return jsonify({"success": False, "message": "예약 거절 중 오류가 발생했습니다."}), 500
    finally:
        conn.close()


@app.route('/api/items/<int:item_id>/borrowers', methods=['GET'])
def get_item_borrowers(item_id):
    conn = get_connection()
    try:
        check_overdue_rentals(conn)

        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT r.id                                   AS rental_id,
                                  r.user_id,
                                  r.item_id,
                                  r.quantity,
                                  r.requested_pickup_at,
                                  r.requested_return_at,
                                  r.status,
                                  DATEDIFF(r.requested_return_at, NOW()) AS left_day,
                                  CASE
                                      WHEN r.requested_return_at < NOW() THEN 1
                                      ELSE 0
                                      END                                AS is_overdue,
                                  u.name                                 AS user_name,
                                  u.student_number,
                                  u.phone,
                                  u.overdue_count,
                                  i.name                                 AS item_name
                           FROM rentals r
                                    JOIN users u ON r.user_id = u.id
                                    JOIN items i ON r.item_id = i.id
                           WHERE r.item_id = %s
                             AND r.status IN ('approved', 'rented', 'overdue')
                           ORDER BY r.requested_return_at ASC
                           """, (item_id,))

            rows = cursor.fetchall()
            for row in rows:
                row["requested_pickup_at"] = row["requested_pickup_at"].strftime("%Y-%m-%d %H:%M")
                row["requested_return_at"] = row["requested_return_at"].strftime("%Y-%m-%d %H:%M")

            return jsonify(rows), 200
    finally:
        conn.close()
@app.route('/api/work-schedules', methods=['GET'])
def get_work_schedules():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql="SELECT work_date, TIME_FORMAT(start_time, '%H:%i') AS start_time FROM work_schedules"
            cursor.execute(sql)
            rows = cursor.fetchall()
        return jsonify(rows), 200
    except Exception as e:
        print(f"근무표 조회 에러: {e}")
        return jsonify({"message": "근무표 오류"}),500
    finally:
        conn.close()
@app.route('/api/rentals', methods=['POST'])
def create_rentals():
    data = request.get_json()
    user_id = data.get("user_id")
    item_id = data.get("item_id")
    quantity = data.get("quantity", 1)
    pickup=data.get("requested_pickup_at")
    return_time=data.get("requested_return_at")
    if not user_id or not item_id or not pickup or not return_time:
        return jsonify({"message":"시간을 선택해 주세요"}),400
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            check_sql="SELECT status FROM users WHERE id = %s;"
            cursor.execute(check_sql, (user_id,))
            user = cursor.fetchone()
            if user["status"] != "active":
                return jsonify({"message":"대여 권한이 없습니다(차단 상태)"}),403

            insert_sql="""
                    INSERT INTO rentals (user_id, item_id, quantity, requested_pickup_at, requested_return_at, status)  
                    VALUES (%s, %s, %s, %s, %s, 'pending')
            """
            cursor.execute(insert_sql, (user_id,item_id,quantity,pickup,return_time))
        conn.commit()
        return jsonify({"message":"대여 신청이 완료되었습니다"}),201
    except Exception:
        conn.rollback()
        return jsonify({"message": "대여 신청 중 에러발생"}), 500
    finally:
        conn.close()

@app.route('/api/rentals', methods=['GET'])
def get_my_rentals():
    user_id = request.args.get('user_id')
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT item_id, status FROM rentals WHERE user_id = %s"
            cursor.execute(sql, (user_id,))
            my_rentals = cursor.fetchall()
        return jsonify(my_rentals), 200
    except Exception :
        return jsonify({"message": "데이터베이스 에러"}), 500
    finally:
        conn.close()

if __name__ == "__main__":
    app.run(port=8000, debug=True)
