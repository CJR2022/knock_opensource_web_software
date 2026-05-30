import { Outlet, NavLink } from "react-router-dom";
import dashboardIcon from "../../assets/icons/dashboard.svg";
import inquiryIcon from "../../assets/icons/inquiry.svg";
import itemIcon from "../../assets/icons/item.svg";
import rentalIcon from "../../assets/icons/rental.svg";
import scheduleIcon from "../../assets/icons/schedule.svg";
import studentIcon from "../../assets/icons/student.svg";

const menu = [
    { path: "/admin", label: "대시보드", icon: dashboardIcon },
    { path: "/admin/StudentManager", label: "학생", icon: studentIcon },
    { path: "/admin/ItemManager", label: "물품", icon: itemIcon },
    { path: "/admin/ScheduleManager", label: "스케줄", icon: scheduleIcon },
    { path: "/admin/RentalManager", label: "대여", icon: rentalIcon },
    { path: "/admin/AdminInquiry", label: "문의", icon: inquiryIcon },
    
    
];

//NavLink에 쓴 isActive는 라이브러리에서 자체적으로 계산되는 변수임 현재URL이랑 to URL이랑 비교해서 T/F 값 저장
export default function AdminLayout() {
    return (
        <div className="admin-layout flex flex-col md:flex-row min-h-[100dvh]">
            {/* 데스크탑 사이드바 */}
            <aside className="hidden md:flex admin-sidebar flex-col">
                <nav className="admin-sidebar-nav">
                    {menu.map((m) => (
                        <NavLink
                            key={m.path}
                            to={m.path}
                            end
                            className={({ isActive }) =>
                                isActive ? "admin-sidebar-item active" : "admin-sidebar-item"
                            }
                        >
                            <img src={m.icon} alt={m.label} className="admin-sidebar-icon" />
                            <span className="admin-sidebar-label">{m.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="flex-1 admin-content pb-15 md:pb-0">
                <Outlet />
            </main>

            {/* 모바일 하단 네비게이션 */}
            <nav className="flex md:hidden admin-bottom-nav">
                {menu.map((m) => (
                    <NavLink
                        key={m.path}
                        to={m.path}
                        end
                        className={({ isActive }) =>
                            isActive ? "admin-bottom-nav-item active" : "admin-bottom-nav-item"
                        }
                    >
                        <img src={m.icon} alt={m.label} className="admin-bottom-nav-icon" />
                        <span className="admin-bottom-nav-label">{m.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
