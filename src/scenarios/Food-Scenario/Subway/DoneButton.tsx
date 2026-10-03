import React from "react";
import "./DoneButton.css";

type DoneButtonProps = {
  onDone: () => void;
  disabled?: boolean;
};

const DoneButton: React.FC<DoneButtonProps> = ({ onDone, disabled }) => {
  return (
    <button
      className="done-button"
      onClick={onDone}
      disabled={disabled}
    >
      Done
    </button>
  );
};

export default DoneButton;
