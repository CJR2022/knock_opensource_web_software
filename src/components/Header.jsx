import { Link, useNavigate} from "react-router-dom";
import { NavLink } from "react-router-dom";

const tabs = [
  { id: "main", label: "메인", href: "/" },
  { id: "inquiry", label: "문의사항", href: "/inquiry" },
  { id: "admin", label: "관리자", href: "/admin" },
];

export default function Header() {
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
              <NavLink
                key={tab.id}
                to={tab.href}
                className={({isActive})=>isActive?"nav-tab active":"nav-tab"}
              >
                {tab.label}
              </NavLink>
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
