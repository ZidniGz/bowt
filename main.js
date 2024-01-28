const monk = require('monk');
const { Boom } = require("@hapi/boom")
const {  makeWASocket, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
//const useMongoDBAuthState = require('./index')
const logger = require('pino')()
//const { BufferJSON, initAuthCreds } = require('../Utils');
//const { } = require('@whiskeysockets/Baileys')
//const { useMySQLAuthState } = require('mysql-baileys')

module.exports = class Dd {
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
