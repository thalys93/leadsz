import type { ComponentType } from "react"

export type RouteItem = {
  path: string
  element: ComponentType
}

export type Middleware = ComponentType<{ children: React.ReactNode }>

export type RoutesGroup = {
  public?: RouteItem[]
  private?: RouteItem[]
  prefix?: string
  privateMiddleware?: Middleware
}
