import { HTMLAttributes } from "react";

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string;
    webkitdirectory?: string;
  }
}

declare module "*.jpg";
declare module "*.gif";
declare module "*.png";
