import os
from functools import wraps

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from db import get_connection
import cv2
from pyzbar.pyzbar import decode
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime #대여 백엔드 처리하려고 가져옴 오늘시간
from solapi import SolapiMessageService
from solapi.model import RequestMessage

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")

CORS(app, origins=[
    "https://cbnu-knock.mooo.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
])

def check_admin():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"message": "로그인이 필요합니다."}), 401

    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, role FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()

            if user is None:
                return jsonify({"message": "사용자를 찾을 수 없습니다."}), 401

            if user["role"] != "admin":
                return jsonify({"message": "관리자 권한이 필요합니다."}), 403

        return None

    finally:
        conn.close()

def admin_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        admin_check = check_admin()
        if admin_check:
            return admin_check
        return func(*args, **kwargs)

    return wrapper

Uploadfolder = "uploads"
os.makedirs(Uploadfolder, exist_ok=True)

Itemimagefolder = os.path.join("public", "images")
os.makedirs(Itemimagefolder, exist_ok=True)

# 활동이미지 저장 -> 사진첩으로 이동하게 링크도 추가
# 하루마다 폴더를 다시한번 읽어서 초기화 할거임
#만약 지금 동기화 하고 싶으면 acrivity_img_sync.txt를 지우고 다시 실행 이미지 저장루트는 아래 public.. 따라가셈
Activityimagefolder = os.path.join("public", "images", "knock_img")
os.makedirs(Activityimagefolder, exist_ok=True)

Activitysynctxt = "activity_img_sync.txt"
Activitylink = "https://software.cbnu.ac.kr/sub0507"

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


# 연체 횟수 공용 함수 rented 상태인데 연체이면은 overdue로 바꾸고 users의 연체를 + 1 시키는 공용 함수
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


#차단 기한 지난 학생 자동 해제
#block_period가 지났으면 status를 active로, block_period를 NULL로 변경
def check_block_expired(conn):
    with conn.cursor() as cursor:
        cursor.execute("""
            UPDATE users
            SET status = 'active', block_period = NULL
            WHERE status = 'blocked'
              AND block_period IS NOT NULL
              AND block_period < NOW()
        """)
    conn.commit()

#하루에 한번 이미지를 동기화하는 함수
def sync_activity_img_once_a_day(conn):
    today_text = datetime.today().strftime("%Y-%m-%d")
    last_sync = ""

    if os.path.exists(Activitysynctxt):
        with open(Activitysynctxt, "r", encoding="utf-8") as f:
            last_sync = f.read().strip()

    if last_sync == today_text:
        return

    with conn.cursor() as cursor:
        for filename in os.listdir(Activityimagefolder):
            lowername = filename.lower()

            if not (
                lowername.endswith(".jpg")
                or lowername.endswith(".jpeg")
                or lowername.endswith(".png")
                or lowername.endswith(".webp")
            ):
                continue

            img_src = "/images/knock_img/" + filename

            cursor.execute(
                "SELECT id FROM activity_img WHERE img_src = %s",
                (img_src,)
            )
            old_img = cursor.fetchone()

            if old_img is None:
                cursor.execute(
                    """
                    INSERT INTO activity_img (img_src, link_url)
                    VALUES (%s, %s)
                    """,
                    (img_src, Activitylink)
                )

    conn.commit()

    with open(Activitysynctxt, "w", encoding="utf-8") as f:
        f.write(today_text)

# 신청 시간이 지났는데도 승인 처리 안 된 대여 신청을 자동 거절하는 공용 함수
# 나중에 이야기 할껀데 거절이유를 쓸꺼임? 거절 이유 써야 한다면 지금 다른곳 뜯어 고쳐야 하는데
def auto_reject_gigan_rentals(conn):
    with conn.cursor() as cursor:
        cursor.execute("""
                       UPDATE rentals
                       SET status = 'rejected'
                       WHERE status = 'pending'
                         AND requested_pickup_at <  DATE_SUB(NOW(), INTERVAL 2 HOUR)
                       """)
    conn.commit()

