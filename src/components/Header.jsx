import { useLocation } from "react-router-dom"; //현 URL 정보 가져오는 친구
import { Link, useNavigate} from "react-router-dom";

//헤더 메뉴탭도 NavLink 방식으로 바꿀검다

const tabs = [
  { id: "main", label: "메인", href: "/" },
  { id: "inquiry", label: "문의사항", href: "/inquiry" },
  { id: "admin", label: "관리자", href: "/admin" },
];

export default function Header() {
  const location = useLocation(); //URL 정보 가져오기
  const pathname = location.pathname;//슬래시~ 내용 ex)"/admin"
  const activeTab = pathname === "/" ? "main" :
                   pathname === "/inquiry" ? "inquiry" : "admin";
  const userstring= localStorage.getItem("username")|| sessionStorage.getItem("username");
  const user= userstring ? JSON.parse(userstring) : null;



  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <a href="/" className="logo">
            <div className="logo-icon">
              <span>K</span>
            </div>
            <span className="logo-text">KNOCK</span>
          </a>

          <nav className="nav-pill">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={tab.href}
                className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="header-right">
          {user ?(
              <Link to="/mypage" className="btn btn-primary inline-block text-center pt-2">
            마이 페이지
          </Link>

          ) :(

        <Link to="/login" className="btn btn-primary inline-block text-center pt-2">
            로그인
          </Link>
              )}
          </div>
      </div>
        </header>
  );
}
