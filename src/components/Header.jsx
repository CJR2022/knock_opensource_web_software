import { Link, useNavigate} from "react-router-dom";
import { NavLink } from "react-router-dom";
import userIcon from "../assets/icons/user.svg";
import loginIcon from "../assets/icons/login.svg";

const tabs = [
  { id: "main", label: "메인", href: "/" },
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
            <span className="logo-text hidden sm:inline">KNOCK</span>
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
          {user ? (
            <>
              <Link to="/mypage" className="btn btn-primary hidden sm:inline-block text-center pt-2">
                마이 페이지
              </Link>
              <Link to="/mypage" className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full bg-black text-white">
                <img src={userIcon} alt="마이페이지" className="w-5 h-5 invert" />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary hidden sm:inline-block text-center pt-2">
                로그인
              </Link>
              <Link to="/login" className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full bg-black text-white">
                <img src={loginIcon} alt="로그인" className="w-5 h-5 invert" />
              </Link>
            </>
          )}
        </div>
      </div>
        </header>
  );
}
