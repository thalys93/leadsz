import type { ReactElement } from "react"
import { Route, Routes } from "react-router-dom"
import { AllRoutes, NotFoundPage } from "./map"

function applyPrefix(prefix: string | undefined, path: string) {
  return `${prefix ? `/${prefix.replace(/^\/+|\/+$/g, "")}` : ""}/${path}`.replace(
    /\/+/g,
    "/"
  ).replace(/\/$/, "") || "/"
}

function renderAllRoutes() {
  const elements: ReactElement[] = []

  for (const group of AllRoutes) {
    const { public: pub = [], private: priv = [], prefix } = group

    for (const route of pub) {
      const fullPath = applyPrefix(prefix, route.path)
      const Element = route.element
      elements.push(
        <Route key={fullPath} path={fullPath} element={<Element />} />
      )
    }

    for (const route of priv) {
      const fullPath = applyPrefix(prefix, route.path)
      const Element = route.element
      const Wrapper = group.privateMiddleware
      const WrappedElement = Wrapper ? (
        <Wrapper>
          <Element />
        </Wrapper>
      ) : (
        <Element />
      )
      elements.push(
        <Route key={fullPath} path={fullPath} element={WrappedElement} />
      )
    }
  }

  return elements
}

export default function AppRoutes() {
  return (
    <Routes>
      {renderAllRoutes()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
