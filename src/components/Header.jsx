import { NavLink} from "react-router-dom";

const tabs = [
  { id: "main", label: "메인", href: "/" },
  { id: "inquiry", label: "문의사항", href: "/inquiry" },
  { id: "admin", label: "관리자", href: "/admin" },
];

export default function Header() {
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

        <button className="btn btn-primary">
          관리자 A
        </button>
      </div>
    </header>
  );
}
