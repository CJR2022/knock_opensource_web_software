import { useLocation } from "react-router-dom"; //현 URL 정보 가져오는 친구

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

        <button className="btn btn-primary">
          관리자 A
        </button>
      </div>
    </header>
  );
}
