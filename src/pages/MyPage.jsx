import React from "react";

export default function MyPage() {
    const useString= localStorage.getItem("user")||sessionStorage.getItem("user");
    const user= JSON.parse(useString);

    const handleLogout = () => {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        alert("로그아웃");
        window.location.href="/";
    };

    if(!user){
        return(

            <div className="app flex items-center justify-center">
                <div className="section-title text-gray-600">로그인을 진행해주세요</div>
            </div>
        );
    }

    return (
        <div className="app bg-gray-50  pt-10  ph-20">
            <div className="page">
                <div className="flex justify-between items-end border-b-2 border-black pb-3 mb-8">
                    <h2 className="text-2xl font-black tracking-tight">마이페이지</h2>
                    <button onClick={handleLogout} className="btn btn-primary text-xs font black">
                        로그아웃
                    </button>
                </div>
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-1/3">
                        <div className="card p-6 sticky top-24">
                            <span className="badge bg-black text-white px-3 px-1 mb-6 text-sm">
                                {user.name? user.name: "학생"}
                            </span>
                            <div className="space-y-5">
                                <div className="userinfotitle">
                                    학번
                                    <span className="userinfo">{user.studentid}</span>
                                </div>
                                <div className="userinfotitle">
                                    전화번호
                                    <span className="userinfo">{user.phone?user.phone : "010-1234-5678"}</span>
                                </div>
                                <div className="userinfotitle">
                                    연체횟수
                                    <span className="userinfo red">{user.overdue_count?`${user.overdue_count}회`: "0회"}</span>
                                </div>

                            </div>

                        </div>
                    </div>

                    <div className="w-full lg:w-2/3" space-y-8>

                    <section>
                        <h3 className="sectiontitle">대여 물품</h3>
                        <div className="card empty-card">추후 구현</div>
                    </section>
                    <section>
                        <h3 className="sectiontitle">대여 신청 현황</h3>
                        <div className="card empty-card">추후 구현</div>
                    </section>
                    <section>
                        <h3 className="sectiontitle">최근 대여 기록</h3>
                        <div className="card empty-card">추후 구현</div>
                    </section>
                    <section>
                        <h3 className="sectiontitle">내 문의 사항</h3>
                        <div className="card empty-card">추후 구현</div>
                    </section>

                </div>


                </div>


            </div>
        </div>
    );
}