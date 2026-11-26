/**
 * Type declarations for modules without types
 */

// For jsonwebtoken if @types/jsonwebtoken is not available
declare module "jsonwebtoken" {
  export interface JwtPayload {
    [key: string]: any;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: object
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: object
  ): string | object;

  export function decode(
    token: string,
    options?: object
  ): null | { [key: string]: any } | string;
}

// Add other module declarations as needed
