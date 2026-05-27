import {useEffect, useState} from "react";
import "../../ItemManager.css";

export default function ItemManager() {
    const [mulphonlist, setmulphonlist] = useState([]);
    const [mulphoncall, setmulphoncall] = useState(true);
    const [selectmulphon, setselectmulphon] = useState(null);
    const [mulphonmode, setmulphonmode] = useState("");
    let mulphonopen = "";

    /*신청자 확인 구현*/
    const [sincheongjalist, setsincheongjalist] = useState([]);
    const [sincheongjacall, setsincheongjacall] = useState(false);
    const [selectrental, setselectrental] = useState(null);
    const [sincheongja_info, setsincheongja_info] = useState(null);

    function getmulphon() {
        setmulphoncall(true);

        fetch("http://localhost:8000/api/items")
            .then((res) => res.json())
            .then((data) => {
                setmulphonlist(data);
                setmulphoncall(false);
            })
            .catch(() => {
                setmulphoncall(false);
            });
    }

    useEffect(() => {
        getmulphon();
    }, []);

    /*신청자 확인*/
    function sincheongja_click(mulphon) {
        setselectmulphon(mulphon);
        setmulphonmode("sincheongja_check");
        setselectrental(null);
        setsincheongja_info(null);
        getsincheongja(mulphon.id);
    }

    function borrower_click(mulphon) {
        setselectmulphon(mulphon);
        setmulphonmode("borrower_check");
    }

    function mulphon_count_click(mulphon) {
        setselectmulphon(mulphon);
        setmulphonmode("mulphon_count");
    }

    function opennewmulphon() {
        setselectmulphon(null);
        setmulphonmode("new_mulphon_add");
    }

    function closemulphon() {
        setselectmulphon(null);
        setmulphonmode("");
        setsincheongjalist([]);
        setselectrental(null);
        setsincheongja_info(null);
    }

    /*신청자 확인 구현*/
    function getsincheongja(itemid) {
        setsincheongjacall(true);

        fetch("http://localhost:8000/api/items/" + itemid + "/applicants")
            .then((res) => res.json())
            .then((data) => {
                setsincheongjalist(data);
                setsincheongjacall(false);
            })
            .catch(() => {
                setsincheongjacall(false);
            });
    }

    function showdate(datetime) {
        return datetime.substring(5, 7) + "." + datetime.substring(8, 10);
    }

    function showtime(datetime) {
        return datetime.substring(11, 16);
    }

    function openapprove(rental) {
        setselectrental(rental);
        setsincheongja_info(null);
    }

    function closeapprove() {
        setselectrental(null);
    }

    function sincheongja_openinfo(rental) {
        setsincheongja_info(rental);
        setselectrental(null);
    }

    function sincheongja_closeinfo() {
        setsincheongja_info(null);
    }

    function approverental(rentalid) {
        let userstring = localStorage.getItem("user") || sessionStorage.getItem("user");
        let user = userstring ? JSON.parse(userstring) : null;

        fetch("http://localhost:8000/api/rentals/" + rentalid + "/approve", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                admin_id: user.id,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                alert(data.message);
                setselectrental(null);
                getsincheongja(selectmulphon.id);
                getmulphon();
            });
    }

    function rejectrental(rentalid) {
        fetch("http://localhost:8000/api/rentals/" + rentalid + "/reject", {
            method: "POST",
        })
            .then((res) => res.json())
            .then((data) => {
                alert(data.message);
                setselectrental(null);
                getsincheongja(selectmulphon.id);
                getmulphon();
            });
    }


    if (mulphoncall) {
        return (
            <main className="page mulphon-page">
                <p className="mulphon-wating">물품을 불러오는 중...</p>
            </main>
        );
    }

    if (mulphonmode === "sincheongja_check" && selectmulphon) {
        mulphonopen = (
            <div>
                <div className="mulphon-open-bg" onClick={closemulphon}></div>

                <div className="card mulphon-panel sincheongja-panel">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>

                    <div className="sincheongja-title">
                        <h3>{selectmulphon.name}</h3>
                        <p>신청자 확인</p>
                    </div>

                    <div className="sincheongja-list">
                        {!sincheongjacall && sincheongjalist.length === 0 && (
                            <div className="sincheongja-empty">현재 신청자가 없습니다.</div>
                        )}

                        {!sincheongjacall && sincheongjalist.map((rental) => (
                            <div className="sincheongja-card" key={rental.rental_id}>
                                <div className="sincheongja-studentid">
                                    <div>
                                        <b>{rental.user_name}</b>
                                        <p>신청자</p>
                                    </div>
                                    <span>{rental.student_number}</span>
                                </div>

                                <div className="sincheongja-info-list">
                                    <div className="sincheongja-batgi">
                                        <span>대여 기간</span>
                                        <p>{showdate(rental.requested_pickup_at)} ~ {showdate(rental.requested_return_at)}</p>
                                    </div>

                                    <div className="sincheongja-batgi">
                                        <span>수령 시간</span>
                                        <p>{showdate(rental.requested_pickup_at)} {showtime(rental.requested_pickup_at)}</p>
                                    </div>

                                    <div className="sincheongja-worker">
                                        <span>담당 근무자</span>
                                        <p>{rental.worker_name ? rental.worker_name : "미정"}</p>
                                    </div>
                                </div>

                                <div className="sincheongja-button-area">
                                    <button className="sincheongja-sungin-btn sincheongja-sungin-main"
                                            onClick={() => openapprove(rental)}>
                                        예약승인
                                    </button>
                                    <button className="sincheongja-sungin-btn sincheongja-sungin-sub"
                                            onClick={() => sincheongja_openinfo(rental)}>
                                        정보확인
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {selectrental && (
                    <div className="parent-approve">
                        <div className="approve-box">
                            <button className="approve-close" onClick={closeapprove}>x</button>

                            <h4>예약을 승인할까요?</h4>
                            <p>{selectrental.user_name} 예약 신청을 처리합니다.</p>

                            <div className="approve-info">
                                <span>수령 시간</span>
                                <b>{showdate(selectrental.requested_pickup_at)} {showtime(selectrental.requested_pickup_at)}</b>
                            </div>

                            <div className="approve-info">
                                <span>근무자</span>
                                <b>{selectrental.worker_name ? selectrental.worker_name : "미정"}</b>
                            </div>

                            <div className="approve-btn-area">
                                <button className="approve-btn"
                                        onClick={() => rejectrental(selectrental.rental_id)}>
                                    거절
                                </button>
                                <button className="approve-btn approve-main"
                                        onClick={() => approverental(selectrental.rental_id)}>
                                    승인
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {sincheongja_info && (
                    <div className="parent-approve">
                        <div className="approve-box">
                            <button className="approve-close" onClick={sincheongja_closeinfo}>x</button>

                            <h4>신청자 정보</h4>

                            <div className="approve-info">
                                <span>이름</span>
                                <b>{sincheongja_info.user_name}</b>
                            </div>

                            <div className="approve-info">
                                <span>학번</span>
                                <b>{sincheongja_info.student_number}</b>
                            </div>

                            <div className="approve-info">
                                <span>전화번호</span>
                                <b>{sincheongja_info.phone}</b>
                            </div>

                            <div className="approve-info">
                                <span>연체 횟수</span>
                                <b>{sincheongja_info.overdue_count} 회</b>
                            </div>

                            <div className="approve-btn-area">
                                <button className="approve-btn approve-main" onClick={sincheongja_closeinfo}>
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
        ;
    }

    if (mulphonmode === "borrower_check" && selectmulphon) {
        mulphonopen = (
            <div>
                <div className="mulphon-open-bg" onClick={closemulphon}></div>

                <div className="card mulphon-panel">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>
                    <h3 className="mulphon-panel-title">{selectmulphon.name} 대여자 확인</h3>
                    <div className="mulphon-panel-content">
                        대여자 목록
                    </div>
                </div>
            </div>
        );
    }

    if (mulphonmode === "mulphon_count" && selectmulphon) {
        mulphonopen = (
            <div>
                <div className="mulphon-open-bg" onClick={closemulphon}></div>

                <div className="card mulphon-panel">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>
                    <h3 className="mulphon-panel-title">{selectmulphon.name} 물품 관리</h3>
                    <div className="mulphon-panel-content">
                        사용가능 : {selectmulphon.available} / 사용중 : {selectmulphon.inUse} / 준비중 : {selectmulphon.preparing}
                    </div>
                </div>
            </div>
        );
    }

    if (mulphonmode === "new_mulphon_add") {
        mulphonopen = (
            <div>
                <div className="mulphon-open-bg" onClick={closemulphon}></div>

                <div className="card mulphon-panel">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>
                    <h3 className="mulphon-panel-title">새 물품 추가</h3>
                    <div className="mulphon-panel-content">
                        새 물품 추가
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="page mulphon-page">
            <div className="flex justify-between items-center mb-3">
                <h2 className="mulphon-title">물품 관리</h2>

                <button className="mulphon-add-btn md:w-auto md:px-4" onClick={opennewmulphon}>
                    <span>+</span>
                    <span className="hidden md:inline">새 물품</span>
                </button>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mulphonlist.map((mulphon) => (
                    <div className="card p-3 flex flex-col mulphon-card" key={mulphon.id}>
                        <div className="mulphonimg-area flex justify-center items-center">
                            <img
                                src={mulphon.image}
                                alt={mulphon.name}
                                className="mulphon-image"
                            />
                        </div>

                        <h3 className="mulphon-name">{mulphon.name}</h3>

                        <div className="flex flex-wrap items-center gap-1 mulphon-state">
                            <span className="badge badge-green">
                                사용가능 : {mulphon.available}
                            </span>

                            <span className="badge badge-red">
                                사용중 : {mulphon.inUse}
                            </span>

                            <span className="badge badge-gray">
                                준비중 : {mulphon.preparing}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mulphon-action-button-area">
                            <button className="mulphon-action-btn" onClick={() => sincheongja_click(mulphon)}>
                                신청자
                            </button>

                            <button className="mulphon-action-btn" onClick={() => borrower_click(mulphon)}>
                                대여자
                            </button>

                            <button className="mulphon-action-btn" onClick={() => mulphon_count_click(mulphon)}>
                                물품 관리
                            </button>
                        </div>
                    </div>
                ))}
            </section>

            {mulphonopen}
        </main>
    );
}