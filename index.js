const monk = require('monk');
const { Boom } = require("@hapi/boom")
const app = require('express')();
const {  makeWASocket, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const main = require('./main')


async function lll() {
 app.get('/', (req, res)=> res.send('Okee'))
let oo = await p('owqask')
console.log(oo)
new main(oo).connect()
}

lll().catch(console.error)
app.listen(3000)
// Connect to the database using m
 async function p(sesi) {
const db = monk("mongodb+srv://caliph71:clph1122@cluster0.e1ccz.mongodb.net/myFirstDatabase");
  const session = 'sessions'

  const readData = async (id) => {
    const collection = db.get(sesi);
    const data = await collection.findOne({ id, session });
    if (!data?.value) {
      return null;
    }
    //const creds = JSON.stringify(data.value);
    const credsParsed = JSON.parse(data.value, BufferJSON.reviver);
    return credsParsed;
  };

  const writeData = async (id, value) => {
    const collection = db.get(sesi);
    const valueFixed =  JSON.stringify(value, BufferJSON.replacer);
    await collection.update({ id, session }, { $set: { value: valueFixed } }, { upsert: true });
  };

  const removeData = async (id) => {
    const collection = db.get(sesi);
    await collection.remove({ id, session });
  };

  const removeAll = async () => {
    const collection = db.get(sesi);
    await collection.remove({ session });
  };

  const creds = await readData('creds') || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
       get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
        set: async (data) => {
        const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const name = `${category}-${id}`;
              tasks.push(value ? await writeData(value, name) : await removeData(name));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      await writeData('creds', creds);
    },
    removeCreds: async () => {
      await removeAll();
    }
  };
};

///pp.listen(3000)