# 이게 노쇼 방지 함수
# 승인된 상태이지만 현재 날짜보다 지났으면 ( 널널하게 날짜로함) 해당 렌탈상태를 cancled상태로 만들고 그 사람 연체 횟수 증가
# 사용 개수는 approve랑 rented overdue로 계산하니깐 canceled 상태 되면 자동으로 사용 가능 될거임
def auto_gyeonggo_rentals(conn):
    with conn.cursor() as cursor:
        cursor.execute("""
                       SELECT id, user_id, item_id, quantity
                       FROM rentals
                       WHERE status = 'approved'
                         AND DATE(requested_pickup_at) < CURDATE()
                       """)
        rows = cursor.fetchall()

        for row in rows:
            cursor.execute("""
                           UPDATE rentals
                           SET status = 'canceled'
                           WHERE id = %s
                             AND status = 'approved'
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
        hashed_password = generate_password_hash(password)

        file = request.files['qrimage']
        filename = file.filename
        filepath = os.path.join(Uploadfolder, filename)
        file.save(filepath)
        qrtext = decodeqr(filepath)
        if (os.path.exists(filepath)):
            os.remove(filepath)
        if not qrtext:
            return jsonify({"message": "QR 코드 인식 불가"}), 400

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
                cursor.execute(insert_sql, (studentid, hashed_password, name, phone))

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
        check_block_expired(conn)

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
                    return jsonify({"message": "존재하지 않는 학번입니다"}), 404
                db_password = user['password_hash']
                db_role = user['role']
                db_name = user['name']
                db_phone = user['phone']
                db_overdue_count = user['overdue_count']
                db_id = user['id']

                if not check_password_hash(db_password, password):
                    return jsonify({"message": "비밀번호가 일치하지 않습니다"}), 401

                session.clear()
                session["user_id"] = db_id

                return jsonify({"message": "로그인에 성공하였습니다."
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


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "로그아웃되었습니다."}), 200


@app.route("/api/users/<int:user_id>/status")
def user_status(user_id):
    conn = get_connection()

    try:
        check_block_expired(conn)

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
        check_block_expired(conn)

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
@admin_required
def dashboard_kpi():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT SUM(total_count) AS total_items FROM items")
            total_items = cursor.fetchone()['total_items']

            cursor.execute(
                "SELECT COALESCE(SUM(quantity), 0) AS rented FROM rentals WHERE status IN ('approved', 'rented', 'overdue')")
            rented = cursor.fetchone()['rented']

            cursor.execute("SELECT COUNT(*) AS pending FROM rentals WHERE status = 'pending'")
            pending = cursor.fetchone()['pending']

            cursor.execute("SELECT COUNT(*) AS overdue FROM rentals WHERE status = 'overdue'")
            overdue = cursor.fetchone()['overdue']

            cursor.execute("SELECT COUNT(*) AS pending_users FROM users WHERE status = 'pending' AND role = 'student'")
            pending_users = cursor.fetchone()['pending_users']

        return jsonify({
            "total_items": total_items,
            "rented": rented,
            "pending": pending,
            "overdue": overdue,
            "pending_users": pending_users
        }), 200
    finally:
        conn.close()


@app.route('/api/dashboard/stats', methods=['GET'])
@admin_required
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

            cursor.execute("""
                SELECT items.name, COUNT(rentals.id) AS count
                FROM items
                LEFT JOIN rentals ON items.id = rentals.item_id
                GROUP BY items.id
                ORDER BY count DESC
                LIMIT 5
            """)

            count_item = cursor.fetchall()

        return jsonify({
            "categories": categories,
            "top_items": count_item
        }), 200
    finally:
        conn.close()


@app.route('/api/students/pending', methods=['GET'])
@admin_required
def dashboard_students():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, student_number, name, phone, DATE_FORMAT(created_at, '%Y/%m/%d') AS created_at
                FROM users WHERE status = 'pending'
            """)
            new_student = cursor.fetchall()

        return jsonify(new_student), 200
    finally:
        conn.close()


