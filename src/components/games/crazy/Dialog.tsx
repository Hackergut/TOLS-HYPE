import { useEffect, useRef, type ReactNode } from "react";
import Icon from "./Icon";

export default function Dialog({ title, subtitle, children, onClose, wide = false, locked = false }: {
  title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean; locked?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const focused = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = originalOverflow;
      focused?.focus();
    };
  }, []);
  return (
    <dialog ref={ref} className={`platform-dialog ${wide ? "dialog-wide" : ""}`} onCancel={(event) => {
      event.preventDefault();
      if (!locked) closeRef.current();
    }} onClick={(event) => {
      if (event.target === event.currentTarget && !locked) {
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current();
      }
    }}>
      <div className="dialog-heading">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button type="button" className="icon-button" onClick={onClose} disabled={locked} aria-label="Close dialog"><Icon name="close" /></button>
      </div>
      <div className="dialog-content">{children}</div>
    </dialog>
  );
}