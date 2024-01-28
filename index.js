const monk = require('monk');
const { Boom } = require("@hapi/boom")
const app = require('express')();
const {  makeWASocket, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const monk = require('monk');
const logger = require('pino')()
//const { BufferJSON, initAuthCreds } = require('../Utils');
//const { } = require('@whiskeysockets/Baileys')
//const { useMySQLAuthState } = require('mysql-baileys')
const main = class Dd {
 constructor(authSession) {
        this.authSession = authSession     
    }

    connect = async () => {
	const { error, version } = await fetchLatestBaileysVersion()

	if (error){
		console.log('Sessions | No connection, check your internet.')
		return this.connect()
	}

	const { state, saveCreds, removeCreds } = this.authSession
	const sock = makeWASocket({
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		version: version,
		printQRInTerminal: true,
		defaultQueryTimeoutMs: undefined
	})

	sock.ev.on('creds.update', saveCreds)

	sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
      const { statusCode } = new Boom(lastDisconnect?.error).output
           if (connection === 'close') {
                if (statusCode !== DisconnectReason.loggedOut) setTimeout(() => this.connect(), 3000)
                else {
                    console.log('Disconnected! Something went wrong during connection!')
                    await removeCreds()
                    setTimeout(() => this.connect(), 3000)
                }
            }else if(connection === 'open') {
            console.log('opened connection')
        }
    })

	sock.ev.on('messages.upsert', async (upsert) => {
    if(upsert.messages[0].key.participant === undefined) {
					// message declaration as text
	 				const pesan = await upsert.messages[0].message
					// read messages
                    if (!pesan) return
					await sock.readMessages(upsert.messages.map(m => m.key))
					// convert to lowercase
					const pesanMasuk = pesan.conversation.toLowerCase();
					// if message contains 'ping'
					if(pesanMasuk.includes('ping')) {
						// send a reply
						await sock.sendMessage(upsert.messages[0].key.remoteJid, { text: 'Pong' }, { quoted: upsert.messages[0] })
					}
				}
	})
}
}


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
