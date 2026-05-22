export default function CategorySidebar({ items, selectedIds, changeItem }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => changeItem("all")}
          className={selectedIds.length===0?"category-btn active":"category-btn"}
        >
          전체
        </button>

        {items.map((item) => {
          let isActive = selectedIds.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => changeItem(item.id)}
              className={isActive?"category-btn active":"category-btn"}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
