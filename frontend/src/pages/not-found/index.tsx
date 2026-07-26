import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import PublicLayout from "@/layouts/public-layout"

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground">
          Esse caminho não existe. Volte pro login e siga de lá.
        </p>
        <Button asChild>
          <Link to="/">Ir para o login</Link>
        </Button>
      </div>
    </PublicLayout>
  )
}
