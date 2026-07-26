import { create } from "zustand"

type ExampleState = {
  count: number
  increment: () => void
}

export const useExampleStore = create<ExampleState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))
