'use client';

export default function ConfirmButton({ message, children }: { message: string; children: React.ReactNode }) {
  return <button className="adm-link danger" onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}
