import React from "react";
import noteImg from "../../assets/Temple-Beggar/note_500.png";
import { infoBoxStyle } from "./styles";

export default function Note({ noteVisible, onDragStart }: any) {
  return (
    <div style={{ textAlign: "center", transform: "translate(-50px, 230px)" }}>
      {noteVisible && (
        <>
          <img
            src={noteImg}
            alt="Note"
            style={{ width: "70px", cursor: "grab" }}
            draggable
            onDragStart={(e) => onDragStart(e, "note")}
          />
          <div style={infoBoxStyle}>Drag me!</div>
        </>
      )}
    </div>
  );
}