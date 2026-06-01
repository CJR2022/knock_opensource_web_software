import ItemCard from "./ItemCard";

export default function ItemGrid({ items, searchKeyword }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        if(item.name.includes(searchKeyword)){
          return(<ItemCard key={item.id} item={item} />);
        }
      })}
    </div>
  );
}
