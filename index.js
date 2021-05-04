const MTProto = require("@mtproto/core");
const path = require("path");
const { getPhone, getCode, getPassword } = require("./utils");

const api_id = ""; // insert api_id here
const api_hash = ""; // insert api_hash here

const mtproto = new MTProto({
  api_id: api_id,
  api_hash: api_hash,
  storageOptions: {
    path: path.resolve(__dirname, "./telegramData.json"),
  },
});

function startListener() {
  console.log("[+] Starting message listener");
  mtproto.updates.on("updates", ({ updates }) => {
    const newChannelMessages = updates
      .filter((update) => update._ === "updateNewChannelMessage")
      .map(({ message }) => message);
    for (const message of newChannelMessages) {
      console.log(`[${message.peer_id.channel_id}] ${message.message}`);
    }
  });
}

mtproto
  .call("users.getFullUser", {
    id: {
      _: "inputUserSelf",
    },
  })
  .then(startListener)
  .catch(async () => {
    console.log("[+] Login Required");
    const phone_number = await getPhone();
    mtproto
      .call("auth.sendCode", {
        phone_number,
        settings: {
          _: "codeSettings",
        },
      })
      .catch((error) => {
        if (error.error_message.includes("_MIGRATE_")) {
          const [type, nextDcId] = error.error_message.split("_MIGRATE_");
          mtproto.setDefaultDc(+nextDcId);
          return sendCode(phone_number);
        }
      })
      .then(async (result) => {
        return mtproto.call("auth.signIn", {
          phone_code: await getCode(),
          phone_number,
          phone_code_hash: result.phone_code_hash,
        });
      })
      .catch((error) => {
        if (error.error_message === "SESSION_PASSWORD_NEEDED") {
          return mtproto.call("account.getPassword").then(async (result) => {
            const { srp_id, current_algo, srp_B } = result;
            const { salt1, salt2, g, p } = current_algo;
            const { A, M1 } = await mtproto.crypto.getSRPParams({
              g,
              p,
              salt1,
              salt2,
              gB: srp_B,
              password: await getPassword(),
            });
            return mtproto.call("auth.checkPassword", {
              password: {
                _: "inputCheckPasswordSRP",
                srp_id,
                A,
                M1,
              },
            });
          });
        }
      })
      .then(() => {
        console.log("[+] successfully authenticated");
        startListener();
      });
  });
