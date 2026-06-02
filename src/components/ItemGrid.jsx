import ItemCard from "./ItemCard";

export default function ItemGrid({ items, searchKeyword }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        if(item.name.includes(searchKeyword)){
          return(<ItemCard key={item.id} item={item} />);
        }
      })}
    </div>
  );
}
