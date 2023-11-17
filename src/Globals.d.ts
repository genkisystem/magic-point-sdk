// For SCSS modules
declare module "*.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

// For regular CSS
declare module "*.css";