@app.route('/api/students/active', methods=['GET'])
@admin_required
def get_active_students():
    conn = get_connection()
    try:
        check_block_expired(conn)

        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, student_number, name, phone, overdue_count, status, block_period, DATE_FORMAT(created_at, '%Y/%m/%d') AS created_at
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
            if s['block_period']:
                s['block_period'] = s['block_period'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify(students), 200
    finally:
        conn.close()

@app.route('/api/students/<int:student_id>/approve', methods=['POST'])
@admin_required
def approve_student(student_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                  UPDATE users
                  SET status = 'active'
                  WHERE id = %s
                    AND status = 'pending' 
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


# 기존 신청자 승인하는 api 3개가 있었음 근디 이거 물품관리 바뀌면서 일단 지워둠 로그 남으니깐 필요하면 가져와

@app.route('/api/items/<int:item_id>/borrowers', methods=['GET'])
@admin_required
def get_item_borrowers(item_id):
    conn = get_connection()
    try:
        check_overdue_rentals(conn)
        check_block_expired(conn)

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
        check_overdue_rentals(conn)
        with conn.cursor() as cursor:
            sql = """
                SELECT r.id AS rental_id,
                       r.item_id,
                       i.name AS item_name,
                       DATE_FORMAT(r.requested_pickup_at, '%%Y-%%m-%%d') AS requested_pickup_at,
                       DATE_FORMAT(r.requested_return_at, '%%Y-%%m-%%d') AS requested_return_at,
                       r.status
                FROM rentals r
                JOIN items i ON r.item_id = i.id
                WHERE r.user_id = %s
                ORDER BY r.requested_pickup_at DESC
            """
            cursor.execute(sql, (user_id,))

            my_rentals = cursor.fetchall()
            sql_user = "SELECT overdue_count FROM users WHERE id = %s"
            cursor.execute(sql_user, (user_id,))
            user_info = cursor.fetchone()
            overdue_count = user_info['overdue_count'] if user_info else 0

        return jsonify(my_rentals), 200
    except Exception :
        return jsonify({"message": "데이터베이스 에러"}), 500
    finally:
        conn.close()

# 물품 업데이트, 나말고 사용할 곳이 어디있을지 있나? 물품 대여후에 처리? 필요없을거 같긴함
@app.route('/api/items/<int:item_id>/update', methods=['POST'])
@admin_required
def update_item(item_id):
    name = request.form.get("name")
    category_id = request.form.get("category_id")
    total_count = request.form.get("total_count")
    preparing = request.form.get("preparing")
    image = request.files.get("image")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            if image and image.filename != "":
                filename = str(item_id) + "_" + image.filename
                filepath = os.path.join(Itemimagefolder, filename)
                image.save(filepath)

                image_url = "/images/" + filename

                cursor.execute("""
                               UPDATE items
                               SET name            = %s,
                                   category_id     = %s,
                                   total_count     = %s,
                                   preparing_count = %s,
                                   img_url         = %s
                               WHERE id = %s
                               """, (name, category_id, total_count, preparing, image_url, item_id))
            else:
                cursor.execute("""
                               UPDATE items
                               SET name            = %s,
                                   category_id     = %s,
                                   total_count     = %s,
                                   preparing_count = %s
                               WHERE id = %s
                               """, (name, category_id, total_count, preparing, item_id))

        conn.commit()
        return "", 200

    finally:
        conn.close()


# 새 물품 추가하는 api
@app.route('/api/items/add', methods=['POST'])
@admin_required
def add_item():
    name = request.form.get("name")
    category_id = request.form.get("category_id")
    total_count = request.form.get("total_count")
    preparing = request.form.get("preparing")
    image = request.files.get("image")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           INSERT INTO items (name, category_id, total_count, preparing_count, img_url)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (name, category_id, total_count, preparing, ""))

            item_id = cursor.lastrowid

            if image and image.filename != "":
                filename = str(item_id) + "_" + image.filename
                filepath = os.path.join(Itemimagefolder, filename)
                image.save(filepath)

                image_url = "/images/" + filename

                cursor.execute("""
                               UPDATE items
                               SET img_url = %s
                               WHERE id = %s
                               """, (image_url, item_id))

        conn.commit()
        return "", 200

    finally:
        conn.close()


# 물품 삭제 api
@app.route('/api/items/<int:item_id>/delete', methods=['POST'])
@admin_required
def delete_item(item_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           DELETE
                           FROM items
                           WHERE id = %s
                           """, (item_id,))

        conn.commit()
        return "", 200

    except Exception:
        conn.rollback()
        return "", 404

    finally:
        conn.close()


# 물품 전체로그 가져오는 api
# 물품 전체 로그 api
@app.route('/api/items/<int:item_id>/logs', methods=['GET'])
@admin_required
def get_item_logs(item_id):
    conn = get_connection()
    try:
        check_overdue_rentals(conn)
        check_block_expired(conn)

        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT r.id   AS rental_id,
                                  r.user_id,
                                  r.item_id,
                                  r.quantity,
                                  r.requested_pickup_at,
                                  r.requested_return_at,
                                  r.status,
                                  r.created_at,
                                  u.name AS user_name,
                                  u.student_number,
                                  u.phone,
                                  u.overdue_count,
                                  i.name AS item_name,
                                  r.returned_at
                           FROM rentals r
                                    JOIN users u ON r.user_id = u.id
                                    JOIN items i ON r.item_id = i.id
                           WHERE r.item_id = %s
                           ORDER BY r.created_at DESC
                           """, (item_id,))

            rows = cursor.fetchall()

            for row in rows:
                row["requested_pickup_at"] = row["requested_pickup_at"].strftime("%Y-%m-%d %H:%M")
                row["requested_return_at"] = row["requested_return_at"].strftime("%Y-%m-%d %H:%M")
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M")

                if row["returned_at"]:
                    row["returned_at"] = row["returned_at"].strftime("%Y-%m-%d %H:%M")
                else:
                    row["returned_at"] = ""

            return jsonify(rows), 200

    finally:
        conn.close()


@app.route('/api/dashboard/today-schedule', methods=['GET'])
@admin_required
def today_schedule():
    conn = get_connection()
    try:
        check_block_expired(conn)

        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT r.id, DATE_FORMAT(r.requested_pickup_at,'%H:%i') AS time, u.name AS user_name, u.student_number, i.name AS item_name, r.quantity
                FROM rentals r
                JOIN users u ON r.user_id = u.id
                JOIN items i ON r.item_id = i.id
                WHERE DATE(r.requested_pickup_at) = CURDATE()
                  AND r.status ='approved'
                ORDER BY r.requested_pickup_at ASC
            """)
            pickups = cursor.fetchall()

            cursor.execute("""
                SELECT r.id, DATE_FORMAT(r.requested_return_at, '%H:%i') AS time, u.name AS user_name, u.student_number, i.name AS item_name, r.quantity
                FROM rentals r
                JOIN users u ON r.user_id = u.id
                JOIN items i ON r.item_id = i.id
                WHERE DATE(r.requested_return_at) = CURDATE()
                  AND r.status IN ('approved', 'rented', 'overdue')
                ORDER BY r.requested_return_at ASC
            """)
            returns = cursor.fetchall()

        return jsonify({
            "pickups": pickups,
            "returns": returns
        }), 200
    finally:
        conn.close()


@app.route('/api/dashboard/heatmap', methods=['GET'])
@admin_required
def dashboard_heatmap():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT DATE(requested_pickup_at) AS date, COUNT(*) AS count
                FROM rentals
                WHERE requested_pickup_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
                GROUP BY DATE(requested_pickup_at)
                ORDER BY date ASC
            """)
            rows = cursor.fetchall()
        return jsonify(rows), 200
    finally:
        conn.close()

 # 관리자 문의 목록 가져오기
