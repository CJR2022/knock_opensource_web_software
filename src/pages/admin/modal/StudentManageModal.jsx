import {useState} from "react";
import "../student.css";
import alert2 from "sweetalert2";

export default function StudentManageModal({student, onClose, onUpdate}) {
    const [loading, setLoading] = useState(false);

    const handleBlock = (type) => {
        if (loading) return;

        alert2.fire({
            text: "차단하시겠습니까?",
            showCancelButton: true,
            confirmButtonText: "차단",
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
            if (!result.isConfirmed) return;

            setLoading(true);

            fetch(`http://localhost:8000/api/students/${student.id}/block`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({type}),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        onUpdate();
                        onClose();
                    } else {
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
                    }
                })
                .catch((err) => {
                    console.error(err);
                    alert2.fire({
                        text: "차단 요청 중 오류가 발생했습니다.",
                        confirmButtonText: "확인",
                        confirmButtonColor: "#09090b",
                        customClass: {
                            title: "custom-popup-title",
                            htmlContainer: "custom-popup-content",
                            confirmButton: "custom-confirm"
                        }
                    });
                })
                .finally(() => setLoading(false));
        });
    };

    const handleUnblock = () => {
        if (loading) return;
        alert2.fire({
            text: "차단 해제하시겠습니까?",
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
            if (!result.isConfirmed) return;

            setLoading(true);
            fetch(`http://localhost:8000/api/students/${student.id}/unblock`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        onUpdate();
                        onClose();
                    } else {
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
                    }
                })
                .catch((err) => {
                    console.error(err);
                    alert2.fire({
                        text: "차단 해제 요청 중 오류가 발생했습니다.",
                        confirmButtonText: "확인",
                        confirmButtonColor: "#09090b",
                        customClass: {
                            title: "custom-popup-title",
                            htmlContainer: "custom-popup-content",
                            confirmButton: "custom-confirm"
                        }
                    });
                })
                .finally(() => setLoading(false));
        });
    };

    return (
        <>
            <div className="s-modal-box">
                <h3 className="s-modal-title">{student.name} 학생 관리</h3>
                <div className="s-modal-info">
                    <p>학번: {student.student_number}</p>
                    <p>전화번호: {student.phone}</p>
                    <p>상태: {student.is_blocked ? "대여 불가" : "대여 가능"}</p>
                    {student.block_period && (
                        <p>차단 만료: {student.block_period}</p>
                    )}
                </div>
                <div className="s-modal-btns">
                    {!student.is_blocked ? (
                        <>
                            <button
                                className="btn-block"
                                onClick={() => handleBlock("1")}
                                disabled={loading}
                            >
                                1일 차단
                            </button>
                            <button
                                className="btn-block"
                                onClick={() => handleBlock("3")}
                                disabled={loading}
                            >
                                3일 차단
                            </button>
                            <button
                                className="btn-block"
                                onClick={() => handleBlock("7")}
                                disabled={loading}
                            >
                                7일 차단
                            </button>
                            <button
                                className="btn-block permanent"
                                onClick={() => handleBlock("permanent")}
                                disabled={loading}
                            >
                                영구 차단
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn-unblock"
                            onClick={handleUnblock}
                            disabled={loading}
                        >
                            차단 해제
                        </button>
                    )}
                </div>
                <button className="s-modal-close-btn" onClick={onClose}>
                    닫기
                </button>
            </div>
            <div className="s-modal-overlay" onClick={onClose}/>
        </>
    );
}
