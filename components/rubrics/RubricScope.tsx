"use client"

import { createContext, useContext } from "react"

/**
 * The programme a rubric picker is working inside. Provided by the programme
 * editors so a picker deep in the curriculum (an assignment block) can offer
 * that programme's own customised rubrics and create new ones, without the
 * programme id being threaded through every lesson component.
 *
 * Null = no saved programme yet (a brand-new programme): only the shared
 * library is offered, and customising waits until the programme exists.
 */
export type RubricScope = { courseId: string; courseTitle?: string } | null

const Ctx = createContext<RubricScope>(null)

export function RubricScopeProvider({ value, children }: { value: RubricScope; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRubricScope(): RubricScope {
  return useContext(Ctx)
}
