const password =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
const email = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;
const phone = /^\+[1-9]\d{0,3}[\s-]?(?:\(?\d{1,4}\)?[\s-]?)?\d{4,14}(?:[\s-]?\d{1,4})?$/;

export const RegExHelper: any = {
  password,
  email,
  phone,
};
