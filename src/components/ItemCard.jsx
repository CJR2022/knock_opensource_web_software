import {useState} from "react";
import RentalModal from "./RentalModal";

export default function ItemCard({ item, rentservice}) {
  const isAvailable = item.available > 0;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleclick = async () =>{
    let saveduser= sessionStorage.getItem("user");
    if(!saveduser){
      saveduser=localStorage.getItem("user");
    }
    if (!saveduser){
      alert("로그인을 해주세요 ");
      return;
    }
    const userInfo = JSON.parse(saveduser);
    try {
      const res = await fetch(`http://localhost:8000/api/rentals?user_id=${userInfo.id}`);
      if (res.ok) {
        const myRentals = await res.json();
        const duplicate = myRentals.find(rental =>{
            const activeStatuses = ["pending", "approved", "rented", "overdue"];
        return rental.item_id == item.id && activeStatuses.includes(rental.status);
        });

        if (duplicate) {
          alert(` 물품을 대여 승인 중이거나 대여중인 상태입니다`);
          return;
        }
        if (!res.ok) {
          alert("대여 목록 조회 실패");
          return;
        }
      }
  } catch (error) {
    console.error("중복 대여 여부 조회 실패:", error);
  }






    setIsModalOpen(true);
  }

  return (
      <>
        <div className="card flex items-center gap-3 p-3">
      <div className="relative w-20 h-20 shrink-0 overflow-hidden bg-gray-100 rounded-xl">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-950">{item.name}</h3>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="badge badge-green">
            <span className="inline-block rounded-full h-1.5 w-1.5 bg-emerald-500" />
            가능 {item.available}
          </span>
          <span className="badge badge-red">
            <span className="inline-block rounded-full h-1.5 w-1.5 bg-rose-500" />
            대여중 {item.inUse}
          </span>
          <span className="badge badge-gray">
            <span className="inline-block rounded-full h-1.5 w-1.5 bg-gray-300" />
            준비중 {item.preparing}
          </span>
        </div>
      </div>

      <button
          onClick={handleclick}
        disabled={!isAvailable}
        className={`btn shrink-0 ${isAvailable ? "btn-primary" : "btn-disabled"}`}
      >
        {isAvailable ? "대여" : "불가"}
      </button>
    </div>
    {isModalOpen && (
      <RentalModal
      item={item}
      onClose={()=>setIsModalOpen(false)}
        onSuccess={rentservice}
        />
    )}
  </>
  );
}
