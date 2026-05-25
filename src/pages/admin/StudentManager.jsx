import { useState, useEffect } from "react";
import "./student.css";
import searchIcon from "../../assets/icons/search.svg";

export default function StudentManager() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/students/pending")
      .then((res) => res.json())
      .then((data) => setPendingStudents(data))
      .catch((err) => console.error("신규신청 학생정보 불러오기 실패", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/students/active")
      .then((res) => res.json())
      .then((data) => setActiveStudents(data))
      .catch((err) => console.error("기존 학생정보 불러오기 실패", err));
  }, []);

  return (
    <div className="page">
      <div className="flex flex-col gap-6">
        <label className="searchBar p-4">
          <img src={searchIcon} alt="검색" className="w-4 h-4 mr-2 mb-1"/>
          <input type="text" className="search flex-1" placeholder="학번 혹은 이름을 입력하여 검색" ></input>
        </label>
        <section>
          <h2 className="text-lg font-bold mb-3">신규 가입자</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pendingStudents.map((student) => (
              <div key={student.id} className="card newStudent p-4">
                <p>{student.student_number}</p>
                <p>{student.name}</p>
                <p>{student.phone}</p>
                <p>{student.created_at}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">기존 가입자</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {activeStudents.map((student) => (
              <div key={student.id} className="card p-4">
                <p>{student.student_number}</p>
                <p>{student.name}</p>
                <p>{student.phone}</p>
                <p>{student.created_at}</p>
                <span>대여: </span>
                {student.current_rentals.map((rental) =>{
                    <span>{rental.item_name} </span>
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
