import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 pt-16 text-center">
      <h1 className="t-title2">Este enlace no funciona</h1>
      <p className="text-label2">
        Puede que esté incompleto o que te hayan quitado del grupo. Pide el enlace a quien organiza.
      </p>
      <Link href="/" className="btn btn-plain">
        Ir al inicio
      </Link>
    </div>
  );
}
