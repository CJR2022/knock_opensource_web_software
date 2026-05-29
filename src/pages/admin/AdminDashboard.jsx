import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from "recharts";
import "./AdminDashboard.css";

const COLORS = ["#09090b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];

const tooltipStyle = {
  background: "#fff",
  border: "1px solid rgba(228,228,231,0.6)",
  borderRadius: 8,
  fontSize: 13,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
};

export default function AdminDashboard() {
  const [kpi, setKpi] = useState(null);
  const [categories, setCategories] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [todayPickups, setTodayPickups] = useState([]);
  const [todayReturns, setTodayReturns] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/dashboard/kpi")
      .then((res) => res.json())
      .then((data) => setKpi(data))
      .catch((err) => console.error("KPI 불러오기 실패:", err));
  }, []);
  useEffect(()=>{
    fetch("http://localhost:8000/api/dashboard/stats")
    .then((res) => res.json())
    .then((data) =>{
       setCategories(data.categories);
       setTopItems(data.top_items);
    })
    .catch((err) => console.error("데이터 불러오기 실패: ", err));
  }, []);
  useEffect(()=>{
    fetch("http://localhost:8000/api/dashboard/today-schedule")
    .then((res) => res.json())
    .then((data) =>{
       setTodayPickups(data.pickups);
       setTodayReturns(data.returns);
    })
    .catch((err) => console.error("오늘 일정 불러오기 실패: ", err));
  }, []);

  const cards = [
    { label: "물품 종류", key: "total_items" },
    { label: "현재 대여 중", key: "rented" },
    { label: "대기 중인 대여 요청", key: "pending" },
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
        <div className="card scroll p-5 lg:col-span-1">
          <h3 className="dashboard-section-title">오늘 대여 픽업 일정</h3>
          {todayPickups.length === 0 ? (
            <div className="dashboard-placeholder">오늘 픽업 예정 내역이 없습니다</div>
          ) : (
            <div className="today-list">
              {todayPickups.map((item) => (
                <div key={item.id} className="today-item">
                  <div className="today-name">{item.item_name} x{item.quantity}</div>
                  <div className="today-meta">{item.time} · {item.user_name} ({item.student_number})</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card scroll p-5 lg:col-span-1">
          <h3 className="dashboard-section-title">오늘 반납 일정</h3>
          {todayReturns.length === 0 ? (
            <div className="dashboard-placeholder">오늘 반납 예정 내역이 없습니다</div>
          ) : (
            <div className="today-list">
              {todayReturns.map((item) => (
                <div key={item.id} className="today-item">
                  <div className="today-name">{item.item_name} x{item.quantity}</div>
                  <div className="today-meta">{item.time} · {item.user_name} ({item.student_number})</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="dashboard-section-title">대여 히트맵 (2개월)</h3>
          <div className="dashboard-placeholder">
            
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="dashboard-section-title">카테고리별 물품 개수</h3>
            <ResponsiveContainer height={280}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius="55%"
                  outerRadius="85%"
                  stroke="none"
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

        <div className="card p-5">
          <h3 className="dashboard-section-title">인기 대여 물품 Top 5</h3>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(228,228,231,0.3)" }} />
                <Bar dataKey="count" fill="#09090b" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
