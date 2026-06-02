/*수정 사항
* 1. css 쪽 중앙정렬하게 바꿈
* 2. 로그를 남길수있게끔 제작
* */
import {useEffect, useState} from "react";
import "../../AdminInquiry.css";
import searchIcon from "../../assets/icons/search.svg";
import alert2 from "sweetalert2";

export default function AdminInquiry() {
    const [munilist, setmunilist] = useState([]);
    const [municall, setmunicall] = useState(true);
    const [munisearch, setmunisearch] = useState("");
    const [munistatus, setmunistatus] = useState("daegi");
    const [selectmuni, setselectmuni] = useState(null);
    const [answercontent, setanswercontent] = useState("");

    let showmunilist = [];
    let muni_answer = "";

    function getmunilist() {
        setmunicall(true);

        fetch("http://localhost:8000/api/admin/inquiries")
            .then((res) => res.json())
            .then((data) => {
                setmunilist(data);
                setmunicall(false);
            })
            .catch(() => {
                setmunicall(false);
            });
    }

    useEffect(() => {
        getmunilist();
    }, []);

    function openanswer(muni) {
        setselectmuni(muni);

        if (muni.answer_content) {
            setanswercontent(muni.answer_content);
        } else {
            setanswercontent("");
        }
    }

    function closeanswer() {
        setselectmuni(null);
        setanswercontent("");
    }

    function change_daegiwanro(state) {
        setmunistatus(state);
    }

    function saveanswer() {
        let userstring = localStorage.getItem("user") || sessionStorage.getItem("user");
        let user = userstring ? JSON.parse(userstring) : null;

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

        if (answercontent === "") {
            alert2.fire({
                text: "답변 내용을 입력해주세요.",
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

        fetch("http://localhost:8000/api/admin/input_inquiries/" + selectmuni.inquiry_id + "/answer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                admin_id: user.id,
                answer_content: answercontent,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                alert2.fire({
                    text: data.message,
                    confirmButtonText: "확인",
                    confirmButtonColor: "#09090b",
                    customClass: {
                        title: "custom-popup-title",
                        htmlContainer: "custom-popup-content",
                        confirmButton: "custom-confirm"
                    }
                }).then(() => {
                    if (data.success) {
                        closeanswer();
                        getmunilist();
                    }
                });
            });
    }

    /* 답변한거랑 안한거 분리 해주는거 */
    for (let i = 0; i < munilist.length; i++) {
        let muni = munilist[i];
        let isanswer = muni.answer_content !== null && muni.answer_content !== "";

        if (munistatus === "daegi" && isanswer) {
            continue;
        }

        if (munistatus === "wanro" && !isanswer) {
            continue;
        }

        let searchtext = muni.user_name + " " + muni.student_number + " " + muni.title;

        if (munisearch === "" || searchtext.includes(munisearch)) {
            showmunilist.push(muni);
        }
    }

    if (selectmuni) {
        muni_answer = (
            <div>
                <div className="adminmuni-bg" onClick={closeanswer}></div>

                <div className="adminmuni-popup">
                    <button className="adminmuni-close" onClick={closeanswer}>x</button>

                    <h3>{selectmuni.answer_content ? "답변수정" : "답변하기"}</h3>

                    <div className="adminmuni-question">
                        <p>{selectmuni.title}</p>
                        <span>{selectmuni.user_name} / {selectmuni.student_number}</span>
                        <div>{selectmuni.content}</div>
                    </div>

                    <textarea
                        className="adminmuni-textarea"
                        value={answercontent}
                        onChange={(e) => setanswercontent(e.target.value)}
                        placeholder="답변 내용을 입력해주세요."
                    />

                    <div className="adminmuni-btnarea">
                        <button onClick={closeanswer}>취소</button>
                        <button onClick={saveanswer}>
                            {selectmuni.answer_content ? "답변수정" : "답변하기"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="page adminmuni-page">
            <div className="adminmuni-search">
                <img src={searchIcon} alt="검색"/>
                <input
                    className="adminmuni-search-input"
                    value={munisearch}
                    onChange={(e) => setmunisearch(e.target.value)}
                    placeholder="이름, 학번, 제목"
                />
            </div>

            <div className="adminmuni-tabs">
                <button
                    className={"adminmuni-state " + (munistatus === "daegi" ? "adminmuni-state-on" : "")}
                    onClick={() => change_daegiwanro("daegi")}
                >
                    답변 대기
                </button>

                <button
                    className={"adminmuni-state " + (munistatus === "wanro" ? "adminmuni-state-on" : "")}
                    onClick={() => change_daegiwanro("wanro")}
                >
                    답변 완료
                </button>
            </div>

            <section className="adminmuni-list">
                {municall && (
                    <div className="card adminmuni-card">문의사항을 불러오는 중...</div>
                )}

                {!municall && showmunilist.length === 0 && (
                    <div className="card adminmuni-card">문의사항이 없습니다.</div>
                )}

                {!municall && showmunilist.map((muni) => {
                        /* 작성자 표시 및 답변시간을 위한 부분*/
                        let munitime = muni.created_at;

                        if (muni.answer_content) {
                            munitime = muni.created_at + " - " + muni.answered_at + " | " + muni.admin_name;
                        }

                        if (muni.answer_content && Number(muni.answer_count) > 1) {
                            munitime = munitime + " - (수정됨) ";
                        }

                        /*답변시 변경 */
                        let munistate_text = "답변대기";

                        if (muni.answer_content) {
                            munistate_text = "답변완료";
                        }

                        return (
                            <div className="card adminmuni-card" key={muni.inquiry_id}>
                                <div className="adminmuni-card-top">
                                    <div>
                                        <b>{muni.user_name}</b>
                                        <p>{muni.student_number}</p>
                                    </div>

                                    <span
                                        className={muni.answer_content ? "badge badge-green" : "badge badge-gray"}> {munistate_text} </span>
                                </div>

                                <h3 className="adminmuni-title">{muni.title}</h3>
                                <p className="adminmuni-content">{muni.content}</p>

                                <div className="adminmuni-bottom">
                                    <span>{munitime}</span>

                                    <button className="adminmuni-answer-btn" onClick={() => openanswer(muni)}>
                                        {muni.answer_content ? "답변수정" : "답변하기"}
                                    </button>
                                </div>
                            </div>
                        );
                    }
                )}
            </section>

            {muni_answer}
        </main>
    );
}