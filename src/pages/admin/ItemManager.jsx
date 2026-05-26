import { useEffect, useState } from "react";
import "../../ItemManager.css";

export default function ItemManager() {
    const [mulphonlist, setmulphonlist] = useState([]);
    const [mulphoncall, setmulphoncall] = useState(true);

    function getmulphon() {
        setmulphoncall(true);

        fetch("http://localhost:8000/api/items")
            .then((res) => res.json())
            .then((data) => {
                setmulphonlist(data);
                setmulphoncall(false);
            })
            .catch(() => {
                setmulphoncall(false);
            });
    }

    useEffect(() => {
        getmulphon();
    }, []);

    if (mulphoncall) {
        return (
            <main className="page">
                <p className="mulphon-wating">물품을 불러오는 중...</p>
            </main>
        );
    }

    if (mulphonlist.length === 0) {
        return (
            <main className="page">
                <h2 className="mulphon-title">물품 관리</h2>

                <div className="card p-3">
                    <p className="mulphon-wating">등록된 물품이 없습니다.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="page">
            <div className="flex justify-between items-center mb-3">
                <h2 className="mulphon-title">물품 관리</h2>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mulphonlist.map((mulphon) => (
                    <div className="card p-3" key={mulphon.id}>
                        <div className="mulphonimg-area">
                            <img
                                src={mulphon.image}
                                alt={mulphon.name}
                                className="mulphon-image"
                            />
                        </div>

                        <h3 className="mulphon-name">{mulphon.name}</h3>

                        <div className="flex flex-wrap items-center gap-1">
                            <span className="badge badge-green">
                                사용가능 : {mulphon.available}
                            </span>

                            <span className="badge badge-red">
                                사용중 : {mulphon.inUse}
                            </span>

                            <span className="badge badge-gray">
                                준비중 : {mulphon.preparing}
                            </span>
                        </div>
                    </div>
                ))}
            </section>
        </main>
    );
}