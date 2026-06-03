import {useState, useRef} from "react";
import {Link, useNavigate} from "react-router-dom";
import alert2 from "sweetalert2";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [studentid, setStudentid] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");

    const navigate = useNavigate();

    const [qrimage, setQrimage] = useState(null);
    const [qrpreview, setQrpreview] = useState(null);

    const ref = useRef(null);
    const Fileinput = (e) => {
        const file = e.target.files[0];
        if (file) {
            setQrimage(file);
            setQrpreview(URL.createObjectURL(file));
        }

    };
    const checksignUp = async () => {
        if (!name || !studentid || !password || !phone || !qrimage) {
            alert2.fire({
                text: "모든 회원정보를 입력해 주세요.",
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


        const formdata = new FormData();
        formdata.append("name", name);
        formdata.append("studentid", studentid);
        formdata.append("password", password);
        formdata.append("phone", phone);
        formdata.append("qrimage", qrimage);
        try {
            const response = await fetch("http://localhost:8000/api/signup", {
                method: "POST",
                body: formdata,

            });
            const result = await response.json();
            if (response.ok) {
                alert2.fire({
                    text: "회원가입이 완료 되었습니다",
                    confirmButtonText: "확인",
                    confirmButtonColor: "#09090b",
                    customClass: {
                        title: "custom-popup-title",
                        htmlContainer: "custom-popup-content",
                        confirmButton: "custom-confirm"
                    }
                }).then(() => {
                    navigate("/login");
                });
            } else {
                alert2.fire({
                    text: "가입 실패 : " + result.message,
                    confirmButtonText: "확인",
                    confirmButtonColor: "#09090b",
                    customClass: {
                        title: "custom-popup-title",
                        htmlContainer: "custom-popup-content",
                        confirmButton: "custom-confirm"
                    }
                });
            }
        } catch (error) {
            console.log(error);
            alert2.fire({
                text: "서버연결오류",
                confirmButtonText: "확인",
                customClass: {
                    title: "custom-popup-title",
                    htmlContainer: "custom-popup-content",
                    confirmButton: "custom-confirm"
                }
            });
        }
    }


    const imagearea = () => {
        if (qrpreview) {
            return <img src={qrpreview} alt="qr" className="h-full"/>
        }

        return (
            <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">모바일 학생증 QR 업로드</p>
                <p className="text-xs text-gray-400 mt-1">이곳을 클릭하여 이미지를 업로드해주세요</p>

            </div>
        );
    };
    return (
        <div className="logintemp">
            <div className="login overflow-y-auto custom-scrollbar">
                <Link to="/"
                      className="absolute top-4 right-5 font-bold  text-3xl hover:text-gray-900 dark:text-gray-400">
                    ×
                </Link>

                <h1 className="text-2xl font-black tracking-tight text-black mb-1"> KNOCK </h1>
                <h1 className="text-base font-semibold text-gray-900 mb-8">회원가입</h1>
                <div className="w-full px-8 flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="이름을 입력하세요"
                        value={name}
                        className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:border-black"
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="학번을 입력하세요"
                        value={studentid}
                        className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:border-black"
                        onChange={(e) => setStudentid(e.target.value)}
                    />

                    <input type="password"
                           className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:border-black"
                           placeholder="비밀번호를 입력하세요"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                    />
                    <input type="text"
                           placeholder="전화번호를 입력하세요"
                           className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:border-black"

                           value={phone}
                           onChange={(e) => setPhone(e.target.value)}
                    />
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center
         justify-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative mb-4"
                         onClick={() => ref.current.click()}
                    >
                        <input type="file"
                               accept="image/*"
                               className="hidden"
                               ref={ref}
                               onChange={Fileinput}
                        />
                        {imagearea()}
                    </div>

                    <button
                        className="w-full bg-black text-white font-bold py-3.5 rounded-full text-sm hover:bg-zinc-800 transition-colors"
                        onClick={checksignUp}>
                        QR 인증 후 가입하기
                    </button>


                    <div className="w-full px-4 mb-2 text-center">
                        <p className="text-xs font-bold text-gray-400 tracking-wide">
                            소프트웨어학부 14대 학생회 KNOCK
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

