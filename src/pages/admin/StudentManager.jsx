import { useState, useEffect } from "react";
import "./student.css";
import searchIcon from "../../assets/icons/search.svg";

export default function StudentManager() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [input, setInput] = useState("");

  const handleApprove = (id) => {
    fetch(`http://localhost:8000/api/students/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const newList = [];
          for (let i = 0; i < pendingStudents.length; i++) {
            if (pendingStudents[i].id !== id) {
              newList.push(pendingStudents[i]);
            }
          }
          setPendingStudents(newList);
          fetchActiveStudents();
        } else {
          alert(data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("승인 요청 중 오류가 발생했습니다.");
      });
  };

  useEffect(() => {
    fetch("http://localhost:8000/api/students/pending")
      .then((res) => res.json())
      .then((data) => setPendingStudents(data))
      .catch((err) => console.error("신규신청 학생정보 불러오기 실패", err));
  }, []);

  useEffect(() => {
    fetchActiveStudents();
  }, []);

  const fetchActiveStudents = () => {
    fetch("http://localhost:8000/api/students/active")
      .then((res) => res.json())
      .then((data) => setActiveStudents(data))
      .catch((err) => console.error("기존 학생정보 불러오기 실패", err));
  };



  return (
    <div className="page">
      <div className="flex flex-col gap-6">
        <label className="searchBar p-4">
          <img src={searchIcon} alt="검색" className="w-4 h-4 mr-2 mb-1"/>
          <input type="text" className="search flex-1" placeholder="학번 혹은 이름을 입력하여 검색" onChange={(e)=>setInput(e.target.value)} ></input>
        </label>
        <section>
          <h2 className="text-lg font-bold mb-3">신규 가입자</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingStudents.map((student) => {
              if(student.name.includes(input)||String(student.student_number).includes(input)){
                return(
                <div key={student.id} className="card newStudent p-5">
                  <div className="card-header">
                    <span className="student-id">{student.student_number}</span>
                    <span className="student-date">{student.created_at}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">이름</span>
                    <span className="value">{student.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">학번</span>
                    <span className="value">{student.student_number}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">전화번호</span>
                    <span className="value">{student.phone}</span>
                  </div>

                  <div className="card-footer">
                    <span className="status-text">승인 전 상태</span>
                    <button className="approve-btn" onClick={() => handleApprove(student.id)}>승인 하기</button>
                  </div>
                </div>);
                return;
              }
            })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">기존 가입자</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeStudents.map((student) =>{
              if(student.name.includes(input)||String(student.student_number).includes(input)){
                return(
                <div key={student.id} className="card student p-5">
                  <div className="card-header">
                    <span className="student-id">{student.student_number}</span>
                    <span className="student-date">{student.created_at}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">이름</span>
                    <span className="value">{student.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">학번</span>
                    <span className="value">{student.student_number}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">전화번호</span>
                    <span className="value">{student.phone}</span>
                  </div>

                  <div className="rental-info">
                    <p>대여 물품: <strong>{student.current_rentals.length > 0 ? student.current_rentals.map(r => r.item_name).join(', ') : '없음'}</strong></p>
                    <p>연체 횟수: <strong>{student.overdue_count}회</strong></p>
                  </div>

                  <div className="card-footer">
                    <span className={`status-btn ${student.is_blocked ? 'disAvail' : 'available'}`}>
                      {student.is_blocked ? '대여 불가' : '대여 가능'}
                    </span>
                  </div>
                </div>);
                return;
              }
            }
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
