import { Route, Routes } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Header from "./components/Header";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInquiry from "./pages/admin/AdminInquiry";
import ItemManager from "./pages/admin/ItemManager";
import RentalManager from "./pages/admin/RentalManager";
import ScheduleManager from "./pages/admin/ScheduleManager";
import StudentManager from "./pages/admin/StudentManager";
import InquiryPage from "./pages/InquiryPage";
import MyPage from "./pages/MyPage";


export default function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/inquiry" element={<InquiryPage />}/>
        <Route path="/myPage" element={<MyPage />}/>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />}/>
          <Route path="AdminInquiry" element={<AdminInquiry />}/>
          <Route path="ItemManager" element={<ItemManager />}/>
          <Route path="RentalManager" element={<RentalManager />}/>
          <Route path="ScheduleManager" element={<ScheduleManager />}/>
          <Route path="StudentManager" element={<StudentManager />}/>
        </Route>
      </Routes>
    </div>
  );
}
