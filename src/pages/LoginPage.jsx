import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
export default function LoginPage() {
    const [studentid, setStudentid] = useState("");
    const [password, setPassword] = useState("");
    const[maintain, setMaintain] = useState(false);
    const navigate = useNavigate();
    const checkLogin= async ()=> {
        if (!studentid || !password) {
            alert("학번과 비밀번호를 모두 입력하세요");
            return;
        }
        try {
            const response = await fetch("http://localhost:8000/api/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        studentid: studentid,
                        password: password,
                    })


                });
            const data = await response.json();

            if (response.ok) {
                const userdata = data.user;

                if (maintain) {
                    localStorage.setItem("username", JSON.stringify(userdata));

                } else {
                    sessionStorage.setItem("username", JSON.stringify(userdata));
                }
                alert(data.message);
                navigate('/');

            } else {
                alert(data.message);
            }
        } catch {
            alert("서버와 연결 오류 발생 2");
        }
    }

return (
<div className="logintemp">
<div className="login">
    <Link to="/"
          className="absolute top-4 right-5 font-bold  text-3xl hover:text-gray-900 dark:text-gray-400">
        ×
        </Link>

    <h1 className="text-2xl font-black tracking-tight text black mb-1"> KNOCK </h1>
    <h1 className="text-base font-semibold text-gray-900 mb-8">로그인</h1>
    <div className="w-full px-8 flex flex-col gap-3">
        <input
            type="text"
            placeholder="학번을 입력하세요"
            value={studentid}
            className="w-full border border-gray-300 p-3 text-sm rounded-lg focus-border-black"
            onChange={(e) => setStudentid(e.target.value)}
                />
        <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            className="w-full border border-gray-300 p-3 text-sm rounded-lg focus-border-black"
            onChange={(e) => setPassword(e.target.value)}
            />
        <div className="flex items-center gap-2 mt-1 mb-4">
            <input type= "checkbox"
                   id="maintain"
                   checked={maintain}
                   onChange={(e) => setMaintain(e.target.checked)}
                   />
            <label htmlFor="maintain" className="text-sm text-gray-600 select-none cursor-pointer">
                로그인 유지
            </label>
        </div>
        <button className="w-full bg-black text-white font-bold py-3.5 rounded-full text-sm hover:bg-zinc-800 transition-colors" onClick={checkLogin}>
            로그인
          </button>


<div className="flex justify-center items-center gap-3 text-xs text-gray-500 mt-6 mb-8">
            <Link to="/signup" className="hover:underline">회원가입</Link>
            <span className="text-gray-300">|</span>
            <a href="#find-pw" className="hover:underline">비밀번호 찾기</a>
          </div>
        </div>

        <div className="w-full px-4 mb-2 text-center">
          <p className="text-xs font-bold text-gray-400 tracking-wide">
            소프트웨어학부 21대 학생회 KNOCK
          </p>
        </div>

      </div>
    </div>
  );


}