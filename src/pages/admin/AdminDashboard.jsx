import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#09090b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];

export default function AdminDashboard() {
  const [kpi, setKpi] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/dashboard/kpi")
      .then((res) => res.json())
      .then((data) => setKpi(data))
      .catch((err) => console.error("KPI 불러오기 실패:", err));
  }, []);
  useEffect(()=>{
    fetch("http://localhost:8000/api/dashboard/stats")
    .then((res) => res.json())
    .then((data) => setCategories(data.categories))
    .catch((err) => console.error("카테고리정보 불러오기 실패: ", err));
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        {cards.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="text-xs text-[gray] mb-1">{c.label}</div>
            <div className="text-2xl font-bold text-[black]">
              {kpi ? kpi[c.key] : "-"}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 flex flex-col max-w-lg">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="count"
                nameKey="name"
                innerRadius="50%"
                outerRadius="80%"
              >
                {categories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
