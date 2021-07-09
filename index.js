(async () => {
    const { SteamGameServer, GameClient } = require('node-steamworks')
    const ZPackage = require('./zpackage');

    let server = new SteamGameServer(3756)

    server.on('started', () => {
        console.log(`listening on port ${server.port}`)
    })

    server.on('connected', (client) => {
        console.log(`client conneced ${client.connectionDescription}`)

        client.on('message', event => {
            console.log(event.data);

            let reader = new ZPackage(/*Buffer.from(*/event.data/*)*/);
            let rpcHash = reader.readInt32();

            console.log("rpc hash = " + rpcHash);

            if (rpcHash === 0) {
                console.log("ping");
            }
            else if (rpcHash === -725574882) {
                let buffer = reader.readBuffer();
                console.log(buffer);

                let peerInfoPkg = new ZPackage(buffer);
                let uid = peerInfoPkg.readInt64();
                let version = peerInfoPkg.readString();
                let referencePosition = peerInfoPkg.readVector3();
                let name = peerInfoPkg.readString();
                let passwordHash = peerInfoPkg.readString();
                let sessionTicket = peerInfoPkg.readBuffer();

                console.log("here");
            }
            else {
                if (event.data.length === 4) {
                    let sendpkg = new ZPackage();
                    sendpkg.writeUInt32(0x3CE5CEE6);
                    sendpkg.writeBoolean(true);
                    client.sendMessage(sendpkg.getBuffer());
                }
            }
        })

        client.on('disconnected', () => {
            console.log("disconnected called from client");
        })
    })

    server.on('message', event => {
        console.log(`client ${event.client.connectionDescription} got message ${event.data.length} bytes long`)
    })

    server.on('disconnected', event => {
        console.log(`client ${event.client.connectionDescription} disconnected, rip`)
    })

    server.startServer()
    server.registerServer("$$ cash money $$", true, '4.2.0')

    while (server.running) {
        server.runCallbacks()

        await (new Promise(resolve => {
            setTimeout(resolve, 10)
        }))
    }
})()