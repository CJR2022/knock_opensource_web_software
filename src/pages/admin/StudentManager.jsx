import {useState, useEffect} from "react";


export default function StudentManager() {
    
    const [pendingStudents, setPendingStudents] = useState();
    const [activeStudent, setActiveStudent] = useState();

    useEffect(()=>{
        fetch('"http://localhost:8000/api/students/pending')
        .then((res)=>res.json())
        .then((data) => setPendginStudents(data))
        .catch((err)=> console.error("신규신청 학생정보 불러오기 실패",err));
    })
    useEffect(()=>{
        fetch('"http://localhost:8000/api/students/active')
        .then((res)=>res.json())
        .then((data) => setActiveStudents(data))
        .catch((err)=> console.error("기존 학생정보 불러오기 실패",err));
    })


    return (
        <div className="page">

        </div>
    );
}