@app.route('/api/admin/inquiries', methods=['GET'])
@admin_required
def get_admin_inquiries():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT i.id         AS inquiry_id,
                                  i.user_id,
                                  u.name       AS user_name,
                                  u.student_number,
                                  i.title,
                                  i.content,
                                  i.created_at,
                                  a.id         AS answer_id,
                                  a.content    AS answer_content,
                                  a.created_at AS answered_at,
                                  admin.name   AS admin_name,
                                  (SELECT COUNT(*) FROM inquiry_answers ia_count
                                   WHERE ia_count.inquiry_id = i.id
                                  ) AS answer_count
                           FROM inquiries i
                                    JOIN users u ON i.user_id = u.id
                                    LEFT JOIN inquiry_answers a
                                              ON a.id = (
                                                  SELECT ia.id
                                                  FROM inquiry_answers ia
                                                  WHERE ia.inquiry_id = i.id
                                                  ORDER BY ia.created_at DESC, ia.id DESC LIMIT 1
                                              )
                                    LEFT JOIN users admin ON a.admin_id = admin.id
                           ORDER BY i.created_at DESC
                           """)

            rows = cursor.fetchall()

            for row in rows:
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M")

                if row["answered_at"]:
                    row["answered_at"] = row["answered_at"].strftime("%Y-%m-%d %H:%M")
                else:
                    row["answered_at"] = ""

        return jsonify(rows), 200

    finally:
        conn.close()

@app.route('/api/students/<int:student_id>/block', methods=['POST'])
@admin_required
def block_student(student_id):
    data = request.get_json()
    block_type = data.get("type")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            #status가 blocked고 block_period가 null이면 영구차단임
            if block_type == "permanent":
                cursor.execute("""
                    UPDATE users
                    SET status = 'blocked', block_period = NULL
                    WHERE id = %s
                """, (student_id,))
            else:
                days = int(block_type)
                cursor.execute("""
                    UPDATE users
                    SET status = 'blocked', block_period = DATE_ADD(NOW(), INTERVAL %s DAY)
                    WHERE id = %s
                """, (days, student_id))
            conn.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route('/api/students/<int:student_id>/unblock', methods=['POST'])
@admin_required
def unblock_student(student_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE users
                SET status = 'active', block_period = NULL
                WHERE id = %s
            """, (student_id,))
            conn.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# 관리자 문의 답변 관리 함수
# 함수 잘못 넣어서 주석 된거 수정
@app.route('/api/admin/input_inquiries/<int:inquiry_id>/answer', methods=['POST'])
@admin_required
def save_admin_inquiry_answer(inquiry_id):
    data = request.get_json()

    admin_id = session.get("user_id")
    answer_content = data.get("answer_content")

    if answer_content == "":
        return jsonify({
            "success": False,
            "message": "답변 내용을 입력해주세요."
        }), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           INSERT INTO inquiry_answers (inquiry_id, admin_id, content)
                           VALUES (%s, %s, %s)
                           """, (inquiry_id, admin_id, answer_content))

            cursor.execute("""
                           UPDATE inquiries
                           SET status = 'answered'
                           WHERE id = %s
                           """, (inquiry_id,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "답변이 저장되었습니다."
        }), 200

    except Exception:
        conn.rollback()

        return jsonify({
            "success": False,
            "message": "답변 저장 중 오류가 발생했습니다."
        }), 500

    finally:
        conn.close()


@app.route('/api/admin/schedule-init-data', methods=['GET'])
@admin_required
def get_schedule_init_data():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, student_number FROM users WHERE role = 'admin'")
            admins = cursor.fetchall()
            cursor.execute("""
                           SELECT w.id,
                                  w.work_date,
                                  TIME_FORMAT(w.start_time, '%H:%i') AS start_time,
                                  TIME_FORMAT(w.end_time, '%H:%i')   AS end_time,
                                  w.admin_id,
                                  u.name                             AS admin_name
                           FROM work_schedules w
                                    LEFT JOIN users u ON w.admin_id = u.id
                           ORDER BY w.start_time ASC
                           """)
            schedules = cursor.fetchall()

            cursor.execute("SELECT id, closed_date, reason FROM closed_days")
            closed_days = cursor.fetchall()
            for row in closed_days:
                if row["closed_date"]:
                    row["closed_date"] = row["closed_date"].strftime("%Y-%m-%d")

        return jsonify({
            "admins": admins,
            "schedules": schedules,
            "closedDays": closed_days
        }), 200
    except Exception as e:
        return jsonify({"message": "서버 오류"}), 500
    finally:
        conn.close()

@app.route('/api/admin/work-schedules', methods=['POST'])
@admin_required
def add_work_schedule():
    data = request.get_json()
    work_date, start_time = data.get("work_date"), data.get("start_time")
    end_time, admin_id = data.get("end_time"), data.get("admin_id")
    if not all([work_date, start_time, end_time, admin_id]):
        return jsonify({"message": "입력을 완료해주세요"}), 400
    if start_time >= end_time:
        return jsonify({"message": "종료 시간은 시작 시간보다 늦어야 합니다."}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT id
                           FROM work_schedules
                           WHERE work_date = %s
                             AND start_time < %s
                             AND end_time > %s
                           """, (work_date, end_time, start_time))

            if cursor.fetchone():
                return jsonify({"message": "해당 시간에 이미 일정이 존재합니다"}), 409

            cursor.execute("""
                           INSERT INTO work_schedules (work_date, start_time, end_time, admin_id)
                           VALUES (%s, %s, %s, %s)
                           """, (work_date, start_time, end_time, admin_id))
        conn.commit()
        return jsonify({"message": "근무 등록 완료"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "서버 오류"}), 500
    finally:
        conn.close()

