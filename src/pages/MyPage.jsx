import { useState, useEffect } from "react";
import "./MyPage.css";

export default function MyPage() {
    const useString = localStorage.getItem("user") || sessionStorage.getItem("user");
    const user = JSON.parse(useString);
    const [rentalData, setRentalData] = useState({
        active: [],
        pending: [],
        history: []
    });

    const [inquiryData, setInquiryData] = useState([]);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.id) return;
        setIsLoading(true);

        const fetchRentals = fetch(`http://localhost:8000/api/rentals?user_id=${user.id}`)
            .then((res) => res.json())
            .then((data) => {
                const safeData = Array.isArray(data.rentals) ? data.rentals : [];
                setRentalData({
                    active: data.filter(item => ['rented', 'approved', 'overdue'].includes(item.status)),
                    pending: data.filter(item => item.status === 'pending'),
                    history: data.filter(item => ['returned', 'rejected'].includes(item.status)).slice(0, 2)
                });
                if (data.overdue_count !== undefined) {
                    const updatedUser = { ...user, overdue_count: data.overdue_count };
                    if (localStorage.getItem("user")) localStorage.setItem("user", JSON.stringify(updatedUser));
                    if (sessionStorage.getItem("user")) sessionStorage.setItem("user", JSON.stringify(updatedUser));
                }
            })
            .catch((err) => console.log(err));

        const fetchInquiries = fetch(`http://localhost:8000/api/users/${user.id}/inquiries`)
            .then((res) => res.json())
            .then((data) => {
                setInquiryData(Array.isArray(data) ? data : []);
            })
            .catch((err) => console.log(err));
        Promise.all([fetchRentals, fetchInquiries]).finally(() => setIsLoading(false));
    }, [user?.id]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        alert("로그아웃");
        window.location.href = "/";
    };

    if (!user) {
        return (
            <div className="app flex items-center justify-center">
                <div className="section-title text-gray-600">로그인을 진행해주세요</div>
            </div>
        );
    }

    const getStatusUI = (status) => {
        switch (status) {
            case 'pending': return { text: '승인 대기', className: 'badge-yellow' };
            case 'approved': return { text: '승인 완료', className: 'badge-green' };
            case 'rented': return { text: '대여중', className: 'badge-green' };
            case 'overdue': return { text: '연체됨', className: 'badge-red' };
            case 'returned': return { text: '반납 완료', className: 'badge-gray' };
            case 'rejected': return { text: '거절됨', className: 'badge-red' };
            default: return { text: status, className: 'badge-gray' };
        }
    };

    const renderList = (items, emptyMessage) => {
        if (isLoading) return <div className="card empty-card">데이터를 불러오는 중입니다</div>;
        if (items.length === 0) return <div className="card empty-card">{emptyMessage}</div>;
        return (
            <div className="rental-list-container">
                {items.map((item) => {
                    const statusUI = getStatusUI(item.status);
                    return (
                        <div key={item.rental_id} className="rental-list-item">
                            <div className="rental-item-info">
                                <h4>{item.item_name}</h4>
                                <p>신청/대여일 : {item.requested_pickup_at}</p>
                                <p>반납 (예정)일 : {item.requested_return_at}</p>
                            </div>
                            <div className="rental-item-status">
                                <span className={`badge ${statusUI.className}`}>
                                    {statusUI.text}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };
    const renderInquiryList = () => {
        if (isLoading) return <div className="card empty-card">데이터를 불러오는 중입니다</div>;
        if (inquiryData.length === 0) return <div className="card empty-card">작성한 문의 내역이 없습니다.</div>;

        return (
            <div className="rental-list-container">
                {inquiryData.map((item) => {
                    const isAnswered = item.status === 'answered' || item.answer_content;

                    return (
                        <div
                            key={item.id}
                            className={`rental-list-item ${isAnswered ? 'inquiry-clickable' : ''}`}
                            onClick={() => {
                                if (isAnswered) setSelectedInquiry(item);
                            }}
                        >
                            <div className="rental-item-info">
                                <h4>{item.title}</h4>
                                <p>작성일 : {item.created_at}</p>
                            </div>
                            <div className="rental-item-status">
                                <span className={`badge ${isAnswered ? 'badge-green' : 'badge-yellow'}`}>
                                    {isAnswered ? '답변 완료(클릭해주세요!)' : '답변 대기'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    let inquiryPopup = "";
    if (selectedInquiry !== null) {
        inquiryPopup = (
            <div>
                <div className="faqopenbg" onClick={() => setSelectedInquiry(null)}></div>

                <div className="faqdetail mypage-inquiry-detail">
                    <button className="faqclose" onClick={() => setSelectedInquiry(null)}>x</button>
                    <h3>[문의 제목] {selectedInquiry.title}</h3>
                    <p className="q-content">{selectedInquiry.content}</p>

                    <div className="a-section">
                        <h3 className="a-title">관리자</h3>
                        <p className="a-content">{selectedInquiry.answer_content}</p>
                        <p className="a-date">답변일: {selectedInquiry.answered_at}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app bg-gray-50 pt-10 ph-20">
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
                                {user.name ? user.name : "학생"}
                            </span>
                            <div className="space-y-5">
                                <div className="userinfotitle">
                                    학번
                                    <span className="userinfo">{user.studentid}</span>
                                </div>
                                <div className="userinfotitle">
                                    전화번호
                                    <span className="userinfo">{user.phone ? user.phone : "010-1234-5678"}</span>
                                </div>
                                <div className="userinfotitle">
                                    연체횟수
                                    <span className="userinfo red">{user.overdue_count ? `${user.overdue_count}회` : "0회"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-2/3 space-y-8">
                        <section>
                            <h3 className="sectiontitle">대여 물품</h3>
                            {renderList(rentalData.active, "현재 대여 중인 물품이 없습니다.")}
                        </section>
                        <section>
                            <h3 className="sectiontitle">대여 신청 현황</h3>
                            {renderList(rentalData.pending, "현재 대기 중인 대여 신청이 없습니다.")}
                        </section>
                        <section>
                            <h3 className="sectiontitle">최근 대여 기록</h3>
                            {renderList(rentalData.history, "최근 대여 기록이 없습니다.")}
                        </section>
                        <section>
                            <h3 className="sectiontitle">내 문의 사항</h3>
                            {renderInquiryList()}
                        </section>
                    </div>
                </div>
            </div>

            {inquiryPopup}
        </div>
    );
}