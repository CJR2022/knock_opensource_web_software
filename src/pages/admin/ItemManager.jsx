import {useEffect, useState} from "react";
import "../../ItemManager.css";

/*
* 구현하다 보니깐 줄코드수가 게속 늘어나게 되는데 나중에 모듈화 시도해봄.. 일단 구현 먼저
* 수정사항 1.
* 원래는 여기서도 대여자랑 신청자 관리가 가능하게 유지하려고 했으나 너무 복잡해지고 다른곳에서가 애매해짐 따라서 여기서 대여 현황 만을 볼수있게 하고
* 물품 관리 ( 수량, 새 물품 추가) 관렂에서만 진행하도록 함
* 따라서 기존코드에ㅔ서 신청자랑 대여자 관리 코드들을 싹다 지우긴 하는데 뭔가 남아버릴수도.. 찾으면 마좀
* 아 기존코드 작성한거가 아까워서 몇몇개는 흔적이 남아있을거임
* 또 코드가 자꾸 길어져서 주석 남기기 시작했음 모르는 코드 있으면 물어보셈
* 수정사항 2.
* 그 코드가 많이 복잡해지게 되었는데 조금 정리하자면
* 물품 삭제시에 대여 기록이있으면 제거가 안됨 -> 따라서 처음 등록 잘못했을때 지우는 용도로만 만들어둘려고함
* 그다음 물품의 전체 록를 볼수있도록 추가했음
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

    /* 물품 관리 구현 */
    const [categorylist, setcategorylist] = useState([]);
    const [mulphonname, setmulphonname] = useState("");
    const [mulphoncount, setmulphoncount] = useState("");
    const [mulphoncategory, setmulphoncategory] = useState("");
    const [mulphonimage, setmulphonimage] = useState(null);
    const [mulphonpreview, setmulphonpreview] = useState("");
    const [mulphon_preparing, setmulphon_preparing] = useState("");

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
        getcategory();
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
        setmulphonname(mulphon.name);
        setmulphoncount(Number(mulphon.available) + Number(mulphon.inUse) + Number(mulphon.preparing));
        setmulphoncategory(mulphon.category_id);
        setmulphonimage(null);
        setmulphonpreview(mulphon.image);
        setmulphon_preparing(mulphon.preparing);
    }

    /*새 물품 추가*/
    function opennewmulphon() {
        setselectmulphon(null);
        setmulphonmode("newmulphon_add");

        setmulphonname("");
        setmulphoncount("");
        setmulphoncategory(categorylist.length > 0 ? categorylist[0].id : "");
        setmulphonimage(null);
        setmulphonpreview("");
        setmulphon_preparing("0");
    }

    /*창들 초기화 및 끄기 새로 추가하면 여기에 초기화값 넣어두기*/
    function closemulphon() {
        setselectmulphon(null);
        setmulphonmode("");
        setborrowerlist([]);
        setmulphonname("");
        setmulphoncount("");
        setmulphoncategory("");
        setmulphonimage(null);
        setmulphonpreview("");
        setmulphon_preparing("");
        setmulphonloglist([]);
        setmulphonlogsearch("");
    }

    /*물품 로그 구현*/
    const [mulphonloglist, setmulphonloglist] = useState([]);
    const [mulphonlogcall, setmulphonlogcall] = useState(false);
    const [mulphonlogsearch, setmulphonlogsearch] = useState("");

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

    /* 물품 관리 구현 */
    function getcategory() {
        fetch("http://localhost:8000/api/categories")
            .then((res) => res.json())
            .then((data) => {
                setcategorylist(data);
            });
    }

    function changemulphonimg(e) {
        let file = e.target.files[0];

        if (file) {
            setmulphonimage(file);
            setmulphonpreview(URL.createObjectURL(file));
        }
    }

    function savemulphon() {
        let dmulphon_data = new FormData();

        dmulphon_data.append("name", mulphonname);
        dmulphon_data.append("total_count", mulphoncount);
        dmulphon_data.append("category_id", mulphoncategory);
        dmulphon_data.append("preparing", mulphon_preparing);

        if (mulphonimage) {
            dmulphon_data.append("image", mulphonimage);
        }

        fetch("http://localhost:8000/api/items/" + selectmulphon.id + "/update", {
            method: "POST",
            body: dmulphon_data,
        })
            .then(() => {
                closemulphon();
                getmulphon();
            });
    }

    /*새 물품 추가*/
    function savenewmulphon() {
        let dmulphon_data = new FormData();

        dmulphon_data.append("name", mulphonname);
        dmulphon_data.append("total_count", mulphoncount);
        dmulphon_data.append("category_id", mulphoncategory);
        dmulphon_data.append("preparing", mulphon_preparing);

        if (mulphonimage) {
            dmulphon_data.append("image", mulphonimage);
        }

        fetch("http://localhost:8000/api/items/add", {
            method: "POST",
            body: dmulphon_data,
        })
            .then(() => {
                closemulphon();
                getmulphon();
            });
    }

    /*물품 삭제*/
    function deletemulphon() {
        let check = window.confirm("정말 이 물품을 제거하겠습니까?");

        if (!check) {
            return;
        }

        fetch("http://localhost:8000/api/items/" + selectmulphon.id + "/delete", {
            method: "POST",
        })
            .then((res) => {
                if (res.ok) {
                    closemulphon();
                    getmulphon();
                } else {
                    alert("삭제할 수 없는 물품입니다.");
                }
            })
    }

    /*물품 로그 클릭 이벤트 정리*/
    function mulphon_log_click(mulphon) {
        setselectmulphon(mulphon);
        setmulphonmode("mulphon_log");
        setmulphonlogsearch("");
        getmulphonlog(mulphon.id);
    }

    /*물품 로그 가져오기*/
    function getmulphonlog(itemid) {
        setmulphonlogcall(true);

        fetch("http://localhost:8000/api/items/" + itemid + "/logs")
            .then((res) => res.json())
            .then((data) => {
                setmulphonloglist(data);
                setmulphonlogcall(false);
            })
            .catch(() => {
                setmulphonlogcall(false);
            });
    }

    /*대여 상태 */
    function showrentalstatus(status) {
        let statuslist = [
            ["pending", "예약대기"],
            ["approved", "승인됨"],
            ["rented", "대여중"],
            ["returned", "반납완료"],
            ["overdue", "연체"],
            ["rejected", "거절"],
            ["canceled", "취소"],
        ];

        for (let i = 0; i < statuslist.length; i++) {
            if (statuslist[i][0] === status) {
                return statuslist[i][1];
            }
        }

        return status;
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

                <div className="card mulphon-panel sincheongja-panel">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>

                    <div className="sincheongja-title">
                        <h3>{selectmulphon.name}</h3>
                        <p>물품 관리</p>
                    </div>

                    <div className="sincheongja-list">
                        <div className="mulphon-gwanri-form">
                            <div className="mulphon-gwanri-imgarea">
                                <img src={mulphonpreview} alt={mulphonname} className="mulphon-gwanri-img"/>
                            </div>

                            <div className="mulphon-gwanri-div">
                                <label className="mulphon-gwanri-title">이미지 변경</label>

                                <div className="mulphon-gwanri-filearea">
                                    <label className="mulphon-gwanri-filebtn">
                                        파일 선택
                                        <input className="mulphon-gwanri-fileinput" type="file"
                                               onChange={changemulphonimg}/>
                                    </label>

                                    <span
                                        className="mulphon-gwanri-filename"> {mulphonimage ? mulphonimage.name : "선택된 파일 없음"} </span>
                                </div>
                            </div>

                            <div className="mulphon-gwanri-div">
                                <label className="mulphon-gwanri-title">물품명</label>
                                <input
                                    className="mulphon-gwanri-nayoung"
                                    value={mulphonname}
                                    onChange={(e) => setmulphonname(e.target.value)}
                                />
                            </div>

                            <div className="mulphon-gwanri-div">
                                <label className="mulphon-gwanri-title">전체 수량</label>
                                <input
                                    className="mulphon-gwanri-nayoung"
                                    type="number"
                                    value={mulphoncount}
                                    onChange={(e) => setmulphoncount(e.target.value)}
                                />
                            </div>

                            <div className="mulphon-gwanri-div">
                                <label className="mulphon-gwanri-title">준비중</label>
                                <input
                                    className="mulphon-gwanri-nayoung"
                                    type="number"
                                    value={mulphon_preparing}
                                    onChange={(e) => setmulphon_preparing(e.target.value)}
                                />
                            </div>

                            <div className="mulphon-gwanri-div">
                                <label className="mulphon-gwanri-title">카테고리</label>
                                <select
                                    className="mulphon-gwanri-select"
                                    value={mulphoncategory}
                                    onChange={(e) => setmulphoncategory(e.target.value)}
                                >
                                    {categorylist.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button className="mulphon-gwanri-savebtn" onClick={savemulphon}>
                                저장
                            </button>

                            <div className="mulphon-gwanri-deletearea">
                                <button className="mulphon-gwanri-deletebtn" onClick={deletemulphon}>
                                    물품 제거
                                </button>
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        );
    }


    if (mulphonmode === "newmulphon_add") {
        mulphonopen = (
            <div>
                <div className="mulphon-open-bg" onClick={closemulphon}></div>

                <div className="card mulphon-panel mulphon-gwanri-main">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>

                    <div className="sincheongja-title">
                        <h3>새 물품 추가</h3>
                        <p>물품 등록</p>
                    </div>

                    <div className="mulphon-gwanri-form">
                        <div className="mulphon-gwanri-imgarea">
                            {mulphonpreview && (
                                <img src={mulphonpreview} alt={mulphonname} className="mulphon-gwanri-img"/>
                            )}
                        </div>

                        <div className="mulphon-gwanri-div">
                            <label className="mulphon-gwanri-title">이미지 선택</label>

                            <div className="mulphon-gwanri-filearea">
                                <label className="mulphon-gwanri-filebtn">
                                    파일 선택
                                    <input className="mulphon-gwanri-fileinput" type="file"
                                           onChange={changemulphonimg}/>
                                </label>

                                <span className="mulphon-gwanri-filename">
                                {mulphonimage ? mulphonimage.name : "선택된 파일 없음"}
                            </span>
                            </div>
                        </div>

                        <div className="mulphon-gwanri-div">
                            <label className="mulphon-gwanri-title">물품명</label>
                            <input
                                className="mulphon-gwanri-nayoung"
                                value={mulphonname}
                                onChange={(e) => setmulphonname(e.target.value)}
                            />
                        </div>

                        <div className="mulphon-gwanri-div">
                            <label className="mulphon-gwanri-title">전체 수량</label>
                            <input
                                className="mulphon-gwanri-nayoung"
                                type="number"
                                value={mulphoncount}
                                onChange={(e) => setmulphoncount(e.target.value)}
                            />
                        </div>

                        <div className="mulphon-gwanri-div">
                            <label className="mulphon-gwanri-title">준비중</label>
                            <input
                                className="mulphon-gwanri-nayoung"
                                type="number"
                                value={mulphon_preparing}
                                onChange={(e) => setmulphon_preparing(e.target.value)}
                            />
                        </div>

                        <div className="mulphon-gwanri-div">
                            <label className="mulphon-gwanri-title">카테고리</label>
                            <select
                                className="mulphon-gwanri-select"
                                value={mulphoncategory}
                                onChange={(e) => setmulphoncategory(e.target.value)}
                            >
                                {categorylist.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button className="mulphon-gwanri-savebtn" onClick={savenewmulphon}>
                            추가
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /*물품 팝업 IF문*/
    if (mulphonmode === "mulphon_log" && selectmulphon) {
        let showloglist = [];

        /*요기가 검색 로직 필요한거 있으면 말하셈*/
        if (mulphonlogsearch === "") {
            showloglist = mulphonloglist;
        } else {
            /*요기에 내용물 searchword가 찾는 단어이고 log_text에서 includes 씀 */
            for (let i = 0; i < mulphonloglist.length; i++) {
                let log = mulphonloglist[i];
                let searchword = mulphonlogsearch.replace(".", "");
                let pickupday = showdate(log.requested_pickup_at).replace(".", "");
                let returnday = "";

                if (log.returned_at) {
                    returnday = showdate(log.returned_at).replace(".", "");
                }

                let logtext = log.user_name + " " + log.student_number + " " + log.phone + " " + showrentalstatus(log.status) + " 수령:" + pickupday + " 반납:" + returnday;

                if (logtext.includes(searchword)) {
                    showloglist.push(log);
                }
            }
        }

        mulphonopen = (
            <div>
                <div className="mulphon-open-bg" onClick={closemulphon}></div>

                <div className="card mulphon-panel sincheongja-panel">
                    <button className="mulphon-panel-close" onClick={closemulphon}>x</button>

                    <div className="sincheongja-title">
                        <h3>{selectmulphon.name}</h3>
                        <p>물품 로그</p>
                    </div>

                    <div className="mulphon-log-searcharea">
                        <input
                            className="mulphon-log-searchinput"
                            value={mulphonlogsearch}
                            onChange={(e) => setmulphonlogsearch(e.target.value)}
                            placeholder="검색(ex: 이름, 학번, 승인, 대여, [수령,반납]:월일)"
                        />
                    </div>

                    <div className="sincheongja-list">
                        {!mulphonlogcall && showloglist.length === 0 && (
                            <div className="mulphon-log-empty">대여 기록이 없습니다.</div>
                        )}

                        {!mulphonlogcall && showloglist.map((rental) => (
                            <div className="sincheongja-card" key={rental.rental_id}>
                                <div className="sincheongja-studentid">
                                    <div>
                                        <b>{rental.user_name}</b>
                                        <p className={"borrower-state " + (rental.status === "overdue" ? "borrower-state-overdue" : "borrower-state-go")}>
                                            {showrentalstatus(rental.status)}
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
                                        <span>대여 기간</span>
                                        <p>{showdate(rental.requested_pickup_at)} ~ {showdate(rental.requested_return_at)}</p>
                                    </div>

                                    <div className="sincheongja-batgi">
                                        <span>수령 시간</span>
                                        <p>{showdate(rental.requested_pickup_at)} {showtime(rental.requested_pickup_at)}</p>
                                    </div>

                                    <div className="sincheongja-batgi">
                                        <span>반납 시간</span>
                                        <p>
                                            {rental.returned_at ? showdate(rental.returned_at) + " " + showtime(rental.returned_at) : "-"}
                                        </p>
                                    </div>

                                    <div className="sincheongja-batgi">
                                        <span>수량</span>
                                        <p>{rental.quantity}</p>
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
                            <button className="mulphon-action-btn" onClick={() => borrower_click(mulphon)}>
                                대여 현황
                            </button>

                            <button className="mulphon-action-btn" onClick={() => mulphon_count_click(mulphon)}>
                                물품 관리
                            </button>

                            <button className="mulphon-action-btn" onClick={() => mulphon_log_click(mulphon)}>
                                물품 로그
                            </button>
                        </div>
                    </div>
                ))}
            </section>

            {mulphonopen}
        </main>
    );
}