@app.route('/api/admin/work-schedules/<int:schedule_id>', methods=['PUT', 'DELETE'])
@admin_required
def manage_single_schedule(schedule_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            if request.method == 'PUT':
                admin_id = request.get_json().get("admin_id")
                cursor.execute("UPDATE work_schedules SET admin_id = %s WHERE id = %s", (admin_id, schedule_id))
                conn.commit()
                return jsonify({"message": "수정 완료"}), 200

            elif request.method == 'DELETE':
                cursor.execute("DELETE FROM work_schedules WHERE id = %s", (schedule_id,))
                conn.commit()
                return jsonify({"message": "삭제 완료"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "서버 오류"}), 500
    finally:
        conn.close()
@app.route('/api/admin/closed-days', methods=['POST'])
@admin_required
def add_closed_day():
    data = request.get_json()
    closed_date, reason = data.get("closed_date"), data.get("reason", "사유 없음")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM closed_days WHERE closed_date = %s", (closed_date,))
            if cursor.fetchone():
                return jsonify({"message": "이미 휴무일로 지정된 날짜입니다."}), 409

            cursor.execute("INSERT INTO closed_days (closed_date, reason) VALUES (%s, %s)", (closed_date, reason))
        conn.commit()
        return jsonify({"message": "등록 완료"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "서버 오류"}), 500
    finally:
        conn.close()
@app.route('/api/admin/closed-days/<int:day_id>', methods=['DELETE'])
@admin_required
def remove_closed_day(day_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM closed_days WHERE id = %s", (day_id,))
        conn.commit()
        return jsonify({"message": "삭제 완료"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "서버 오류"}), 500
    finally:
        conn.close()

@app.route('/api/closed-days', methods=['GET'])
def get_public_closed_days():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, closed_date, reason FROM closed_days")
            rows = cursor.fetchall()
            for row in rows:
                if row["closed_date"]:
                    # 프론트엔드와 비교하기 위해 YYYY-MM-DD 형식으로 맞춰줌
                    row["closed_date"] = row["closed_date"].strftime("%Y-%m-%d")
            return jsonify(rows), 200
    except Exception as e:
        print(f"휴무일 조회 에러: {e}")
        return jsonify({"message": "서버 오류"}), 500
    finally:
        conn.close()


@app.route('/api/users/<int:user_id>/inquiries', methods=['GET'])
def get_user_inquiries(user_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT i.id,
                                  i.title,
                                  i.content,
                                  i.status,
                                  DATE_FORMAT(i.created_at, '%%Y-%%m-%%d %%H:%%i') AS created_at,
                                  a.content                                        AS answer_content,
                                  DATE_FORMAT(a.created_at, '%%Y-%%m-%%d %%H:%%i') AS answered_at
                           FROM inquiries i
                                    LEFT JOIN inquiry_answers a ON a.id = (SELECT ia.id
                                                                           FROM inquiry_answers ia
                                                                           WHERE ia.inquiry_id = i.id
                                                                           ORDER BY ia.created_at DESC, ia.id
                                                                                                  DESC LIMIT 1
                               )
                           WHERE i.user_id = %s
                           ORDER BY i.created_at DESC
                           """, (user_id,))
            rows = cursor.fetchall()
        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"message": "문의 내역을 불러오는 중 에러가 발생했습니다."}), 500
# 관리자 대여 목록 가져오기
# 가져오는게 조금 많긴함 id 대여 물품 상태 등등
# 근무표도 가져와서 대여자가 누구인지도 보여줘야해서 코드가 많이 길어졌음 프론트처리도 가능할거 같은데
# 그냥 백쪽에서 끝내려고함
@app.route('/api/admin/rentals', methods=['GET'])
@admin_required
def get_admin_rentals():
    admin_id = session.get("user_id")

    conn = get_connection()
    try:
        check_overdue_rentals(conn)
        auto_reject_gigan_rentals(conn) #해당 자동 거절을 여기다둠 한번씩 관리자가 들어갈텐데 그때마다 자동 거절 되도록
        auto_gyeonggo_rentals(conn)

        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT r.id AS rental_id,
                                  r.user_id,
                                  r.item_id,
                                  r.quantity,
                                  r.requested_pickup_at,
                                  r.requested_return_at,
                                  r.status,
                                  r.approved_admin_id,
                                  r.approved_at,
                                  r.rented_at,
                                  r.returned_at,
                                  r.returned_admin_id,
                                  DATEDIFF(r.requested_return_at, NOW()) AS left_day,
                                  u.name AS user_name,
                                  u.student_number,
                                  u.phone,
                                  u.overdue_count,
                                  i.name AS item_name,
                                  i.category_id,
                                  c.name AS category_name,
                                  approved_admin.name AS approved_admin_name,
                                  returned_admin.name AS returned_admin_name,
                                  r.rented_admin_id,
                                  rented_admin.name AS rented_admin_name
                           FROM rentals r
                                    JOIN users u ON r.user_id = u.id
                                    JOIN items i ON r.item_id = i.id
                                    JOIN categories c ON i.category_id = c.id
                                    LEFT JOIN users approved_admin ON r.approved_admin_id = approved_admin.id
                                    LEFT JOIN users returned_admin ON r.returned_admin_id = returned_admin.id
                                    LEFT JOIN users rented_admin ON r.rented_admin_id = rented_admin.id
                           WHERE r.status IN ('pending', 'approved', 'rented', 'overdue', 'returned', 'rejected', 'canceled')
                           ORDER BY r.requested_pickup_at ASC
                           """)

            rows = cursor.fetchall()

            # 근무표는 따로 가져옴
            cursor.execute("""
                           SELECT ws.work_date,
                                  TIME_FORMAT(ws.start_time, '%H:%i') AS start_time,
                                  TIME_FORMAT(ws.end_time, '%H:%i') AS end_time,
                                  ws.admin_id,
                                  u.name AS admin_name
                           FROM work_schedules ws
                                    JOIN users u ON ws.admin_id = u.id
                           WHERE ws.work_date IN ('mon', 'tue', 'wed', 'thu', 'fri')
                           ORDER BY FIELD(ws.work_date, 'mon', 'tue', 'wed', 'thu', 'fri'), ws.start_time
                           """)

            schedules = cursor.fetchall()

            # 여기가 근무자 배정
            def find_schedule_worker(time_value):
                if not time_value:
                    return None

                week_number = time_value.weekday()

                if week_number > 4:
                    return None

                day_names = ["mon", "tue", "wed", "thu", "fri"]
                day_name = day_names[week_number]

                time_text = time_value.strftime("%H:%M")

                for schedule in schedules:
                    if schedule["work_date"] == day_name:
                        if schedule["start_time"] <= time_text < schedule["end_time"]:
                            return schedule

                return None

            # 당일 근무시 체크점 나누려고
            def is_today(time_value):
                if not time_value:
                    return False

                return time_value.date() == datetime.today().date()

            for row in rows:
                pickup_worker = find_schedule_worker(row["requested_pickup_at"])

                return_worker = find_schedule_worker(row["requested_return_at"])

                if pickup_worker:
                    row["pickup_admin_id"] = pickup_worker["admin_id"]
                    row["pickup_admin_name"] = pickup_worker["admin_name"]
                else:
                    row["pickup_admin_id"] = ""
                    row["pickup_admin_name"] = ""

                if return_worker:
                    row["return_admin_id"] = return_worker["admin_id"]
                    row["return_admin_name"] = return_worker["admin_name"]
                else:
                    row["return_admin_id"] = ""
                    row["return_admin_name"] = ""

                row["my_part"] = ""

                if row["status"] == "pending":
                        if pickup_worker and str(pickup_worker["admin_id"]) == str(admin_id):
                            row["my_part"] = "approve"

                if row["status"] == "approved":
                    if is_today(row["requested_pickup_at"]):
                        if pickup_worker and str(pickup_worker["admin_id"]) == str(admin_id):
                            row["my_part"] = "pickup"

                if row["status"] == "rented":
                    if is_today(row["requested_return_at"]):
                        if return_worker and str(return_worker["admin_id"]) == str(admin_id):
                            row["my_part"] = "return"

                if row["status"] == "overdue":
                    if return_worker and str(return_worker["admin_id"]) == str(admin_id):
                        row["my_part"] = "overdue"

                #여기가 1. 실제 누른사람 2. 근무표 3. - 로 표시
                # 사실상 근무표 우선으로 하되 누군가 누르면 그사람으로 로그 남게
                if row["rented_admin_name"]:
                    row["display_admin_name"] = row["rented_admin_name"]
                elif row["pickup_admin_name"]:
                    row["display_admin_name"] = row["pickup_admin_name"]
                else:
                    row["display_admin_name"] = "-"

                if row["returned_admin_name"]:
                    row["display_return_admin_name"] = row["returned_admin_name"]
                elif row["return_admin_name"]:
                    row["display_return_admin_name"] = row["return_admin_name"]
                else:
                    row["display_return_admin_name"] = "-"

                row["requested_pickup_at"] = row["requested_pickup_at"].strftime("%Y-%m-%d %H:%M")
                row["requested_return_at"] = row["requested_return_at"].strftime("%Y-%m-%d %H:%M")
                row["approved_at"] = row["approved_at"].strftime("%Y-%m-%d %H:%M") if row["approved_at"] else ""
                row["rented_at"] = row["rented_at"].strftime("%Y-%m-%d %H:%M") if row["rented_at"] else ""
                row["returned_at"] = row["returned_at"].strftime("%Y-%m-%d %H:%M") if row["returned_at"] else ""

        return jsonify(rows), 200

    finally:
        conn.close()

# 수령 확인
@app.route('/api/admin/rentals/<int:rental_id>/rent', methods=['POST'])
@admin_required
def admin_rental_rent(rental_id):
    admin_id = session.get("user_id")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           UPDATE rentals
                           SET status = 'rented',
                               rented_at = NOW(),
                               rented_admin_id = %s
                           WHERE id = %s
                             AND status = 'approved'
                           """, (admin_id,rental_id))

        conn.commit()

        if cursor.rowcount == 0:
            return "", 400

        return "", 200

    except Exception:
        conn.rollback()
        return "", 500

    finally:
        conn.close()


# 반납 확인
@app.route('/api/admin/rentals/<int:rental_id>/return', methods=['POST'])
@admin_required
def admin_rental_return(rental_id):
    admin_id = session.get("user_id")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           UPDATE rentals
                           SET status = 'returned',
                               returned_at = NOW(),
                               returned_admin_id = %s
                           WHERE id = %s
                             AND status IN ('rented', 'overdue')
                           """, (admin_id, rental_id))

        conn.commit()

        if cursor.rowcount == 0:
            return "", 400

        return "", 200

    except Exception:
        conn.rollback()
        return "", 500

    finally:
        conn.close()

# 예약 승인
# 수정사항 1
# 승인할때 쭈르륵 받아버려서 전체수량보다 오버가 된다면?
# 이떄를 방지하기 위해서 승인시 그 시간대에 해당 물품의 대여 가능상태가 총 몇개인지 작성
# 서브쿼리가 하는일이 대여가능 수량 계산하는건데 먼저 sum을 구할때는 자기자신 제이하고 승인, 대여, 연체중인것들이랑 연체제외 정상적으로 반납되는 시간들일때를 뺌
# 그 외에 특이사항은 추후 피드백 통해서
@app.route('/api/admin/rentals/<int:rental_id>/approve', methods=['POST'])
@admin_required
def admin_rental_approve(rental_id):
    admin_id = session.get("user_id")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT r.id,
                                  r.quantity,
                                  ( i.total_count - i.preparing_count - COALESCE((SELECT SUM(gigan.quantity) FROM rentals gigan
                                                                                  WHERE gigan.item_id = r.item_id
                                                                                    AND gigan.id != r.id
                                                                                    AND gigan.status IN ('approved', 'rented', 'overdue')
                                                                                    AND ( gigan.status = 'overdue' OR ( gigan.requested_pickup_at < r.requested_return_at AND gigan.requested_return_at > r.requested_pickup_at))
                                                                                    ), 0)) AS available,
                                  u.phone,
                                  i.name AS item_name
                           FROM rentals r
                                    JOIN items i ON r.item_id = i.id
                                    JOIN users u ON r.user_id = u.id
                           WHERE r.id = %s
                             AND r.status = 'pending'
                           """, (rental_id,))

            rental = cursor.fetchone()

            if rental is None:
                return jsonify({
                    "message": "예약 정보가 없습니다."
                }), 400

            if rental["available"] < rental["quantity"]:
                return jsonify({
                    "message": "해당 시간대에 사용 가능한 물품 수량이 부족합니다."
                }), 400

            cursor.execute("""
                           UPDATE rentals
                           SET status            = 'approved',
                               approved_admin_id = %s,
                               approved_at       = NOW()
                           WHERE id = %s
                             AND status = 'pending'
                           """, (admin_id, rental_id))

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({
                    "message": "이미 처리된 예약입니다."
                }), 400

        conn.commit()
        try:
            message_service = SolapiMessageService(
                api_key=os.getenv("SOLAPI_API_KEY"),
                api_secret=os.getenv("SOLAPI_API_SECRET")
            )
            message = RequestMessage(
                from_=os.getenv("SOLAPI_FROM_NUMBER"),
                to=rental["phone"],
                subject="소프트웨어학부 학생회 Knock",
                text=f"[소프트웨어학부 학생회 Knock]\n\n신청하신 '{rental['item_name']}' 물품 대여가 승인되었습니다."
            )

            message_service.send(message)
            print(f"SMS 발송 성공: {rental['phone']}")
        except Exception as sms_error:
            print(f"SMS 발송 실패: {str(sms_error)}")
        return "", 200

    except Exception:
        conn.rollback()
        return jsonify({
        "message": "예약 승인 처리 중 오류가 발생했습니다."
        }), 500

    finally:
        conn.close()


# 예약 거절
# 수정사항 1. 장난으로 거절하는 관리자 로그 관리 추가했음
@app.route('/api/admin/rentals/<int:rental_id>/reject', methods=['POST'])
@admin_required
def admin_rental_reject(rental_id):
    admin_id = session.get("user_id")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                           UPDATE rentals
                           SET status = 'rejected',
                               reject_reason = %s
                           WHERE id = %s
                             AND status = 'pending'
                           """, (admin_id, rental_id))

            if cursor.rowcount == 0:
                conn.rollback()
                return "", 400

        conn.commit()
        return "", 200

    except Exception:
        conn.rollback()
        return "", 500

    finally:
        conn.close()

