import type { CSSProperties } from "react";

export const infoBoxStyle: CSSProperties = {
  background: "rgba(0,0,0,0.6)",
  color: "white",
  padding: "8px 12px",
  borderRadius: "6px",
  marginTop: "10px",
  fontSize: "14px",
  textAlign: "center",
};

export const scoreBoxStyle: CSSProperties = {
  background: "rgba(255,255,255,0.9)",
  padding: "20px",
  borderRadius: "10px",
  textAlign: "center",
  marginTop: "20px",
};

export const historyBoxStyle: CSSProperties = {
  background: "rgba(0,0,0,0.6)",
  color: "white",
  padding: "20px",
  borderRadius: "10px",
  marginTop: "20px",
  width: "300px",
  textAlign: "left",
  marginLeft: "auto",
  marginRight: "480px",
};

export const bottomBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  position: "absolute",
  left: 0,
  padding: "0 40px",
};

export const buttonStyle: CSSProperties = {
  padding: "10px 20px",
  borderRadius: "60px",
  border: "none",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
};

/* Main screen positioning */
export const newSimulationButtonStyleMain: CSSProperties = {
  ...buttonStyle,
  background: "#f44336",
  position: "relative",
  bottom: "60px",
};

export const doneButtonStyleMain: CSSProperties = {
  ...buttonStyle,
  background: "#4CAF50",
  marginRight: "60px",
  position: "relative",
  bottom: "60px",
};

/* Zoomed scene positioning */
export const newSimulationButtonStyleZoom: CSSProperties = {
  ...buttonStyle,
  background: "#f44336",
  position: "absolute",
  bottom: "40px",
  left: "80px",
};

export const doneButtonStyleZoom: CSSProperties = {
  ...buttonStyle,
  background: "#4CAF50",
  position: "absolute",
  bottom: "40px",
  right: "100px",
};

export const appContainerStyle: CSSProperties = {
  backgroundSize: "cover",
  backgroundPosition: "center",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "40px",
  position: "relative",
  overflow: "hidden",
};

export const charactersRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "300px 200px",
  justifyContent: "center",
  alignItems: "end",
  gap: "80px",
  marginTop: "60px",
};

export const walletPositionStyle: CSSProperties = {
  position: "absolute",
  left: "600px",
  bottom: "310px",
};

export const noteFallStyle: CSSProperties = {
  position: "absolute",
  left: "600px",
  bottom: "310px",
  width: "120px",
  animation: "fall 1.5s ease forwards",
};

export const note500FallStyle: CSSProperties = {
  ...noteFallStyle,
  width: "140px",
};