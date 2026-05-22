import { useEffect, useState } from "react";
import HeroBanner from "../components/HeroBanner";
import CategorySidebar from "../components/CategorySidebar";
import ItemGrid from "../components/ItemGrid";

export default function MainPage() {
  const [categories, setCategories] = useState([{ id: "all", name: "전체" }]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories([{ id: "all", name: "전체" }, ...data]);
      })
      .catch((err) => console.error("카테고리 불러오기 실패:", err));

    fetch("http://localhost:8000/api/items")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("물품 불러오기 실패:", err));
  }, []);

  return (
    <main className="page">
      <HeroBanner />
      <div className="flex flex-col gap-6">
        <CategorySidebar categories={categories} />
        <section>
          <ItemGrid items={items} />
        </section>
      </div>
    </main>
  );
}
