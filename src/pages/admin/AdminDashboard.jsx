import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [kpi, setKpi] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/dashboard/kpi")
      .then((res) => res.json())
      .then((data) => setKpi(data))
      .catch((err) => console.error("KPI 불러오기 실패:", err));
  }, []);

  const cards = [
    { label: "총 등록 물품", key: "total_items" },
    { label: "현재 대여 중", key: "rented" },
    { label: "대기 중인 요청", key: "pending" },
    { label: "연체 건수", key: "overdue" },
    { label: "활성화된 사용자", key: "active_users" },
  ];

  return (
    <div className="page">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="text-xs text-[gray] mb-1">{c.label}</div>
            <div className="text-2xl font-bold text-[black]">
              {kpi ? kpi[c.key] : "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
