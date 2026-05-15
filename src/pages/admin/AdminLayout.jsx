import { Outlet, NavLink } from "react-router-dom";


const menu = [
    { path: "/admin", label: "대시보드"},
    { path: "/admin/AdminInquiry", label: "문의사항"},
    { path: "/admin/ItemManager", label: "물품관리"},
    { path: "/admin/RentalManager", label: "대여관리"},
    { path: "/admin/ScheduleManager", label: "스케줄관리"},
    { path: "/admin/StudentManager", label: "학생관리"}
];

//NavLink에 쓴 isActive는 라이브러리에서 자체적으로 계산되는 변수임 현재URL이랑 to URL이랑 비교해서 T/F 값 저장
export default function AdminLayout() {
    return(
        <>
        <ul className="flex" style={{gap: 10}}>
            {menu.map((m) => (
                <li>
                    <NavLink to={m.path} end style={({isActive})=>(isActive?{background: "gray"}: null)}>
                        {m.label}
                    </NavLink>
                </li>
            )
            )}
        </ul>
        <Outlet></Outlet>
        </>
    );
    
}
