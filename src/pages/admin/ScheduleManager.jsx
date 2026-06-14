import {useEffect, useState} from "react";
import "./ScheduleManager.css";
import alert2 from "sweetalert2";

export default function ScheduleManager() {
    const [scheduleList, setScheduleList] = useState([]);
    const [adminList, setAdminList] = useState([]);
    const [closedDays, setClosedDays] = useState([]);

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [newStartTime, setNewStartTime] = useState("");
    const [newEndTime, setNewEndTime] = useState("");
    const [selectedAdminId, setSelectedAdminId] = useState("");
    const [closeReason, setCloseReason] = useState("");

    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [editAdminId, setEditAdminId] = useState("");

    const dbWeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const korWeekDays = ['일', '월', '화', '수', '목', '금', '토'];

    const timeOptions = Array.from({length: 14}, (_, i) => {
        const hour = String(i + 9).padStart(2, '0');
        return `${hour}:00`;
    });

    const getFormattedDate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchAllData = async () => {
        try {
            const res = await fetch(' /api/admin/schedule-init-data');
            if (res.ok) {
                const data = await res.json();
                setAdminList(data.admins);
                setScheduleList(data.schedules);
                setClosedDays(data.closedDays);
            }
        } catch (error) {
            console.error("데이터 에러:");
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleAddSchedule = async () => {
        if (!newStartTime || !newEndTime || !selectedAdminId) {
            alert2.fire({
                text: "시작 시간, 종료 시간, 그리고 담당 관리자를 모두 선택해주세요.",
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
        if (newStartTime >= newEndTime) {
            alert2.fire({
                text: "종료 시간은 시작 시간보다 늦어야 합니다.",
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

        const targetDayStr = dbWeekDays[selectedDate.getDay()];
        try {
            const res = await fetch(' /api/admin/work-schedules', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    work_date: targetDayStr,
                    start_time: newStartTime,
                    end_time: newEndTime,
                    admin_id: selectedAdminId
                })
            });
            if (res.ok) {
                alert2.fire({
                    text: "근무 일정이 추가되었습니다.",
                    confirmButtonText: "확인",
                    confirmButtonColor: "#09090b",
                    customClass: {
                        title: "custom-popup-title",
                        htmlContainer: "custom-popup-content",
                        confirmButton: "custom-confirm"
                    }
                });
                setNewStartTime("");
                setNewEndTime("");
                setSelectedAdminId("");
                fetchAllData();
            } else {
                const errorData = await res.json();
                alert2.fire({
                    text: errorData.message,
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
            alert2.fire({
                text: "서버 오류가 발생했습니다.",
                confirmButtonText: "확인",
                confirmButtonColor: "#09090b",
                customClass: {
                    title: "custom-popup-title",
                    htmlContainer: "custom-popup-content",
                    confirmButton: "custom-confirm"
                }
            });
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        const result = await alert2.fire({
            text: "이 근무 일정을 삭제하시겠습니까?",
            showCancelButton: true,
            confirmButtonText: "삭제",
            cancelButtonText: "취소",
            confirmButtonColor: "#be123c",
            cancelButtonColor: "#71717a",
            customClass: {
                title: "custom-popup-title",
                htmlContainer: "custom-popup-content",
                confirmButton: "custom-confirm",
                cancelButton: "custom-cancel"
            }
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(` /api/admin/work-schedules/${scheduleId}`, {method: 'DELETE'});
            if (res.ok) {
                alert2.fire({
                    text: "삭제되었습니다.",
                    confirmButtonText: "확인",
                    confirmButtonColor: "#09090b",
                    customClass: {
                        title: "custom-popup-title",
                        htmlContainer: "custom-popup-content",
                        confirmButton: "custom-confirm"
                    }
                });
                fetchAllData();
            }
        } catch (error) {
            alert2.fire({
                text: "삭제 중 오류가 발생했습니다.",
                confirmButtonText: "확인",
                confirmButtonColor: "#09090b",
                customClass: {
                    title: "custom-popup-title",
                    htmlContainer: "custom-popup-content",
                    confirmButton: "custom-confirm"
                }
            });
        }
    };

    const handleEditStart = (schedule) => {
        setEditingScheduleId(schedule.id);
        setEditAdminId(schedule.admin_id);
    };

    const handleEditCancel = () => {
        setEditingScheduleId(null);
        setEditAdminId("");
    };

    const handleEditSave = async (scheduleId) => {
        if (!editAdminId) {
            alert2.fire({
                text: "변경할 관리자를 선택해주세요.",
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

        try {
            const res = await fetch(` /api/admin/work-schedules/${scheduleId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({admin_id: editAdminId})
            });
            if (res.ok) {
                alert2.fire({
                    text: "담당 관리자가 변경되었습니다.",
                    confirmButtonText: "확인",
                    confirmButtonColor: "#09090b",
                    customClass: {
                        title: "custom-popup-title",
                        htmlContainer: "custom-popup-content",
                        confirmButton: "custom-confirm"
                    }
                });

                setEditingScheduleId(null);
                fetchAllData();
            } else {
                const errorData = await res.json();

                alert2.fire({
                    text: errorData.message,
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
            alert2.fire({
                text: "서버 오류가 발생했습니다.",
                confirmButtonText: "확인",
                confirmButtonColor: "#09090b",
                customClass: {
                    title: "custom-popup-title",
                    htmlContainer: "custom-popup-content",
                    confirmButton: "custom-confirm"
                }
            });
        }
    };

    const handleAddClosedDay = async () => {
        if (!closeReason.trim()) {
            alert2.fire({
                text: "휴무 사유를 입력해주세요.",
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

        try {
            const res = await fetch(' /api/admin/closed-days', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({closed_date: getFormattedDate(selectedDate), reason: closeReason})
            });
            if (res.ok) {
                alert2.fire({
                    text: "휴무일로 지정되었습니다.",
                    confirmButtonText: "확인",
                    confirmButtonColor: "#09090b",
                    customClass: {
                        title: "custom-popup-title",
                        htmlContainer: "custom-popup-content",
                        confirmButton: "custom-confirm"
                    }
                });

                setCloseReason("");
                fetchAllData();
            } else {
                const errorData = await res.json();

                alert2.fire({
                    text: errorData.message,
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
            alert2.fire({
                text: "서버 오류가 발생했습니다.",
                confirmButtonText: "확인",
                confirmButtonColor: "#09090b",
                customClass: {
                    title: "custom-popup-title",
                    htmlContainer: "custom-popup-content",
                    confirmButton: "custom-confirm"
                }
            });
        }
    };

    const handleDeleteClosedDay = async (dayId) => {
        const result = await alert2.fire({
            text: "휴무일 지정을 해제하시겠습니까?",
            showCancelButton: true,
            confirmButtonText: "해제",
            cancelButtonText: "취소",
            confirmButtonColor: "#be123c",
            cancelButtonColor: "#71717a",
            customClass: {
                title: "custom-popup-title",
                htmlContainer: "custom-popup-content",
                confirmButton: "custom-confirm",
                cancelButton: "custom-cancel"
            }
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(` /api/admin/closed-days/${dayId}`, {method: 'DELETE'});
            if (res.ok) {
                alert2.fire({
                    text: "휴무일이 해제되었습니다.",
                    confirmButtonText: "확인",
                    confirmButtonColor: "#09090b",
                    customClass: {
                        title: "custom-popup-title",
                        htmlContainer: "custom-popup-content",
                        confirmButton: "custom-confirm"
                    }
                });
                fetchAllData();
            }
        } catch (error) {
            alert2.fire({
                text: "삭제 중 오류가 발생했습니다.",
                confirmButtonText: "확인",
                confirmButtonColor: "#09090b",
                customClass: {
                    title: "custom-popup-title",
                    htmlContainer: "custom-popup-content",
                    confirmButton: "custom-confirm"
                }
            });
        }
    };

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const selectedDayStr = dbWeekDays[selectedDate.getDay()];
    const currentDaySchedules = scheduleList.filter(s => s.work_date === selectedDayStr);

    const selectedDateStr = getFormattedDate(selectedDate);
    const currentClosedDay = closedDays.find(d => d.closed_date === selectedDateStr);
    const isClosed = !!currentClosedDay;

    // 달력 UI (디자인 유지)
    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
        const totalSlots = [...blanks, ...days];

        return (
            <div className="mt-4">
                <div className="grid grid-cols-7 gap-1 text-center border-b border-gray-100 pb-3 mb-3">
                    {korWeekDays.map((d, idx) => (
                        <div key={d}
                             className={`text-[13px] font-extrabold ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                    {totalSlots.map((d, i) => {
                        if (!d) return <div key={i}></div>;

                        const dateStr = getFormattedDate(new Date(year, month, d));
                        const isClosedDay = closedDays.some(cd => cd.closed_date === dateStr);
                        const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                        const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;

                        let btnClass = "w-9 h-9 mx-auto flex items-center justify-center rounded-full text-[14px] font-bold transition-all ";

                        if (isSelected) {
                            btnClass += isClosedDay ? "bg-red-500 text-white shadow-md shadow-red-200" : "bg-black text-white shadow-md shadow-gray-300";
                        } else if (isClosedDay) {
                            btnClass += "text-red-500 hover:bg-red-50";
                        } else if (isToday) {
                            btnClass += "bg-gray-100 text-black";
                        } else {
                            btnClass += "text-gray-700 hover:bg-gray-100 hover:text-black";
                        }

                        return (
                            <div key={i} className="flex flex-col items-center justify-center relative h-10">
                                <button
                                    onClick={() => setSelectedDate(new Date(year, month, d))}
                                    className={btnClass}
                                    title={isClosedDay ? "휴무일" : ""}
                                >
                                    {d}
                                </button>
                                {isClosedDay && !isSelected && (
                                    <div className="w-1 h-1 bg-red-400 rounded-full absolute bottom-0"></div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="page">
            <h2 className="schedule-title">근무표 및 휴무일 관리</h2>

            <div className="schedule-layout">
                <div className="card p-6 flex-1 md:max-w-md w-full">
                    <div className="schedule-header" style={{borderBottom: 'none', paddingBottom: 0}}>
                        <h3 className="schedule-section-title" style={{fontSize: '18px', fontWeight: 900}}>
                            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={prevMonth}
                                    className="week-btn text-gray-600 font-bold px-3 hover:text-black">
                                &lt;
                            </button>
                            <button onClick={nextMonth}
                                    className="week-btn text-gray-600 font-bold px-3 hover:text-black">
                                &gt;
                            </button>
                        </div>
                    </div>

                    {renderCalendar()}

                    <div className="mt-8">
                        <div className="schedule-info-box">
                            <p className="schedule-info-text">
                                관리 안내사항<br/><br/>
                                달력의 날짜를 클릭하여 해당 요일의 전체 근무표를 관리하거나, 특정 날짜를 예외적인 휴무일로 지정할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="schedule-right">

                    {isClosed ? (

                        <div className="card closed-day-card h-full">
                            <h1 className="closed-day-badge">휴 무 일</h1>
                            <h2 className="closed-day-title">
                                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일은 휴무일입니다.
                            </h2>
                            <p className="closed-day-reason">
                                사유: {currentClosedDay.reason}
                            </p>
                            <button
                                onClick={() => handleDeleteClosedDay(currentClosedDay.id)}
                                className="submit-btn !bg-red-500 hover:!bg-red-600 max-w-xs"
                            >
                                휴무일 해지
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="card p-6">
                                <div className="schedule-header">
                                    <h3 className="schedule-section-title">
                                        {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                                        ({korWeekDays[selectedDate.getDay()]}) 근무 현황
                                    </h3>
                                </div>

                                {currentDaySchedules.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {currentDaySchedules.map((schedule) => {
                                            const isEditing = editingScheduleId === schedule.id;

                                            return (
                                                <div key={schedule.id} className="schedule-card-item">
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <div className="flex items-center">
                                                            <span
                                                                className="time-btn2 active px-4 py-2 pointer-events-none">
                                                                {schedule.start_time} ~ {schedule.end_time}
                                                            </span>
                                                        </div>

                                                        {isEditing ? (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span className="text-xs font-bold text-gray-700">담당자 변경:</span>
                                                                <select
                                                                    value={editAdminId}
                                                                    onChange={(e) => setEditAdminId(e.target.value)}
                                                                    className="schedule-form-select !p-2 !text-sm flex-1 max-w-xs"
                                                                >
                                                                    <option value="" disabled>관리자 선택</option>
                                                                    {adminList.map(admin => (
                                                                        <option key={admin.id} value={admin.id}>
                                                                            {admin.name} ({admin.student_number})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : (
                                                            <span className="schedule-admin-label">
                                                                담당 관리자: <span
                                                                className="text-black">{schedule.admin_name}</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="schedule-action-group">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={() => handleEditSave(schedule.id)}
                                                                        className="schedule-action-btn blue">저장
                                                                </button>
                                                                <button onClick={handleEditCancel}
                                                                        className="schedule-action-btn text-gray-500">취소
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEditStart(schedule)}
                                                                        className="schedule-action-btn blue">수정
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                                                    className="schedule-action-btn red">삭제
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="empty-text mt-2">등록된 일정이 없습니다.</p>
                                )}
                            </div>

                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="card p-6 flex-1">
                                    <div className="schedule-header">
                                        <h3 className="schedule-section-title">새 근무 추가</h3>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <select value={newStartTime}
                                                        onChange={(e) => setNewStartTime(e.target.value)}
                                                        className="schedule-form-select">
                                                    <option value="" disabled>시작</option>
                                                    {timeOptions.map(time => <option key={`start-${time}`}
                                                                                     value={time}>{time}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <select value={newEndTime}
                                                        onChange={(e) => setNewEndTime(e.target.value)}
                                                        className="schedule-form-select">
                                                    <option value="" disabled>종료</option>
                                                    {timeOptions.map(time => <option key={`end-${time}`}
                                                                                     value={time}>{time}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <select value={selectedAdminId}
                                                    onChange={(e) => setSelectedAdminId(e.target.value)}
                                                    className="schedule-form-select">
                                                <option value="" disabled>담당 관리자</option>
                                                {adminList.map(admin => <option key={admin.id}
                                                                                value={admin.id}>{admin.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button onClick={handleAddSchedule} className="submit-btn">
                                            추가하기
                                        </button>
                                    </div>
                                </div>

                                <div className="card p-6 flex-1 border-t-[3px] border-t-red-500">
                                    <div className="schedule-header">
                                        <h3 className="schedule-section-title text-red-600">휴무일 지정 </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold mb-4">* 선택하신 {selectedDate.getDate()}일
                                        휴무일로 지정합니다.</p>

                                    <div className="flex flex-col gap-3 mt-auto">
                                        <input
                                            type="text"
                                            placeholder="사유 (예: 기말고사)"
                                            value={closeReason}
                                            onChange={(e) => setCloseReason(e.target.value)}
                                            className="schedule-input"
                                        />
                                        <button
                                            onClick={handleAddClosedDay}
                                            className="submit-btn !bg-red-500 hover:!bg-red-600 mt-2"
                                        >
                                            휴무 처리
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}