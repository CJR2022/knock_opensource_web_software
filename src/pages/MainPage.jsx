import { useEffect, useState } from "react";
import HeroBanner from "../components/HeroBanner";
import CategorySidebar from "../components/CategorySidebar";
import ItemGrid from "../components/ItemGrid";
import searchIcon from "../assets/icons/search.svg";

export default function MainPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("카테고리 불러오기 실패:", err));

    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("물품 불러오기 실패:", err))
      .finally(()=>setIsLoading(false));
  }, []);

  function changeCategory(id) {
    if (id === "all") {
      setSelectedIds([]);
      return;
    }

    if (selectedIds.includes(id)) {
      let newIds = [];
      for (let i = 0; i < selectedIds.length; i++) {
        if (selectedIds[i] !== id) newIds.push(selectedIds[i]);
      }
      setSelectedIds(newIds);
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  let showItems = [];
  if (selectedIds.length === 0) {
    showItems = items;
  } else {
    for (let i = 0; i < items.length; i++) {
      if (selectedIds.includes(items[i].category_id)) {
        showItems.push(items[i]);
      }
    }
  }
  if(isLoading){
    return (
      <main className="page">
        <HeroBanner/>
        <div style={{ marginTop: "32px" }}>
          <div style={{ textAlign: "center", marginTop: 120 }}>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p style={{ color: "#71717a", fontSize: 14 }}>물품을 불러오는 중...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <HeroBanner />
      <div className="flex flex-col">
        <label className="main-searchBar p-3">
          <img src={searchIcon} alt="검색" className="w-4 h-4 mr-2 mb-1" />
          <input
            type="text"
            className="main-search"
            placeholder="어떤 물품이 필요하세요? (ex. 우산, 보조배터리)"
            onChange={(e)=>setInput(e.target.value)}
          />
        </label>
        <CategorySidebar
          categories={categories}
          selectedIds={selectedIds}
          changeCategory={changeCategory}
        />
        <section>
          <ItemGrid items={showItems} searchKeyword={input} />
        </section>
      </div>
    </main>
  );
}
