declare module 'base-64' {
  /**
   * Base64 encode a UTF-8 string.
   */
  export function encode(input: string): string;
  /**
   * Base64 decode to a UTF-8 string.
   */
  export function decode(input: string): string;
}
