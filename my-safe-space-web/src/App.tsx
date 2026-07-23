import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Venting from './pages/Venting';
import PostDetail from './pages/PostDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ครอบด้วย Layout เพื่อให้ทุกหน้าใช้ Navbar ร่วมกัน */}
        <Route path="/" element={<Layout />}>
          {/* index หมายถึง เมื่อเข้าที่ path "/" ให้ดึง Home มาใส่ใน <Outlet /> */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="venting" element={<Venting />} /> {/* 👈 เพิ่มเส้นทางสำหรับห้องระบาย */}
          <Route path="/post/:id" element={<PostDetail />} /> 
        </Route>
      </Routes>
    </BrowserRouter>
  );
}