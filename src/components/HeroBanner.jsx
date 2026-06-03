import arrowRight from "../assets/icons/arrow-right.svg";

export default function HeroBanner() {
  return (
    <div className="hero px-6 py-5 mb-8">
      <div className="hero-center">
        <h1 className="hero-title hero-title-big">학교 생활, 필요한 걸 바로</h1>
        <p className="hero-desc">물품 대여는 KNOCK에서</p>

        <div className="hero-guide">
          <div className="hero-step">
            <span className="hero-step-num">1</span>
            <p>물품 찾기</p>
          </div>
          <img src={arrowRight} alt="" className="hero-arrow" />
          <div className="hero-step">
            <span className="hero-step-num">2</span>
            <p>날짜 선택</p>
          </div>
          <img src={arrowRight} alt="" className="hero-arrow" />
          <div className="hero-step">
            <span className="hero-step-num">3</span>
            <p>대여 신청</p>
          </div>
        </div>
      </div>
    </div>
  );
}
