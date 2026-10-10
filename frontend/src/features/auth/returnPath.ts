export function safeReturnPath(path: unknown) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    && !path.includes("\\") && !/^\/(login|register)([/?#]|$)/.test(path) ? path : "/";
}
