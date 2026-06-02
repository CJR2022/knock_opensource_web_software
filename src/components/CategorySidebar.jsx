export default function CategorySidebar({ categories, selectedIds, changeCategory }) {
  return (
    <div className="scroll-x">
      <div className="flex gap-2" style={{ width: "max-content", margin: "0 auto" }}>
        <button
          onClick={() => changeCategory("all")}
          className={selectedIds.length===0?"category-btn active":"category-btn"}
        >
          전체
        </button>

        {categories.map((cat) => {
          let isActive = selectedIds.includes(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => changeCategory(cat.id)}
              className={isActive?"category-btn active":"category-btn"}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
