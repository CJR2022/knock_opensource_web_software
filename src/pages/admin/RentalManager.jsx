import {useEffect, useState} from "react";
import "../../RentalManager.css";
import searchIcon from "../../assets/icons/search.svg";
import alert2 from "sweetalert2";

export default function RentalManager() {
    const [rental_list, setrental_list] = useState([]);
    const [rental_call, setrental_call] = useState(true);
    const [rental_search, setrental_search] = useState("");
    const [rental_state, setrental_state] = useState("my");
    const [category, setcategory] = useState([]);
    const [rental_category_selecte, setrental_category_selecte] = useState("all");
    const [select_rental, setselect_rental] = useState(null);

    let show_rentallist = [];
    let rental_popup = "";

    let userstring = localStorage.getItem("user") || sessionStorage.getItem("user");
    let user = userstring ? JSON.parse(userstring) : null;
    let userid = user ? user.id : "";

    let my_approve_list = [];
    let my_pickup_list = [];
    let my_return_list = [];
    let my_overdue_list = [];

    function getrentallist() {
        setrental_call(true);

        fetch("/api/admin/rentals?admin_id=" + userid)
            .then((res) => res.json())
            .then((data) => {
                setrental_list(data);
                setrental_call(false);
            })
            .catch(() => {
                setrental_call(false);
            });
    }

    function approve_rental(rentalid) {
        if (!user || !user.id) {
            alert2.fire({
                text: "로그인 정보가 없습니다.",
                confirmButtonText: "확인",
                confirmButtonColor: "#09090b",
                customClass: {
                    title: "custom-popup-title",
                    htmlContainer: "custom-popup-content",
                    confirmButton: "custom-confirm"
                }
            });
            return;
        }

        alert2.fire({
            text: "예약을 승인할까요?",
            showCancelButton: true,
            confirmButtonText: "확인",
            cancelButtonText: "취소",
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
            customClass: {
                title: "custom-popup-title",
                htmlContainer: "custom-popup-content",
                confirmButton: "custom-confirm",
                cancelButton: "custom-cancel"
            }
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            fetch("/api/admin/rentals/" + rentalid + "/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    admin_id: user.id,
                }),
            })
                .then((res) => {
                    if (res.ok) {
                        getrentallist();
                    } else {
                        res.json().then((data) => {
                            alert2.fire({
                                text: data.message,
                                confirmButtonText: "확인",
                                confirmButtonColor: "#09090b",
                                customClass: {
                                    title: "custom-popup-title",
                                    htmlContainer: "custom-popup-content",
                                    confirmButton: "custom-confirm"
                                }
                            });
                        });
                    }
                });
        });
    }

    function getcategory() {
        fetch(" /api/categories")
            .then((res) => res.json())
            .then((data) => {
                setcategory(data);
            });
    }

    useEffect(() => {
        getrentallist();
        getcategory();
    }, []);

    function change_rental_categoty(state) {
        setrental_state(state);
    }

    function showdate(datetime) {
        if (!datetime) {
            return "";
        }

        return datetime.substring(5, 7) + "." + datetime.substring(8, 10);
    }

    function showtime(datetime) {
        if (!datetime) {
            return "";
        }

        return datetime.substring(11, 16);
    }

    /*여기가 기간별 어떻게 할건지여서 여기에 cancelled 추가*/
    function show_gigan_state(rental) {
        if (rental.status === "rejected" || rental.status === "canceled") {
            return "-";
        }

        if (rental.status === "approved") {
            return "수령 예정";
        }

        if (rental.status === "returned") {
            return "반납 완료";
        }

        if (rental.left_day > 0) {
            return rental.left_day + "일 남음";
        }

        if (rental.left_day === 0) {
            return "오늘 반납";
        }

        return (rental.left_day * -1) + "일 연체";
    }

    function change_seungin_state(status) {
        if (status === "pending") {
            return "신청대기";
        }

        if (status === "approved") {
            return "수령대기";
        }

        if (status === "rented") {
            return "대여중";
        }

        if (status === "overdue") {
            return "연체";
        }

        if (status === "returned") {
            return "반납완료";
        }

        if (status === "rejected") {
            return "거절됨";
        }

        if (status === "canceled") {
            return "취소됨";
        }
        return status;
    }

    function openrental_jeongbo(rental) {
        setselect_rental(rental);
    }

    function closerental_jeongbo() {
        setselect_rental(null);
    }

    function batgi_check(rentalid) {
        alert2.fire({
            text: "대여 물품을 수령했습니까?",
            showCancelButton: true,
            confirmButtonText: "확인",
            cancelButtonText: "취소",
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
            customClass: {
                title: "custom-popup-title",
                htmlContainer: "custom-popup-content",
                confirmButton: "custom-confirm",
                cancelButton: "custom-cancel"
            }
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            fetch(" /api/admin/rentals/" + rentalid + "/rent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    admin_id: userid,
                })
            })
                .then((res) => {
                    if (res.ok) {
                        getrentallist();
                    } else {
                        alert2.fire({
                            text: "수령 확인을 처리할 수 없습니다.",
                            confirmButtonText: "확인",
                            confirmButtonColor: "#09090b",
                            customClass: {
                                title: "custom-popup-title",
                                htmlContainer: "custom-popup-content",
                                confirmButton: "custom-confirm"
                            }
                        });
                    }
                });
        });
    }

    function bannap_check(rentalid) {
        if (!user || !user.id) {
            alert2.fire({
                text: "로그인 정보가 없습니다.",
                confirmButtonText: "확인",
                confirmButtonColor: "#09090b",
                customClass: {
                    title: "custom-popup-title",
                    htmlContainer: "custom-popup-content",
                    confirmButton: "custom-confirm"
                }
            });
            return;
        }

        alert2.fire({
            text: "반납 확인 처리할까요?",
            showCancelButton: true,
            confirmButtonText: "확인",
            cancelButtonText: "취소",
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
            customClass: {
                title: "custom-popup-title",
                htmlContainer: "custom-popup-content",
                confirmButton: "custom-confirm",
                cancelButton: "custom-cancel"
            }
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            fetch(" /api/admin/rentals/" + rentalid + "/return", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    admin_id: user.id,
                }),
            })
                .then((res) => {
                    if (res.ok) {
                        getrentallist();
                    } else {
                        alert2.fire({
                            text: "반납 확인을 처리할 수 없습니다.",
                            confirmButtonText: "확인",
                            confirmButtonColor: "#09090b",
                            customClass: {
                                title: "custom-popup-title",
                                htmlContainer: "custom-popup-content",
                                confirmButton: "custom-confirm"
                            }
                        });
                    }
                });
        });
    }

    /*드디어 rental_reject 존재의의를 꺠달았다 는 아니고 그냥 예약 거절 때린 관리자 찾는 로그로 두면 괜찮을듯? */
    function reject_rental(rentalid) {
        alert2.fire({
            text: "예약을 거절하겠습니까?",
            showCancelButton: true,
            confirmButtonText: "거절",
            cancelButtonText: "취소",
            confirmButtonColor: "#be123c",
            cancelButtonColor: "#71717a",
            customClass: {
                title: "custom-popup-title",
                htmlContainer: "custom-popup-content",
                confirmButton: "custom-confirm",
                cancelButton: "custom-cancel"
            }
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            fetch(" /api/admin/rentals/" + rentalid + "/reject", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    admin_id: user.id,
                })
            })
                .then((res) => {
                    if (res.ok) {
                        getrentallist();
                    } else {
                        alert2.fire({
                            text: "예약 거절을 처리할 수 없습니다.",
                            confirmButtonText: "확인",
                            confirmButtonColor: "#09090b",
                            customClass: {
                                title: "custom-popup-title",
                                htmlContainer: "custom-popup-content",
                                confirmButton: "custom-confirm"
                            }
                        });
                    }
                });
        });
    }

    /*대여 목록리스트
    * 먼저 검색어랑 카테고리랑 탭에 따라서 분류한다음에 출력하게 했음
    *  */
    for (let i = 0; i < rental_list.length; i++) {
        let rental = rental_list[i];

        let searchtext = rental.user_name + " " + rental.student_number + " " + rental.phone + " " + rental.item_name;

        if (rental_search !== "" && !searchtext.includes(rental_search)) {
            continue;
        }

        if (rental_category_selecte !== "all" && String(rental.category_id) !== String(rental_category_selecte)) {
            continue;
        }

        if (rental.my_part === "approve") {
            my_approve_list.push(rental);
        }

        if (rental.my_part === "pickup") {
            my_pickup_list.push(rental);
        }

        if (rental.my_part === "return") {
            my_return_list.push(rental);
        }

        if (rental.my_part === "overdue") {
            my_overdue_list.push(rental);
        }

        if (rental_state === "my") {
            continue;
        }

        if (rental_state !== "all" && rental.status !== rental_state) {
            continue;
        }

        show_rentallist.push(rental);
    }

    if (select_rental) {
        rental_popup = (
            <div>
                <div className="rental-bg" onClick={closerental_jeongbo}></div>

                <div className="rental-popup">
                    <button className="rental-close" onClick={closerental_jeongbo}>x</button>
                    <h3 className="rental-popup-title">대여자 정보</h3>

                    <div className="rental-info">
                        <div className="rental-row"><span>이름</span><p>{select_rental.user_name}</p></div>
                        <div className="rental-row"><span>학번</span><p>{select_rental.student_number}</p></div>
                        <div className="rental-row"><span>전화번호</span><p>{select_rental.phone}</p></div>
                        <div className="rental-row"><span>대여 물품</span><p>{select_rental.item_name}</p></div>
                        <div className="rental-row"><span>대여 관리자</span>
                            <p>{select_rental.display_admin_name ? select_rental.display_admin_name : "-"}</p></div>
                        <div className="rental-row"><span>반납 관리자</span>
                            <p>{select_rental.display_return_admin_name ? select_rental.display_return_admin_name : "-"}</p>
                        </div>
                        <div className="rental-row"><span>연체 횟수</span><p>{select_rental.overdue_count} 회</p></div>
                    </div>
                </div>
            </div>
        );
    }

    /*여기 return이 조금 난해할수있는데
    * rental_state 상태에 따라서 내 정보면은 따로 출력하게 하고
    * 다른거면 전체 출력하게 해서 그럼
    * 내정보는 내가 관여해야 하는 상황을 기준으로 싹다 보여주는게 목표여서 나눠서 쭉 쓴거임
    * 아마 코드가 중복된는게 많아서 외부로 빼서 함수로 처리해도 되는데 나중에 이름바꾸거나 뭐 바꾸는거 편히할려고 한거여서 확정되면 바꿈
    * */
    return (
        <main className="page rental-page">
            <div className="rental-search">
                <img src={searchIcon} alt="검색"/>
                <input
                    className="rental-search-input"
                    value={rental_search}
                    onChange={(e) => setrental_search(e.target.value)}
                    placeholder="이름, 학번, 전화번호, 물품명"
                />
            </div>

            <select
                className="rental-categoty-select"
                value={rental_category_selecte}
                onChange={(e) => setrental_category_selecte(e.target.value)}
            >
                <option value="all">전체 카테고리</option>
                {category.map((cate) => (
                    <option key={cate.id} value={cate.id}>
                        {cate.name}
                    </option>
                ))}
            </select>

            <div className="rental-tabs">
                <button className={"rental-state-btn " + (rental_state === "my" ? "rental-state-on" : "")}
                        onClick={() => change_rental_categoty("my")}>
                    내 담당
                </button>

                <button className={"rental-state-btn " + (rental_state === "pending" ? "rental-state-on" : "")}
                        onClick={() => change_rental_categoty("pending")}>
                    신청확인
                </button>

                <button className={"rental-state-btn " + (rental_state === "approved" ? "rental-state-on" : "")}
                        onClick={() => change_rental_categoty("approved")}>
                    수령확인
                </button>

                <button className={"rental-state-btn " + (rental_state === "rented" ? "rental-state-on" : "")}
                        onClick={() => change_rental_categoty("rented")}>
                    반납확인
                </button>

                <button className={"rental-state-btn " + (rental_state === "overdue" ? "rental-state-on" : "")}
                        onClick={() => change_rental_categoty("overdue")}>
                    연체
                </button>

                <button className={"rental-state-btn " + (rental_state === "returned" ? "rental-state-on" : "")}
                        onClick={() => change_rental_categoty("returned")}>
                    반납완료
                </button>

                <button className={"rental-state-btn " + (rental_state === "all" ? "rental-state-on" : "")}
                        onClick={() => change_rental_categoty("all")}>
                    전체
                </button>
            </div>

            {rental_state === "my" && (
                <section className="rental-my-area">
                    <div className="rental-my-part">
                        <h3 className="rental-my-title">예약승인</h3>
                        {my_approve_list.length === 0 && (
                            <div className="rental-my-empty">예약 승인할 신청이 없습니다.</div>
                        )}
                        <div className="rental-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {my_approve_list.map((rental) => (
                                <div className="card rental-card" key={rental.rental_id}>
                                    <div className="rental-card-top">
                                        <div>
                                            <b>{rental.user_name}</b>
                                            <p>{rental.student_number}</p>
                                        </div>
                                        <span className="rental-suryeong_yeobu rental-suryeong-pending">
                                {change_seungin_state(rental.status)}
                            </span>
                                    </div>

                                    <div className="rental-info">
                                        <div className="rental-row"><span>대여 물품</span><p>{rental.item_name}</p>
                                        </div>
                                        <div className="rental-row"><span>수령 시간</span>
                                            <p>{showdate(rental.requested_pickup_at)} {showtime(rental.requested_pickup_at)}</p>
                                        </div>
                                        <div className="rental-row"><span>반납 예정</span>
                                            <p>{showdate(rental.requested_return_at)} {showtime(rental.requested_return_at)}</p>
                                        </div>
                                        <div className="rental-row"><span>대여 관리자</span>
                                            <p>{rental.display_admin_name}</p></div>
                                    </div>

                                    <div className="rental-bottom">
                                        <button className="rental-btn" onClick={() => openrental_jeongbo(rental)}>정보
                                            보기
                                        </button>
                                        <button className="rental-btn"
                                                onClick={() => reject_rental(rental.rental_id)}>거절
                                        </button>
                                        <button className="rental-btn rental-btn-main"
                                                onClick={() => approve_rental(rental.rental_id)}>승인
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rental-my-part">
                        <h3 className="rental-my-title">수령확인</h3>
                        {my_pickup_list.length === 0 && (
                            <div className="rental-my-empty">수령 확인할 예약이 없습니다.</div>
                        )}
                        <div className="rental-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {my_pickup_list.map((rental) => (
                                <div className="card rental-card" key={rental.rental_id}>
                                    <div className="rental-card-top">
                                        <div>
                                            <b>{rental.user_name}</b>
                                            <p>{rental.student_number}</p>
                                        </div>
                                        <span className="rental-suryeong_yeobu rental-suryeong-daegi">
                                {change_seungin_state(rental.status)}
                            </span>
                                    </div>

                                    <div className="rental-info">
                                        <div className="rental-row"><span>대여 물품</span><p>{rental.item_name}</p>
                                        </div>
                                        <div className="rental-row"><span>수령 시간</span>
                                            <p>{showdate(rental.requested_pickup_at)} {showtime(rental.requested_pickup_at)}</p>
                                        </div>
                                        <div className="rental-row"><span>반납 예정</span>
                                            <p>{showdate(rental.requested_return_at)} {showtime(rental.requested_return_at)}</p>
                                        </div>
                                        <div className="rental-row"><span>대여 관리자</span>
                                            <p>{rental.display_admin_name ? rental.display_admin_name : "-"}</p>
                                        </div>
                                    </div>

                                    <div className="rental-bottom">
                                        <button className="rental-btn" onClick={() => openrental_jeongbo(rental)}>정보
                                            보기
                                        </button>
                                        <button className="rental-btn rental-btn-main"
                                                onClick={() => batgi_check(rental.rental_id)}>수령 확인
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rental-my-part">
                        <h3 className="rental-my-title">반납확인</h3>
                        {my_return_list.length === 0 && (
                            <div className="rental-my-empty">반납 확인할 대여가 없습니다.</div>
                        )}

                        <div className="rental-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {my_return_list.map((rental) => (
                                <div className="card rental-card" key={rental.rental_id}>
                                    <div className="rental-card-top">
                                        <div>
                                            <b>{rental.user_name}</b>
                                            <p>{rental.student_number}</p>
                                        </div>

                                        <span className="rental-suryeong_yeobu rental-suryeong_ing">
                        {change_seungin_state(rental.status)}
                    </span>
                                    </div>

                                    <div className="rental-info">
                                        <div className="rental-row"><span>대여 물품</span><p>{rental.item_name}</p>
                                        </div>
                                        <div className="rental-row"><span>수령 시간</span>
                                            <p>{showdate(rental.requested_pickup_at)} {showtime(rental.requested_pickup_at)}</p>
                                        </div>
                                        <div className="rental-row"><span>반납 예정</span>
                                            <p>{showdate(rental.requested_return_at)} {showtime(rental.requested_return_at)}</p>
                                        </div>
                                        <div className="rental-row"><span>남은 기간</span>
                                            <p>{show_gigan_state(rental)}</p>
                                        </div>
                                        <div className="rental-row"><span>대여 관리자</span>
                                            <p>{rental.display_admin_name ? rental.display_admin_name : "-"}</p>
                                        </div>
                                        <div className="rental-row"><span>반납 관리자</span>
                                            <p>{rental.display_return_admin_name ? rental.display_return_admin_name : "-"}</p>
                                        </div>
                                    </div>

                                    <div className="rental-bottom">
                                        <button className="rental-btn" onClick={() => openrental_jeongbo(rental)}>
                                            정보 보기
                                        </button>
                                        <button className="rental-btn rental-btn-main"
                                                onClick={() => bannap_check(rental.rental_id)}>
                                            반납 확인
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rental-my-part">
                        <h3 className="rental-my-title">연체</h3>
                        {my_overdue_list.length === 0 && (
                            <div className="rental-my-empty">연체 대여가 없습니다.</div>
                        )}
                        <div className="rental-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {my_overdue_list.map((rental) => (
                                <div className="card rental-card" key={rental.rental_id}>
                                    <div className="rental-card-top">
                                        <div>
                                            <b>{rental.user_name}</b>
                                            <p>{rental.student_number}</p>
                                        </div>
                                        <span className="rental-suryeong_yeobu rental-suryeong-overdue">
                                {change_seungin_state(rental.status)}
                            </span>
                                    </div>

                                    <div className="rental-info">
                                        <div className="rental-row"><span>대여 물품</span><p>{rental.item_name}</p>
                                        </div>
                                        <div className="rental-row"><span>반납 예정</span>
                                            <p>{showdate(rental.requested_return_at)} {showtime(rental.requested_return_at)}</p>
                                        </div>
                                        <div className="rental-row"><span>남은 기간</span>
                                            <p>{show_gigan_state(rental)}</p>
                                        </div>
                                    </div>

                                    <div className="rental-bottom">
                                        <button className="rental-btn" onClick={() => openrental_jeongbo(rental)}>정보
                                            보기
                                        </button>
                                        <button className="rental-btn rental-btn-main"
                                                onClick={() => bannap_check(rental.rental_id)}>반납 확인
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {rental_state !== "my" && (
                <section className="rental-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rental_call && (
                        <div className="card rental-card">대여 정보를 불러오는 중...</div>
                    )}

                    {!rental_call && show_rentallist.length === 0 && (
                        <div className="card rental-card">대여 정보가 없습니다.</div>
                    )}

                    {!rental_call && show_rentallist.map((rental) => {
                        let suryeongclass = "rental-suryeong-daegi";

                        if (rental.status === "rented") {
                            suryeongclass = "rental-suryeong_ing";
                        }

                        if (rental.status === "overdue") {
                            suryeongclass = "rental-suryeong-overdue";
                        }

                        if (rental.status === "returned") {
                            suryeongclass = "rental-suryeong-bannap";
                        }

                        if (rental.status === "approved") {
                            suryeongclass = "rental-suryeong-daegi";
                        }

                        if (rental.status === "rejected" || rental.status === "canceled") {
                            suryeongclass = "rental-suryeong-stop";
                        }

                        return (
                            <div className="card rental-card" key={rental.rental_id}>
                                <div className="rental-card-top">
                                    <div>
                                        <b>{rental.user_name}</b>
                                        <p>{rental.student_number}</p>
                                    </div>

                                    <span className={"rental-suryeong_yeobu " + suryeongclass}>
                                    {change_seungin_state(rental.status)}
                                </span>
                                </div>

                                <div className="rental-info">
                                    <div className="rental-row"><span>대여 물품</span><p>{rental.item_name}</p></div>
                                    <div className="rental-row"><span>카테고리</span><p>{rental.category_name}</p></div>
                                    <div className="rental-row"><span>수령 시간</span>
                                        <p>{showdate(rental.requested_pickup_at)} {showtime(rental.requested_pickup_at)}</p>
                                    </div>
                                    <div className="rental-row"><span>반납 예정</span>
                                        <p>{showdate(rental.requested_return_at)} {showtime(rental.requested_return_at)}</p>
                                    </div>
                                    <div className="rental-row"><span>남은 기간</span><p>{show_gigan_state(rental)}</p>
                                    </div>
                                    <div className="rental-row"><span>대여 관리자</span>
                                        <p>{rental.display_admin_name ? rental.display_admin_name : "-"}</p></div>
                                    <div className="rental-row"><span>반납 관리자</span>
                                        <p>{rental.display_return_admin_name ? rental.display_return_admin_name : "-"}</p>
                                    </div>
                                </div>

                                <div className="rental-bottom">
                                    <button className="rental-btn" onClick={() => openrental_jeongbo(rental)}>
                                        정보 보기
                                    </button>
                                    {rental.status === "pending" && (
                                        <>
                                            <button className="rental-btn"
                                                    onClick={() => reject_rental(rental.rental_id)}>
                                                거절
                                            </button>

                                            <button className="rental-btn rental-btn-main"
                                                    onClick={() => approve_rental(rental.rental_id)}>
                                                승인
                                            </button>
                                        </>
                                    )}

                                    {rental.status === "approved" && (
                                        <button className="rental-btn rental-btn-main"
                                                onClick={() => batgi_check(rental.rental_id)}>
                                            수령 확인
                                        </button>
                                    )}

                                    {(rental.status === "rented" || rental.status === "overdue") && (
                                        <button className="rental-btn rental-btn-main"
                                                onClick={() => bannap_check(rental.rental_id)}>
                                            반납 확인
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}
            {rental_popup}
        </main>
    );
}