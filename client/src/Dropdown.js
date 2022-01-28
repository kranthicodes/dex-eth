import React from "react";

export default function Dropdown({ onSelect, activeItem, items }) {
  const [visible, setVisible] = React.useState(false);
  const selectItem = (evt, item) => {
    evt.preventDefault();
    setVisible(!visible);
    onSelect(item);
  };
  return (
    <div className="dropdown ml-3">
      <button
        className="btn btn-secondary dropdown-toggle"
        type="button"
        onClick={() => setVisible(!visible)}
      >
        {activeItem?.label}
      </button>
      <div className={`dropdown-menu ${visible ? "visible" : ""}`}>
        {items &&
          items.map((item, idx) => (
            <a
              key={idx}
              className={`dropdown-item ${
                activeItem.value === item.value ? "active" : ""
              }`}
              href="#"
              onClick={(e) => selectItem(e, item.value)}
            >
              {item.label}
            </a>
          ))}
      </div>
    </div>
  );
}
