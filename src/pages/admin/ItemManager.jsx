import {useEffect, useState} from "react";
import "../../ItemManager.css";

/*
* 구현하다 보니깐 줄코드수가 게속 늘어나게 되는데 나중에 모듈화 시도해봄.. 일단 구현 먼저
* 수정사항 1.
* 원래는 여기서도 대여자랑 신청자 관리가 가능하게 유지하려고 했으나 너무 복잡해지고 다른곳에서가 애매해짐 따라서 여기서 대여 현황 만을 볼수있게 하고
* 물품 관리 ( 수량, 새 물품 추가) 관렂에서만 진행하도록 함
* 따라서 기존코드에ㅔ서 신청자랑 대여자 관리 코드들을 싹다 지우긴 하는데 뭔가 남아버릴수도.. 찾으면 마좀
*
* */
export default function ItemManager() {
    const [mulphonlist, setmulphonlist] = useState([]);
    const [mulphoncall, setmulphoncall] = useState(true);
    const [selectmulphon, setselectmulphon] = useState(null);
    const [mulphonmode, setmulphonmode] = useState("");
    let mulphonopen = "";

    /*대여자 확인 구현*/
    const [borrowerlist, setborrowerlist] = useState([]);
    const [borrowercall, setborrowercall] = useState(false);

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

    /* 대여자 관리 */
    function borrower_click(mulphon) {
        setselectmulphon(mulphon);
        setmulphonmode("borrower_check");
        getborower(mulphon.id);
    }


    function mulphon_count_click(mulphon) {
        setselectmulphon(mulphon);
        setmulphonmode("mulphon_count");
    }

    function opennewmulphon() {
        setselectmulphon(null);
        setmulphonmode("new_mulphon_add");
    }

    /*창들 초기화 및 끄기*/
    function closemulphon() {
        setselectmulphon(null);
        setmulphonmode("");
        setborrowerlist([]);
    }

    /* 대여저 관리 전처리 모음집 */
    function getborower(itemid) {
        setborrowercall(true);

        fetch("http://localhost:8000/api/items/" + itemid + "/borrowers")
            .then((res) => res.json())
            .then((data) => {
                setborrowerlist(data);
                setborrowercall(false);
            });
    }

    function showoverdue(day) {
        if (day > 0) {
            return day + "일 남음";
        }

        if (day === 0) {
            return "오늘 반납";
        }

        return (day * -1) + "일 연체";
    }

    /*언제 받으러 오는지 시간 계산*/
    function showdate(datetime) {
        return datetime.substring(5, 7) + "." + datetime.substring(8, 10);
    }

    function showtime(datetime) {
        return datetime.substring(11, 16);
    }

    if (mulphoncall) {
        return (
            <main className="page mulphon-page">
                <p className="mulphon-wating">물품을 불러오는 중...</p>
            </main>
        );
    }

    if (mulphonmode === "borrower_check" && selectmulphon) {
        mulphonopen = (
            <div>
                <div className="mulphon-open-bg" onClick={closemulphon}></div>

                <div className="card mulphon-panel sincheongja-panel">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>

                    <div className="sincheongja-title">
                        <h3>{selectmulphon.name}</h3>
                        <p>대여 현황</p>
                    </div>

                    <div className="sincheongja-list">
                        {!borrowercall && borrowerlist.map((rental) => (
                            <div className="sincheongja-card" key={rental.rental_id}>
                                <div className="sincheongja-studentid">
                                    <div>
                                        <b>{rental.user_name}</b>
                                        <p className={"borrower-state " + (rental.status == "overdue" ? "borrower-state-overdue" : "borrower-state-go")}>
                                            {rental.status == "approved" ? "승인됨" : rental.status == "overdue" ? "연체" : "대여중"}
                                        </p>
                                    </div>
                                    <span>{rental.student_number}</span>
                                </div>

                                <div className="sincheongja-info-list">
                                    <div className="sincheongja-batgi">
                                        <span>전화번호</span>
                                        <p>{rental.phone}</p>
                                    </div>

                                    <div className="sincheongja-batgi">
                                        <span>대여 물품</span>
                                        <p>{rental.item_name}</p>
                                    </div>

                                    <div className="sincheongja-batgi">
                                        <span>남은 기간</span>
                                        <p>
                                            {rental.status == "approved" ? "(" + showdate(rental.requested_pickup_at) + " " + showtime(rental.requested_pickup_at) + " - 대여 예약)" : showoverdue(rental.left_day)}</p>
                                    </div>

                                    <div className="sincheongja-worker">
                                        <span>연체 횟수</span>
                                        <p>{rental.overdue_count} 회</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
        ;
    }

    if (mulphonmode === "mulphon_count" && selectmulphon) {
        mulphonopen = (
            <div>
                <div className="mulphon-open-bg" onClick={closemulphon}></div>

                <div className="card mulphon-panel">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>
                    <h3 className="mulphon-panel-title">{selectmulphon.name} 물품 관리</h3>
                    <div className="mulphon-panel-content">
                        <p>TODO</p>
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

                        <div className="grid grid-cols-2 gap-2 mulphon-action-button-area">
                            <button className="mulphon-action-btn" onClick={() => borrower_click(mulphon)}>
                                대여 현황
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