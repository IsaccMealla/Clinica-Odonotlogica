import { redirect } from "next/navigation"

export default function Home() {
  // Cuando alguien entre a la raíz (localhost:3000/), lo mandamos al login de inmediato
  redirect("/login")
}