"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";

interface FabItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface MobileFabProps {
  items: FabItem[];
}

export default function MobileFab({ items }: MobileFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) return null;

  // If only one item, show a simple FAB without menu
  if (items.length === 1) {
    return (
      <button className="fab" onClick={items[0].onClick}>
        {items[0].icon}
      </button>
    );
  }

  return (
    <>
      {isOpen && (
        <div 
          className="modal-backdrop" 
          style={{ background: "transparent", backdropFilter: "none" }} 
          onClick={() => setIsOpen(false)} 
        />
      )}
      
      {isOpen && (
        <div className="fab-menu">
          {items.map((item, idx) => (
            <button 
              key={idx} 
              className="fab-item" 
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </>
  );
}
