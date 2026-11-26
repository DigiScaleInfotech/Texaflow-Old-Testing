/**
 * Type declarations for modules without types or fallback declarations
 */

declare module "cors";
declare module "cookie-parser";
declare module "express-fileupload";
declare module "node-cron";
declare module "nodemailer";
declare module "bcrypt";

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
