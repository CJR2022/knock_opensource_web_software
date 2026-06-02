import { useState, useEffect } from "react";

export default function RentalModal({ item, onClose, onSuccess }) {
    const [schedulelist, setSchedulelist] = useState([]);
    const [closedDays, setClosedDays] = useState([]);

    const [rentWeek, setRentWeek] = useState(0);
    const [rentDate, setRentDate] = useState(new Date());
    const [rentTime, setRentTime] = useState("");

    const [returnWeek, setReturnWeek] = useState(0);
    const [returnDate, setReturnDate] = useState(new Date());
    const [returnTime, setReturnTime] = useState("");

    const compareday = (d) => {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    };

    const getLocalDateString = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/work-schedules');
                if (res.ok) {
                    const data = await res.json();
                    setSchedulelist(data);
                }

                const cRes = await fetch('http://localhost:8000/api/closed-days');
                if (cRes.ok) {
                    const cData = await cRes.json();
                    setClosedDays(cData);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const pDay = compareday(rentDate);
        const rDay = compareday(returnDate);
        const threeday = 3 * 24 * 60 * 60 * 1000;

        if (rDay < pDay || rDay > pDay + threeday) {
            setReturnDate(new Date(rentDate));
            setReturnWeek(rentWeek);
            setReturnTime("");
        } else if (rDay === pDay && rentTime !== "" && returnTime !== "") {
            if (returnTime <= rentTime) {
                setReturnTime("");
            }
        }
    }, [rentDate, rentTime, returnDate, returnTime, rentWeek]);

    if (!item) return null;

    const getTimes = (dateObj) => {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const daystr = days[dateObj.getDay()];
        let parttime = [];
        for (let i = 0; i < schedulelist.length; i++) {
            if (schedulelist[i].work_date === daystr) {
                parttime.push(schedulelist[i].start_time);
            }
        }
        return parttime.sort();
    };

    const makeWeekArr = (offset) => {
        let today = new Date();
        today.setDate(today.getDate() + (offset * 7));
        let start = new Date(today);
        let dayNum = start.getDay();
        let diff = dayNum === 0 ? -6 : 1 - dayNum;
        start.setDate(start.getDate() + diff);
        let daykor = ['월', '화', '수', '목', '금'];
        let resultArr = [];
        for (let i = 0; i < 5; i++) {
            let tempDate = new Date(start);
            tempDate.setDate(start.getDate() + i);
            resultArr.push({
                label: daykor[i],
                date: tempDate.getDate(),
                fullDate: tempDate
            });
        }
        return resultArr;
    };

    const submitRental = async () => {
        if (rentTime === "" || returnTime === "") {
            alert("대여 시간과 반납 시간을 모두 선택해주세요.");
            return;
        }
        let savedUser = sessionStorage.getItem("user");
        if (!savedUser) {
            savedUser = localStorage.getItem("user");
        }
        if (!savedUser) {
            alert("로그인을 해주세요.");
            return;
        }
        const userInfo = JSON.parse(savedUser);
        try {
            const rentStr = `${getLocalDateString(rentDate)} ${rentTime}:00`;
            const returnStr = `${getLocalDateString(returnDate)} ${returnTime}:00`;

            const res = await fetch('http://localhost:8000/api/rentals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userInfo.id,
                    item_id: item.id,
                    quantity: 1,
                    requested_pickup_at: rentStr,
                    requested_return_at: returnStr,
                })
            });
            const resultData = await res.json();
            if (res.ok) {
                alert(`[${item.name}] 대여 신청 되었습니다!`);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert("신청 실패: " + resultData.message);
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const pDay = compareday(rentDate);
    const rDay = compareday(returnDate);
    const rentSlots = getTimes(rentDate);
    const returnSlots = getTimes(returnDate);

    const getClosedDayInfo = (dateStr) => {
        return closedDays.find(d => d.closed_date === dateStr);
    };

    const rentClosedInfo = getClosedDayInfo(getLocalDateString(rentDate));
    const returnClosedInfo = getClosedDayInfo(getLocalDateString(returnDate));

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <button onClick={onClose} className="modal-close-btn">×</button>

                <div className="modal-section items-center justify-center text-center">
                    <div className="item-image-box">
                        {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-gray-600">이미지 오류</span>
                        )}
                    </div>

                    <h2 className="text-xl font-black mb-5 tracking-light">{item.name}</h2>
                    <div className="flex gap-2 flex-wrap justify-center">
                        <span className="badge badge-green">가능 {item.available}</span>
                        <span className="badge badge-red">대여중 {item.inUse}</span>
                        <span className="badge badge-gray">준비중 {item.preparing}</span>
                    </div>
                </div>

                <div className="modal-section">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-800">대여일 선택</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setRentWeek(rentWeek - 1)} className="week-btn">←</button>
                            <button onClick={() => setRentWeek(rentWeek + 1)} className="week-btn">→</button>
                        </div>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-4 mb-4 px-1">
                        {makeWeekArr(rentWeek).map((dayObj, i) => {
                            const isSelect = rentDate.toDateString() === dayObj.fullDate.toDateString();
                            const currentDayTime = compareday(dayObj.fullDate);
                            const todayTime = compareday(new Date());
                            const formatDay = getLocalDateString(dayObj.fullDate);

                            const isPast = currentDayTime < todayTime;
                            const isClosedDay = getClosedDayInfo(formatDay) !== undefined;
                            const isDisabled = isPast;

                            return (
                                <button
                                    key={`rent-${i}`}
                                    disabled={isDisabled}
                                    onClick={() => {
                                        setRentDate(dayObj.fullDate);
                                        setRentTime("");
                                    }}
                                    className="day-btn group"
                                >
                                    <span className={`text-xs font-bold ${isSelect ? 'text-black' : isClosedDay ? 'text-red-400' : 'text-gray-400'}`}>
                                        {dayObj.label}
                                    </span>
                                    <span className={`day-circle ${isSelect ? 'bg-black text-white shadow-md' : isClosedDay ? 'text-red-500 bg-red-50' : 'text-gray-600 group-hover:bg-gray-100'}`}>
                                        {dayObj.date}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {rentClosedInfo ? (
                        <div className="empty-text" style={{ color: '#ef4444', borderColor: '#fca5a5', padding: '16px 0' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>휴무일로 지정되어 대여가 불가합니다.</p>
                            <p style={{ color: '#b91c1c' }}>사유: {rentClosedInfo.reason}</p>
                        </div>
                    ) : rentSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                            {rentSlots.map(timeStr => (
                                <button
                                    key={`rt-${timeStr}`}
                                    onClick={() => setRentTime(timeStr)}
                                    className={`time-btn ${rentTime === timeStr ? 'active' : ''}`}
                                >
                                    {timeStr}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-text">운영 일정이 없습니다.</p>
                    )}

                    <div className="mt-auto pt-6">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 h-full">
                            <p className="text-xs text-gray-700 font-bold leading-relaxed tracking-wide">
                                대여 시 안내사항<br /><br />
                                선택하신 시간에 맞춰 학생회실을 방문하여 대여물품을 수령해 주세요.<br />
                                (대여 기간은 최대 3일입니다.)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="modal-section">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-800">반납일 선택</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setReturnWeek(returnWeek - 1)} className="week-btn">←</button>
                            <button onClick={() => setReturnWeek(returnWeek + 1)} className="week-btn">→</button>
                        </div>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-4 mb-4 px-1">
                        {makeWeekArr(returnWeek).map((dayObj, i) => {
                            const isSelect = returnDate.toDateString() === dayObj.fullDate.toDateString();
                            const currentDayTime = compareday(dayObj.fullDate);
                            const formatDay = getLocalDateString(dayObj.fullDate);
                            const threeDays = 3 * 24 * 60 * 60 * 1000;

                            const isClosedDay = getClosedDayInfo(formatDay) !== undefined;
                            const isInvalid = currentDayTime < pDay || currentDayTime > (pDay + threeDays);

                            return (
                                <button
                                    key={`return-${i}`}
                                    disabled={isInvalid}
                                    onClick={() => {
                                        setReturnDate(dayObj.fullDate);
                                        setReturnTime("");
                                    }}
                                    className={`day-btn group ${isInvalid ? 'day-btn-disabled' : ''}`}
                                >
                                    <span className={`text-xs font-bold ${isSelect ? 'text-black' : isClosedDay ? 'text-red-400' : 'text-gray-400'}`}>
                                        {dayObj.label}
                                    </span>
                                    <span className={`day-circle ${isSelect ? 'bg-black text-white shadow-md' : isClosedDay && !isInvalid ? 'text-red-500 bg-red-50' : 'text-gray-600 group-hover:bg-gray-100'}`}>
                                        {dayObj.date}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {returnClosedInfo ? (
                        <div className="empty-text" style={{ color: '#ef4444', borderColor: '#fca5a5', padding: '16px 0' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>휴무일로 지정되어 반납이 불가합니다.</p>
                            <p style={{ color: '#b91c1c' }}>사유: {returnClosedInfo.reason}</p>
                        </div>
                    ) : returnSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                            {returnSlots.map(timeStr => {
                                let timeDisabled = false;
                                if (rDay === pDay && rentTime !== "" && timeStr <= rentTime) {
                                    timeDisabled = true;
                                }
                                let btnClass = "time-btn ";
                                if (returnTime === timeStr) btnClass += "!border-black !bg-gray-900 !text-white ";
                                if (timeDisabled) btnClass += "opacity-30 cursor-not-allowed !bg-gray-50";
                                return (
                                    <button
                                        key={`rTime-${timeStr}`}
                                        disabled={timeDisabled}
                                        onClick={() => setReturnTime(timeStr)}
                                        className={btnClass}
                                    >
                                        {timeStr}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="empty-text">운영 일정이 없습니다.</p>
                    )}

                    <div className="mt-auto pt-6">
                        <button
                            onClick={submitRental}
                            disabled={rentClosedInfo || returnClosedInfo}
                            className={`submit-btn ${rentClosedInfo || returnClosedInfo ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            대여 신청
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}