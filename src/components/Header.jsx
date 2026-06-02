import { Link, useNavigate} from "react-router-dom";
import { NavLink } from "react-router-dom";

const tabs = [
  { id: "main", label: "메인", href: "/" },
  { id: "items", label: "물품대여", href: "/items" },
  { id: "inquiry", label: "문의사항", href: "/inquiry" },
  { id: "admin", label: "관리자", href: "/admin" },
];

export default function Header() {
  const userstring= localStorage.getItem("user")|| sessionStorage.getItem("user");
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
            {tabs.map((tab) => {
              //user가 null일때 user.role에 접근하면 사이트가 죽어버림 -> and단축평가로 회피
              if (tab.id==="admin" && !(user&&user.role==="admin")) {
                return null;
              }
              return (
                <NavLink
                  key={tab.id}
                  to={tab.href}
                  className={({isActive})=>isActive?"nav-tab active":"nav-tab"}
                >
                  {tab.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="header-right">
          {user ?(
              <Link to="/myPage" className="btn btn-primary inline-block text-center pt-2">
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
