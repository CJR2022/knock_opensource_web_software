import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import "../LandingPage.css";
import qrimg from "../assets/icons/qr-code.png";

export default function LandingPage() {
    /* 랜딩 통계 데이터
    * 통계로 쓸거 또 있으면 app.py에서 쿼리문추가한다음에 여기로 쓰셈
    * 저 오늘대여 현황이 괜찮나? 저기에 넣을만한게  나중에 만족도?는 어떤가 db에 추가해서
    * 아니면 이용자수? 대여로그 count 찍으면 될거같은데
    * */
    const [landingstats, setlandingstats] = useState({
        user_count: 0,
        rental_item_list: [],
        overdue_rate: 0,
        month_overdue_count: 0,
        month_rental_count: 0,
        popular_item: "-",
        popular_count: 0,
        today_apply_count: 0,
        today_pickup_count: 0,
        today_return_count: 0,
        active_user_count: 0,
        popular_item_list: [],
    });

    const navigate = useNavigate();

    const [gounea_img_list, setgounea_img_list] = useState([]);
    const [landing_call, setlanding_call] = useState(true);

    const [howpreview, sethowpreview] = useState({
        number: "01",
        title: "QR 가입",
        subtext: "회원가입 화면",
        type: "image",
        img_src: "/images/landing/signup.png",
        place: "",
    });

    useEffect(() => {
        getlandingstats();
        get_gounea_img();
    }, []);

    function getlandingstats() {
        setlanding_call(true);

        fetch("http://localhost:8000/api/landing/stats")
            .then((res) => res.json())
            .then((data) => {
                setlandingstats(data);
                setlanding_call(false);
            })
            .catch(() => {
                setlanding_call(false);
            });
    }

    function get_gounea_img() {
        fetch("http://localhost:8000/api/activity-img")
            .then((res) => res.json())
            .then((data) => {
                setgounea_img_list(data);
            });
    }

    function change_how_preview(number, title, subtext, type, img_src, place) {
        sethowpreview({
            number: number,
            title: title,
            subtext: subtext,
            type: type,
            img_src: img_src,
            place: place,
        });
    }

    let activeUserRate = 0;
    if (landingstats.user_count > 0) {
        activeUserRate = Math.round(
            (landingstats.active_user_count / landingstats.user_count) * 100
        );
    }

    /* 오늘 대여 현황 막대 높이
    * 간단하게 그냥 비율로 100 나눔
     */
    let todaytotal = landingstats.today_apply_count + landingstats.today_pickup_count + landingstats.today_return_count;

    let todayapplyheight = 10;
    let todaypickupheight = 10;
    let todayreturnheight = 10;
    if (todaytotal > 0) {
        todayapplyheight = (landingstats.today_apply_count / todaytotal) * 100;
        todaypickupheight = (landingstats.today_pickup_count / todaytotal) * 100;
        todayreturnheight = (landingstats.today_return_count / todaytotal) * 100;
    }


    // 인기상품 비율
    let popularTotal = 0;
    landingstats.popular_item_list.forEach((item) => {
        popularTotal = popularTotal + item.popular_count;
    });

    let popularRate = 0;
    if (popularTotal > 0) {
        popularRate = Math.round((landingstats.popular_count / popularTotal) * 100);
    }


    return (
        <main className="landing-page">
            <section
                className="landing-section main-hero flex flex-wrap items-center justify-between gap-11 border-b border-white/10">
                <div className="main-hero-sogae">
                    <p className="landing-smallname">14th KNOCK</p>
                    <h1 className="main-title">KNOCK</h1>
                    <p className="main-haksen-sogae">
                        교내 물품 더 편하고 빠르게 연결하기 위해 만들어진 서비스입니다.<br/>
                        학생회에서 진행하는 교내 물품 대여를 웹을 통하여 신청하고,<br/>
                        대여 가능한 물품들을 한 곳에서 확인할 수 있습니다.
                    </p>

                    <button className="main-gotomulphon-btn" onClick={() => navigate("/")}>
                        물품대여 바로가기
                    </button>
                </div>

                <div className="today-daeyeo-hero tonggye-hover-area">
                    <div className="today-daeyeo-title flex justify-between">
                        <span>오늘 대여 현황</span>
                        <p>Today</p>
                    </div>

                    <div className="today-daeyeo-chart flex items-end gap-[18px]">
                        <div
                            className="today-daeyeo-chart-apply flex-1"
                            style={{height: todayapplyheight + "%"}}
                            title={"오늘 신청 : " + landingstats.today_apply_count + "건"}
                        ></div>
                        <div
                            className="today-daeyeo-pickup flex-1"
                            style={{height: todaypickupheight + "%"}}
                            title={"오늘 수령 예정 : " + landingstats.today_pickup_count + "건"}
                        ></div>
                        <div
                            className="today-daeyeo-return flex-1"
                            style={{height: todayreturnheight + "%"}}
                            title={"오늘 반납 예정 : " + landingstats.today_return_count + "건"}
                        ></div>
                    </div>

                    <div className="today-daeyeo-bottom flex justify-around gap-3">
                        <span>오늘 신청</span>
                        <span>수령 예정</span>
                        <span>반납 예정</span>
                    </div>

                    <div className="tonggye-detail">
                        <p className="tonggye-detail-title">오늘 대여 현황</p>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>오늘 신청</span>
                            <b>{landingstats.today_apply_count}건</b>
                        </div>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>수령 예정</span>
                            <b>{landingstats.today_pickup_count}건</b>
                        </div>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>반납 예정</span>
                            <b>{landingstats.today_return_count}건</b>
                        </div>
                    </div>
                </div>
            </section>

            {/*여기가 그 팝업들 모음 고칠곳있으면 여기서 수정*/}
            <section
                className="landing-section tonggye-stats grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-white/10">
                <div className="tonggye-card tonggye-hover-area" title={"가입자 : " + landingstats.user_count + "명"}>
                    <p className="tonggye-title">가입자</p>
                    <h3 className="tonggye-value">
                        {landing_call ? "-" : landingstats.user_count}
                    </h3>
                    <p className="tonggye-sogae">대여 사이트를 이용하는 학생 수</p>

                    <div className="tonggye-bar">
                        <div className="tonggye-bar-fill" style={{width: activeUserRate + "%"}}></div>
                    </div>

                    <div className="tonggye-detail">
                        <p className="tonggye-detail-title">가입자 정보</p>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>전체 가입자</span>
                            <b>{landingstats.user_count}명</b>
                        </div>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>승인된 인원</span>
                            <b>{landingstats.active_user_count}명</b>
                        </div>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>승인 비율</span>
                            <b>{activeUserRate}%</b>
                        </div>
                    </div>
                </div>

                <div className="tonggye-card tonggye-hover-area" title="품목별 현재 대여 비율">
                    <p className="tonggye-title">대여 비율</p>

                    <div className="tonggye-list-scroll">
                        {landingstats.rental_item_list.length === 0 && (
                            <p className="tonggye-sogae">대여중인 물품 없음</p>
                        )}

                        {landingstats.rental_item_list.map((item) => (
                            <div
                                className="tonggye-rental-rate"
                                key={item.item_id}
                                title={item.item_name + " : " + item.rental_rate + "% / " + item.rental_count + "개"}
                            >
                                <div className="tonggye-rate-sunui flex justify-between gap-3">
                                    <span>{item.item_name}</span>
                                    <p>{item.rental_rate}%</p>
                                </div>

                                <div className="tonggye-bar">
                                    <div className="tonggye-bar-fill" style={{width: item.rental_rate + "%"}}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="tonggye-detail tonggye-detail-sunui">
                        <p className="tonggye-detail-title">품목별 대여 비율</p>

                        {landingstats.rental_item_list.length === 0 && (
                            <p className="tonggye-detail-sogae">대여중인 물품이 없습니다.</p>
                        )}

                        <div className="tonggye-detail-sunui-scroll">
                            <div className="tonggye-detail-sunui-list">
                                {/*두개 둔 이유 하나만 두면 중간에 끊김 다시시작하면 가장 윕터 시작해서 그래서 하나더 추가해서 연속적으로 되도록 */}
                                {landingstats.rental_item_list.map((item) => (
                                    <div className="tonggye-detail-sunui-item" key={"popup-first" + item.item_id}>
                                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                                            <span>{item.item_name}</span>
                                            <b>{item.rental_rate}%</b>
                                        </div>

                                        <p className="tonggye-detail-sogae">
                                            {item.rental_count}개 / 전체 {item.total_count}개
                                        </p>
                                    </div>
                                ))}

                                {landingstats.rental_item_list.map((item) => (
                                    <div className="tonggye-detail-sunui-item" key={"popup-second" + item.item_id}>
                                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                                            <span>{item.item_name}</span>
                                            <b>{item.rental_rate}%</b>
                                        </div>

                                        <p className="tonggye-detail-sogae">
                                            {item.rental_count}개 / 전체 {item.total_count}개
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tonggye-card tonggye-hover-area"
                     title={"인기 상품 : " + landingstats.popular_item + " / " + landingstats.popular_count + "회"}
                >
                    <p className="tonggye-title">인기 상품</p>
                    <h3 className="tonggye-value">
                        {landing_call ? "-" : landingstats.popular_item}
                    </h3>
                    <p className="tonggye-sogae">
                        {landingstats.popular_count}회 대여
                    </p>

                    <div className="tonggye-bar">
                        <div className="tonggye-bar-fill" style={{width: popularRate + "%"}}></div>
                    </div>

                    <div className="tonggye-detail">
                        <p className="tonggye-detail-title">인기 상품 순위</p>

                        {landingstats.popular_item_list.length === 0 && (
                            <p className="tonggye-detail-sogae">대여 기록이 없습니다.</p>
                        )}

                        {landingstats.popular_item_list.map((item, index) => (
                            <div className="tonggye-detail-rank flex justify-between gap-3" key={item.item_id}>
                                <span>{index + 1}위 {item.popular_item}</span>
                                <b>{item.popular_count}회</b>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tonggye-card tonggye-hover-area"
                     title={"한달 연체 : " + landingstats.month_overdue_count + "건 / 전체 " + landingstats.month_rental_count + "건"}
                >
                    <p className="tonggye-title">한달 연체 비율</p>
                    <h3 className="tonggye-value">
                        {landing_call ? "-" : landingstats.overdue_rate + "%"}
                    </h3>
                    <p className="tonggye-sogae">
                        최근 한달 기준
                    </p>

                    <div className="tonggye-bar">
                        <div className="tonggye-bar-fill" style={{width: landingstats.overdue_rate + "%"}}></div>
                    </div>

                    <div className="tonggye-detail">
                        <p className="tonggye-detail-title">한달 연체 비율</p>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>한달 전체 대여</span>
                            <b>{landingstats.month_rental_count}건</b>
                        </div>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>한달 연체</span>
                            <b>{landingstats.month_overdue_count}건</b>
                        </div>

                        <div className="tonggye-detail-jeongbo flex justify-between gap-3">
                            <span>연체 비율</span>
                            <b>{landingstats.overdue_rate}%</b>
                        </div>
                    </div>
                </div>
            </section>


            <section className="landing-section gineung border-b border-white/10">
                <div className="landing-section-section-title-area">
                    <p className="landing-smallname">Core Features</p>
                    <h2 className="landing-section-title">핵심 기능</h2>
                </div>

                <div className="gineung-grid grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="gineung-card flex flex-col justify-between gap-7">
                        <div className="gineung-text">
                            <p className="gineung-number">01</p>
                            <h3>QR 회원가입</h3>
                            <span>학생 정보를 빠르게 확인하고 KNOCK 서비스를 이용할 수 있습니다.</span>
                        </div>

                        <div className="gineung-imgarea flex items-center justify-center">
                            <div className="gineung-imgarea-qr">
                                <img className="gineung-imgarea-qr-img" src={qrimg} alt="QR 회원가입"/>
                                <p>학생증 QR</p>
                            </div>
                        </div>
                    </div>

                    <div className="gineung-card flex flex-col justify-between gap-7">
                        <div className="gineung-text">
                            <p className="gineung-number">02</p>
                            <h3>손쉬운 대여</h3>
                            <span>필요한 물품의 상태를 보고 원하는 시간에 맞춰 대여를 신청할 수 있습니다.</span>
                        </div>

                        <div className="gineung-imgarea flex items-center justify-center">
                            <div className="gineung-imgarea-item">
                                <div className="gineung-imgarea-item-img"></div>

                                <div className="gineung-imgarea-item-junbo">
                                    <p>보조 배터리</p>
                                    <span>사용가능 : 8</span>
                                </div>

                                <div className="gineung-imgarea-item-state flex gap-1.5">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="gineung-card flex flex-col justify-between gap-7">
                        <div className="gineung-text">
                            <p className="gineung-number">03</p>
                            <h3>대여물품 분석</h3>
                            <span>인기 물품, 대여 비율, 연체 비율을 통해 물품 운영 상태를 확인할 수 있습니다.</span>
                        </div>

                        <div className="gineung-imgarea flex items-center justify-center">
                            <div className="gineung-imgarea-total">
                                <div className="gineung-imgarea-total-line grid items-center gap-3">
                                    <p>대여</p>
                                    <span></span>
                                </div>

                                <div className="gineung-imgarea-total-line grid items-center gap-3">
                                    <p>인기</p>
                                    <span></span>
                                </div>

                                <div className="gineung-imgarea-total-line grid items-center gap-3">
                                    <p>연체</p>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section className="landing-section howuse border-b border-white/10">
                <div className="landing-section-section-title-area">
                    <p className="landing-smallname">How It Works</p>
                    <h2 className="landing-section-title">이용 방법</h2>
                    <p className="landing-section-seolmyeong">
                        QR 가입부터 반납까지 필요한 흐름을 순서대로 확인할 수 있습니다.
                    </p>
                </div>

                {/* 모바일에서는 onmouse가 자꾸 이상하길래 onClick도 추가  그런데도 어쩔때는 이상함 onclick만하기에는 조금 그런데 */}
                <div className="howuse-area flex flex-col gap-8">
                    <div className="howuse-grid grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div
                            className={howpreview.number === "01" ? "howuse-card howuse-active" : "howuse-card"}
                            onMouseEnter={() => change_how_preview("01", "QR 가입", "회원가입 화면", "image", "/images/landing/signup.png", "")}
                            onClick={() => change_how_preview("01", "QR 가입", "회원가입 화면", "image", "/images/landing/signup.png", "")}
                        >
                            <p>01</p>
                            <h3>QR 가입</h3>
                            <span>학생 정보를 확인하고 서비스를 시작합니다.</span>
                        </div>

                        <div
                            className={howpreview.number === "02" ? "howuse-card howuse-active" : "howuse-card"}
                            onMouseEnter={() => change_how_preview("02", "물품 선택", "물품 목록 화면", "image", "/images/landing/items.png", "")}
                            onClick={() => change_how_preview("02", "물품 선택", "물품 목록 화면", "image", "/images/landing/items.png", "")}
                        >
                            <p>02</p>
                            <h3>물품 선택</h3>
                            <span>대여 가능한 물품을 확인합니다.</span>
                        </div>

                        <div
                            className={howpreview.number === "03" ? "howuse-card howuse-active" : "howuse-card"}
                            onMouseEnter={() => change_how_preview("03", "예약", "대여 예약 화면", "image", "/images/landing/reserve.png", "")}
                            onClick={() => change_how_preview("03", "예약", "대여 예약 화면", "image", "/images/landing/reserve.png", "")}
                        >
                            <p>03</p>
                            <h3>예약</h3>
                            <span>수령 시간과 반납 시간을 선택합니다.</span>
                        </div>

                        <div
                            className={howpreview.number === "04" ? "howuse-card howuse-active" : "howuse-card"}
                            onMouseEnter={() => change_how_preview("04", "수령", "장소 안내", "text", "", "S4-1 109호")}
                            onClick={() => change_how_preview("04", "수령", "장소 안내", "text", "", "S4-1 109호")}
                        >
                            <p>04</p>
                            <h3>수령</h3>
                            <span>관리자 확인 후 물품을 수령합니다.</span>
                        </div>

                        <div
                            className={howpreview.number === "05" ? "howuse-card howuse-active" : "howuse-card"}
                            onMouseEnter={() => change_how_preview("05", "반납", "장소 안내", "text", "", "S4-1 109호")}
                            onClick={() => change_how_preview("05", "반납", "장소 안내", "text", "", "S4-1 109호")}
                        >
                            <p>05</p>
                            <h3>반납</h3>
                            <span>정해진 시간에 물품을 반납합니다.</span>
                        </div>
                    </div>

                    <div className="usethis-area flex flex-col md:flex-row gap-8">
                        <div className="usethis-area-text shrink-0">
                            <p>{howpreview.number}</p>
                            <h3>{howpreview.title}</h3>
                            <span>{howpreview.subtext}</span>
                        </div>

                        <div className="usethis-area-imgarea flex flex-1 items-center justify-center">
                            {howpreview.type === "image" ? (
                                <div className="usethis-area-imgarea-box flex items-center justify-center">
                                    <img className="usethis-area-imgarea-img" src={howpreview.img_src}
                                         alt={howpreview.title}/>
                                </div>
                            ) : (
                                <div className="usethis-area-return flex flex-col justify-center">
                                    <p>장소</p>
                                    <h3>{howpreview.place}</h3>
                                    <span>{howpreview.title}은 해당 장소에서 진행합니다.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>


            <section className="landing-section council">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                    <div>
                        <p className="landing-smallname">Student Council</p>
                        <h2 className="landing-section-title">'미래를 향한 두드림, KNOCK!'</h2>
                        <p className="council-info">
                            소프트웨어학부 제14대 'KNOCK' 학생회입니다.
                            <br/>KNOCK는 '문을 두드린다'는 의미로, 학우 여러분의 작은 목소리에도 귀 기울이는 열린 학생회를 지향합니다. 학우 여러분의 목소리에 가장 먼저 다가가고,
                            항상
                            가까이에서 신뢰로 응답하겠습니다.
                        </p>
                    </div>

                    <div className="council-buttons flex flex-wrap md:flex-nowrap justify-start md:justify-end gap-3">
                        <a className="council-buttons-btn" href="https://www.instagram.com/cbnu_sw_knock/?hl=ko"
                           target="_blank">
                            Instagram
                        </a>
                        <a className="council-buttons-btn" href="https://pf.kakao.com/_ccEqX" target="_blank">
                            카카오톡 문의
                        </a>
                        <a className="council-buttons-btn" href="https://software.cbnu.ac.kr/sub0404" target="_blank">
                            학생회 알아보기
                        </a>
                    </div>
                </div>

                {/*자꾸 끊기는 느낌이 나서 매끄럽게 하려고 두개 추가 (참고 : https://myhappyman.tistory.com/312*/}
                <div className="council-activity-area">
                    <div className="council-activity-area-track flex gap-[18px]">
                        <div className="council-activity-area-track flex gap-[18px]">
                            {gounea_img_list.map((img) => (
                                <a href="https://software.cbnu.ac.kr/sub0507" target="_blank" key={img.id}>
                                    <img className="council-activity-img" src={img.img_src} alt="교내 활동"/>
                                </a>
                            ))}
                        </div>

                        <div className="council-activity-area-track council-activity-area-track-two flex gap-[18px]">
                            {gounea_img_list.map((img) => (
                                <a href="https://software.cbnu.ac.kr/sub0507" target="_blank" key={"two" + img.id}>
                                    <img className="council-activity-img" src={img.img_src} alt="교내 활동"/>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}