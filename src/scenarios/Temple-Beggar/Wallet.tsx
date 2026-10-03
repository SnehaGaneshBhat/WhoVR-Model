import React from "react";
import walletImg from "../../assets/Temple-Beggar/wallet.png";
import "./Wallet.css";

interface WalletProps {
  count: number;              // 100 rupee notes
  count500?: number;          // 500 rupee notes
  onClick: () => void;
  style?: React.CSSProperties;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, target: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export default function Wallet({
  count,
  count500 = 0,
  onClick,
  style,
  onDrop,
  onDragOver,
}: WalletProps) {
  return (
    <div
      className="wallet-container"
      onClick={onClick}
      style={style}
      onDrop={(e) => onDrop && onDrop(e, "wallet")}
      onDragOver={onDragOver}
    >
      {/* Wallet image */}
      <img src={walletImg} alt="Wallet" className="wallet" />

      {/* Show 100 count (not draggable, since you already have a loose note) */}
      <div className="wallet-count">(100 × {count})</div>

      {/* Show 500 count, draggable so beggar drop can distinguish */}
      {count500 > 0 && (
        <div
          className="wallet-count"
          draggable
          onDragStart={(e) => e.dataTransfer.setData("item", "wallet-500")}
        >
          (500 × {count500})
        </div>
      )}
    </div>
  );
}