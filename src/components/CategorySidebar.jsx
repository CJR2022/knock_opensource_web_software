export default function CategorySidebar({ categories, selectedIds, changeCategory }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
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
