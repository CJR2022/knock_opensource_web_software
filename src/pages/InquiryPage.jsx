import {useEffect, useState} from "react";
import "../InquiryPage.css";

const USER_ID = 1;
/*임시 id 1번 나중에 */

const faqList = [
    {
        id: 1,
        munititle: "물품을 파손해 버렸는데 어떻게 하나요?",
        municontent: "물품이 파손된 경우 반납시 학생회 근무자에게 말씀해 주세요. 그 후에 추가적인 조치가 있습니다. 물품이 파손된 경우 반납시 학생회 근무자에게 말씀해 주세요. 그 후에 추가적인 조치가 있습니다. 물품이 파손된 경우 반납시 학생회 근무자에게 말씀해 주세요. 그 후에 추가적인 조치가 있습니다.",
    },
    {
        id: 2,
        munititle: "물품 반납을 일찍해도 괜찮을까요?",
        municontent: "네, 반납 예정일보다 일찍 반납해도 괜찮습니다. 반납시 학생회 인원에게 학번과 이름을 말씀주시면 반납처리를 해드립니다.",
    },
    {
        id: 3,
        munititle: "?",
        municontent: "립니다.",
    },
    {
        id: 2,
        munititle: "물품 반납을 일찍해도 괜찮을까요?",
        municontent: "네, 반납 예정일보다 일찍 반납해도 괜찮습니다. 반납시 학생회 인원에게 학번과 이름을 말씀주시면 반납처리를 해드립니다.",
    },
    {
        id: 2,
        munititle: "물품 반납을 일찍해도 괜찮을까요?",
        municontent: "네, 반납 예정일보다 일찍 반납해도 괜찮습니다. 반납시 학생회 인원에게 학번과 이름을 말씀주시면 반납처리를 해드립니다.",
    },
    {
        id: 2,
        munititle: "물품 반납을 일찍해도 괜찮을까요?",
        municontent: "네, 반납 예정일보다 일찍 반납해도 괜찮습니다. 반납시 학생회 인원에게 학번과 이름을 말씀주시면 반납처리를 해드립니다.",
    },
    {
        id: 2,
        munititle: "물품 반납을 일찍해도 괜찮을까요?",
        municontent: "네, 반납 예정일보다 일찍 반납해도 괜찮습니다. 반납시 학생회 인원에게 학번과 이름을 말씀주시면 반납처리를 해드립니다.",
    },
    {
        id: 2,
        munititle: "물품 반납을 일찍해도 괜찮을까요?",
        municontent: "네, 반납 예정일보다 일찍 반납해도 괜찮습니다. 반납시 학생회 인원에게 학번과 이름을 말씀주시면 반납처리를 해드립니다.",
    },
    {
        id: 2,
        munititle: "물품 반납을 일찍해도 괜찮을까요?",
        municontent: "네, 반납 예정일보다 일찍 반납해도 괜찮습니다. 반납시 학생회 인원에게 학번과 이름을 말씀주시면 반납처리를 해드립니다.",
    },
];


export default function InquiryPage() { /*로그인 구현시 props로 받고 USER_ID = props.userID; 로 받아오면 될거 같은데 */
    const [faqorquestion, setfaqorquestion] = useState("faq");
    const [faqSelector, setfaqSelector] = useState(null);
    const [userstatus, setuserstatus] = useState("");
    const [munititle, setmunititle] = useState("");
    const [municontent, setmunicontent] = useState("");
    const cansend = userstatus === "active";

    let tabbody = "";
    let munibody = "";
    let faqpopup = "";
    let message = "";


    useEffect(() => {
        window.scrollTo(0, 0);

        fetch(`http://localhost:8000/api/users/${USER_ID}/status`)
            .then((res) => res.json())
            .then((data) => {
                setuserstatus(data.status);
            });
    }, []);


    const submitgo = (e) => {
        e.preventDefault();
        if (!cansend) {
            alert("회원가입 승인된 학생만 문의를 보낼 수 있습니다.");
            return;
        }
        if (munititle === "" || municontent === "") {
            alert("문의 제목과 문의 내용을 입력해주세요.");
            return;
        }

        fetch("http://localhost:8000/api/inquiries", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: USER_ID,
                munititle: munititle,
                municontent: municontent,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                alert(data.message);
                if (data.success) {
                    setmunititle("");
                    setmunicontent("");
                }
            });
    };

    function faqclosego() {
        setfaqSelector(null);
    }

    if (faqSelector !== null) {
        faqpopup = (
            <div>
                <div className="faqopenbg" onClick={faqclosego}></div>
                
                <div className="faqdetail">
                    <button className="faqclose" onClick={() => setfaqSelector(null)}>x</button>
                    <h3>{faqSelector.munititle}</h3>
                    <p>{faqSelector.municontent}</p>
                </div>
            </div>
        );
    }


    if (!cansend) {
        message = (
            <p className="inquirymessage"> 회원가입 승인된 학생만 문의를 보낼 수 있습니다.</p>
        );
    }

    if (faqorquestion === "faq") {
        tabbody = (
            <div className="inquirytabs">
                <button className="inquirytab selected" onClick={() => setfaqorquestion("faq")}>FAQ</button>
                <button className="inquirytab" onClick={() => setfaqorquestion("send")}>문의 사항</button>
            </div>
        );

        munibody = (
            <div className="faqarea grid grid-cols-1 md:grid-cols-2 gap-4">
                {faqList.map((faq) => (
                    <button className="faqcard" key={faq.id} onClick={() => setfaqSelector(faq)}>
                        <h3>{faq.munititle}</h3>
                        <p>{faq.municontent}</p>
                    </button>
                ))}

            </div>
        );
    }

    if (faqorquestion === "send") {
        tabbody = (
            <div className="inquirytabs">
                <button className="inquirytab" onClick={() => setfaqorquestion("faq")}>FAQ</button>
                <button className="inquirytab selected" onClick={() => setfaqorquestion("send")}>문의 사항</button>
            </div>
        );

        munibody = (
            <form className="inquiryform" onSubmit={submitgo}>
                {message}

                <input type="text" placeholder="문의 제목" value={munititle}
                       onChange={(e) => setmunititle(e.target.value)}
                       disabled={!cansend}/>

                <textarea placeholder="문의 내용" value={municontent}
                          onChange={(e) => setmunicontent(e.target.value)}
                          disabled={!cansend}/>

                <button className="sendbtn" type="submit" disabled={!cansend}>보내기</button>
            </form>
        );
    }

    return (
        <main className="page">
            <div className="hero px-6 py-5 mb-8">
                <h1 className="hero-title">문의사항</h1>
                <p className="hero-desc"> 문의사항을 통해 궁금한 내용을 질문하고 답변을 확인할 수 있습니다.</p>
            </div>

            <section className="inquirypage">
                <div className="inquirymunicontent">
                    {tabbody}
                    {munibody}
                    {faqpopup}
                </div>
            </section>
        </main>
    );
}