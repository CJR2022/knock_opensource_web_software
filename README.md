# 학과 물품 대여 시스템

학생증 QR을 통한 인증으로 회원가입을 하고, 관리자 페이지에서 학생 승인, 물품 관리, 대여 관리를 처리하는 학과 물품 대여 시스템입니다.

## 팀원

| 학번         | 이름 |
|------------|------|
| 2022041006 | 김건우 |
| 2022041038 | 박정환 |
| 2022041015 | 최정륜 |

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React, Vite |
| 백엔드 | Flask |
| 데이터베이스 | MySQL (PyMySQL) |
| 기타 | OpenCV, pyzbar (QR 인식) |

## 주요 기능

- **회원가입 / 로그인**: 학생증 QR 코드 인증을 통한 회원가입, 관리자 승인 후 서비스 이용
- **물품 대여**: 카테고리별 물품 조회 및 대여 신청, 반납 예약
- **문의사항**: 문의사항 작성
- **마이페이지**: 나의 대여 현황 조회 및 문의사항 확인
- **관리자 페이지**
  - 학생 승인 / 차단 / 해제
  - 물품 등록 / 수정 / 삭제
  - 대여 신청 승인 / 거절 / 수령 확인 / 반납 처리
  - 근무 일정 관리
  - 문의사항 답변
  - 대시보드 (통계, 히트맵, 오늘의 일정)

---

## 실행 방법

### 프로젝트 클론

```bash
git clone https://github.com/CJR2022/knock_opensource_web_software.git
```

### .env 설정(localhost)
`mysql DB import 필요` 
```
https://github.com/CJR2022/knock_opensource_web_software/releases/tag/DB_preview
```
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=knock
```

---

### 프론트엔드 실행

```bash
npm install
npm run dev
```

- 기본 주소: `http://localhost:5173`

---

### 백엔드 실행

```bash
# 가상환경 생성
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# 패키지 설치
pip install -r requirements.txt

# 서버 실행
python app.py
```

- API 기본 주소: `http://localhost:8000`

### 협업용 노션 주소
`
https://app.notion.com/p/35eee8c8240c80abb859eec2b60f67dc?v=35eee8c8240c802ba118000ca478d883
`
