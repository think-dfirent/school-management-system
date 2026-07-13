import React from "react"; /* * * Reusable Modal Component with proper CSS Stacking Contexts. * The backdrop is layered at z-50, and the modal content box is relative z-50, * which ensures they stack cleanly under the global Toast alerts at z-[9999]. */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
      {" "}
      {/* Clickable background overlay to close */}
      <div
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      ></div>{" "}
      {/* Modal Content Box */}
      <div className="w-full max-w-lg bg-background border border-border rounded-2xl p-6 shadow-2xl space-y-4 relative z-50 overflow-hidden text-DEFAULT animate-in fade-in zoom-in-95 duration-200">
        {" "}
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-DEFAULT uppercase tracking-wider">
            {" "}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-DEFAULT font-bold text-base transition cursor-pointer"
          >
            {" "}
            ✕
          </button>
        </div>{" "}
        {/* Body */}
        <div className="text-xs text-slate-300 leading-relaxed">
          {" "}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
