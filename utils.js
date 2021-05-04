const prompts = require("prompts");

const getPhone = async () => {
  return (
    await prompts({
      type: "text",
      name: "phone",
      message: "Enter your phone number:",
    })
  ).phone;
};

const getCode = async () => {
  return (
    await prompts({
      type: "text",
      name: "code",
      message: "Enter the code that has been sent to your Telegram:",
    })
  ).code;
};

const getPassword = async () => {
  return (
    await prompts({
      type: "text",
      name: "password",
      message: "Enter your Telegram password:",
    })
  ).password;
};

module.exports = { getPhone, getCode, getPassword };
