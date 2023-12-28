const {default:conn, delay, useMultiFileAuthState, DisconnectReason}= require("baileys")
const { Boom} = require("@hapi/boom")
const app = require("express")()

app.get("/", (req, res) => res.send("GET"))
async function connectToWhatsApp() {
	const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
	const waConfig = {
		auth: state,
		printQRInTerminal: true
	};
	const sock = conn(waConfig);
	
	sock.ev.process(
		async(events) => {
			if(events['connection.update']) {
				const update = events['connection.update']
				const { connection, lastDisconnect } = update

				if(connection === 'close') {
					// reconnect if not logged out
					const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
					console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
					// reconnect if not logged out
					if (shouldReconnect) {
						await delay(1000)
						connectToWhatsApp();
					}
				} else if (connection === "open") {
                                    await delay(500)
					sock.sendMesaage('6281215205433s@s.whatsapp.net', { text: "connected"})
				}
				//console.log('connection update', update)
			}

			// credentials updated -- save them
			if(events['creds.update']) {
				await saveCreds(state)
			}

			// messages received
			if(events['messages.upsert']) {
				const upsert = events['messages.upsert']
				console.log('recv messages ', JSON.stringify(upsert, undefined, 2))

				// message received not group
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
			}
		}
	)
	
	return sock;

}
app.get("/start", (req, res) => {
let y = await connectToWhatsApp()
	res.send(y)
})

app.listen(3000)
