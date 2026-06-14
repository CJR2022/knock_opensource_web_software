import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
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
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    fetch("/api/dashboard/kpi")
      .then((res) => res.json())
      .then((data) => setKpi(data))
      .catch((err) => console.error("KPI 불러오기 실패:", err));
  }, []);
  useEffect(()=>{
    fetch("/api/dashboard/stats")
    .then((res) => res.json())
    .then((data) =>{
       setCategories(data.categories);
       setTopItems(data.top_items);
    })
    .catch((err) => console.error("데이터 불러오기 실패: ", err));
  }, []);
  useEffect(()=>{
    fetch("/api/dashboard/today-schedule")
    .then((res) => res.json())
    .then((data) =>{
       setTodayPickups(data.pickups);
       setTodayReturns(data.returns);
    })
    .catch((err) => console.error("오늘 일정 불러오기 실패: ", err));
  }, []);
  useEffect(()=>{
    fetch("/api/dashboard/heatmap")
    .then((res) => res.json())
    .then((data) => setHeatmap(data))
    .catch((err) => console.error("히트맵 불러오기 실패: ", err));
  }, []);

  const cards = [
    { label: "대기 중인 대여 요청", key: "pending" },
    { label: "승인대기 가입자", key: "pending_users" },
    { label: "총 물품 개수", key: "total_items" },
    { label: "현재 대여 중", key: "rented" },
    { label: "연체 건수", key: "overdue" }
  ];

  //히트맵 시작일(현재달-3월의 1일), 종료일(현재)
  const today = new Date();
  const heatmapStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const heatmapEnd = today;

  return (
    <div className="page">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        {cards.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="dashboard-section-title">{c.label}</div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="dashboard-section-title">카테고리별 물품 개수</h3>
            <ResponsiveContainer height={250}>
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
        {/* flex 쓰면 히트맵 사라짐->CalendarHeatmap가 svg형식으로 그리는거라 그렇다함 -> flex-1로 강제 확장하니 보임*/}
        <div className="card p-5 flex">
          <div className="dashboard-heatmap flex-1">
            <CalendarHeatmap
              startDate={heatmapStart}
              endDate={heatmapEnd}
              values={heatmap}
              gutterSize={2}
              monthLabels={['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']}
              classForValue={(value) => {
                if (!value || value.count === 0) return "color-empty";
                if (value.count >= 5) return "color-scale-3";
                if (value.count >= 2) return "color-scale-2";
                return "color-scale-1";
              }}
    
            />
          </div>
        </div>
      </div>
    </div>
  );
}
