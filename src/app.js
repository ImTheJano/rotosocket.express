require('dotenv').config()
const express = require('express')
const app = express()
const SocketIO = require('socket.io')
const axios = require('axios')
var cors = require('cors')


//settings
app.set('port', process.env.PORT || 3000)
const server = app.listen(app.get('port'), ()=>{
	console.log('🚀 socket on port ' + app.get('port'))
})
const io = SocketIO(server)


//websockets
io.on('connection', ( socket )=> {
	io.to(socket.conn.id).emit('auth')
	socket.on('auth', async (args)=> {
		var {app, token} = args
		var headers = {auth: token}
		var user = null
		token.auth = {...args}
		switch (app) {
			case 'level_client': {
				try {
					var {data} = await axios.get(process.env.NIVEL_API + 'user/me', {headers})
					user = data.user
					if(user) user = await axios.put(process.env.NIVEL_API + 'user/me/add/rotosockettoken/'+socket.conn.id, {}, {headers})
				} catch (error) {console.error('error')}
				socket.on('disconnect', async ()=> {
					await axios.put(process.env.NIVEL_API + 'user/rotosockettoken/remove/'+socket.conn.id, {}, { headers: {auth: process.env.NIVEL_API_KEY} })
				})
			} break;
			case 'level_api': {
				try {
					var {data} = await axios.get(process.env.NIVEL_API + 'user/me', {headers})
					user = data.user
					if(user.email == 'rotosocket@nivel.com'){
						socket.on('level:new_sfdata', (args)=> {
							io.to(args.to).emit('level:new_sfdata', args.message)
						})
					}
				} catch (error) {console.error(error)}
			} break;
			default: console.log(); break;
		}
	})

	socket.on("sfd",(datos)=>{
        socket.broadcast.emit("sfd"+datos.device,datos);        
    })
    socket.on("sytesa_error",(datos)=>{
        socket.broadcast.emit("sytesa_error",datos);
    })

})