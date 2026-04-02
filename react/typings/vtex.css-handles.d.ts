declare module 'vtex.css-handles' {
  type CssHandlesMap<T extends readonly string[]> = { [K in T[number]]: string }

  export type CssHandlesBag<T extends readonly string[]> = {
    handles: CssHandlesMap<T>
    withModifiers: (
      handleName: T[number],
      modifier: string | string[]
    ) => string
  }

  export type CssHandlesOptions = {
    classes?: unknown
    migrationFrom?: string | string[]
  }

  export function useCssHandles<T extends readonly string[]>(
    staticHandles: T,
    options?: CssHandlesOptions
  ): CssHandlesBag<T>

  export function useCustomClasses(
    fn: () => Record<string, unknown>,
    deps?: unknown[]
  ): unknown

  export function createCssHandlesContext<T extends readonly string[]>(
    handles: T
  ): {
    CssHandlesProvider: React.ComponentType<{
      handles: CssHandlesMap<T>
      withModifiers: CssHandlesBag<T>['withModifiers']
      children?: React.ReactNode
    }>
    useContextCssHandles: () => CssHandlesBag<T>
  }
}
