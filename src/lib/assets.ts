/** Next Link handles route prefixes; public asset requests need the build-time prefix. */
export function assetPath(path: `/${string}`): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