#렌딩페이지를 위한 api
# 활동이미지 출력하고 싶어서 새로운 db 테이블 만듬
#주의사항으로는 LandingPage 요소와 무조건 동일하게 보내셈
@app.route('/api/landing/stats', methods=['GET'])
def get_landing_stats():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) AS user_count
                FROM users
                WHERE role = 'student'
            """)
            user_count = cursor.fetchone()["user_count"]

            cursor.execute("""
                SELECT COUNT(*) AS active_user_count
                FROM users
                WHERE role = 'student'
                  AND status = 'active'
            """)
            active_user_count = cursor.fetchone()["active_user_count"]

            cursor.execute("""
                SELECT i.id AS item_id,
                       i.name AS item_name,
                       i.total_count,
                       COALESCE(SUM(
                           CASE
                               WHEN r.status IN ('approved', 'rented', 'overdue')
                               THEN r.quantity
                               ELSE 0
                           END
                       ), 0) AS rental_count
                FROM items i
                LEFT JOIN rentals r ON r.item_id = i.id
                GROUP BY i.id, i.name, i.total_count
                ORDER BY rental_count DESC, i.id ASC
            """)
            rental_rows = cursor.fetchall()

            rental_item_list = []
            for row in rental_rows:
                rental_rate = 0
                if row["total_count"] > 0:
                    rental_rate = round((row["rental_count"] / row["total_count"]) * 100)

                rental_item_list.append({
                    "item_id": row["item_id"],
                    "item_name": row["item_name"],
                    "total_count": row["total_count"],
                    "rental_count": row["rental_count"],
                    "rental_rate": rental_rate
                })

            cursor.execute("""
                SELECT COUNT(*) AS month_rental_count
                FROM rentals
                WHERE requested_return_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
                  AND status IN ('rented', 'overdue', 'returned')
            """)
            month_rental_count = cursor.fetchone()["month_rental_count"]

            cursor.execute("""
                SELECT COUNT(*) AS month_overdue_count
                FROM rentals
                WHERE requested_return_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
                  AND status = 'overdue'
            """)
            month_overdue_count = cursor.fetchone()["month_overdue_count"]

            overdue_rate = 0
            if month_rental_count > 0:
                overdue_rate = round((month_overdue_count / month_rental_count) * 100)

            cursor.execute("""
                SELECT i.id AS item_id,
                       i.name AS popular_item,
                       COUNT(*) AS popular_count
                FROM rentals r
                JOIN items i ON r.item_id = i.id
                WHERE r.status IN ('approved', 'rented', 'overdue', 'returned')
                GROUP BY i.id, i.name
                ORDER BY popular_count DESC
                LIMIT 5
            """)
            popular_item_list = cursor.fetchall()

            popular_item = "-"
            popular_count = 0
            if len(popular_item_list) > 0:
                popular_item = popular_item_list[0]["popular_item"]
                popular_count = popular_item_list[0]["popular_count"]

            cursor.execute("""
                SELECT COUNT(*) AS today_apply_count
                FROM rentals
                WHERE DATE(created_at) = CURDATE()
            """)
            today_apply_count = cursor.fetchone()["today_apply_count"]

            cursor.execute("""
                SELECT COUNT(*) AS today_pickup_count
                FROM rentals
                WHERE DATE(requested_pickup_at) = CURDATE()
                  AND status IN ('approved', 'rented', 'overdue', 'returned')
            """)
            today_pickup_count = cursor.fetchone()["today_pickup_count"]

            cursor.execute("""
                SELECT COUNT(*) AS today_return_count
                FROM rentals
                WHERE DATE(requested_return_at) = CURDATE()
                  AND status IN ('rented', 'overdue', 'returned')
            """)
            today_return_count = cursor.fetchone()["today_return_count"]

        return jsonify({
            "user_count": user_count,
            "active_user_count": active_user_count,
            "rental_item_list": rental_item_list,
            "popular_item": popular_item,
            "popular_count": popular_count,
            "popular_item_list": popular_item_list,
            "month_rental_count": month_rental_count,
            "month_overdue_count": month_overdue_count,
            "overdue_rate": overdue_rate,
            "today_apply_count": today_apply_count,
            "today_pickup_count": today_pickup_count,
            "today_return_count": today_return_count
        }), 200

    finally:
        conn.close()


@app.route('/api/activity-img', methods=['GET'])
def get_activity_img():
    conn = get_connection()
    try:
        sync_activity_img_once_a_day(conn)

        with conn.cursor() as cursor:
            cursor.execute("""
                           SELECT id, img_src, link_url
                           FROM activity_img
                           ORDER BY id DESC
                           """)
            rows = cursor.fetchall()

        return jsonify(rows), 200

    finally:
        conn.close()

if __name__ == "__main__":
    app.run(port=8000, debug=False)
