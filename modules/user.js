
'use strict'

const bcrypt = require('bcrypt-promise')
const sqlite = require('sqlite-async')
const saltRounds = 10
const Mailer = require('./mailer')


module.exports = class User {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, 
							userHash TEXT, pass TEXT, emailaddress TEXT, active INTERGER);`
			await this.db.run(sql)
			return this
		})()
	}

	async register(user, pass) {
		try {
			if(user.length === 0) throw new Error('missing username')
			if(pass.length === 0) throw new Error('missing password')
			let sql = `SELECT COUNT(id) as records FROM users WHERE user="${user}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`username "${user}" already in use`)
			pass = await bcrypt.hash(pass, saltRounds)
			const userHash = Mailer.createHash(user)
			sql = `INSERT INTO users(user, userHash, pass) VALUES("${user}","${userHash}", "${pass}")`
			await this.db.run(sql)
			return true
		} catch(err) {
			throw err
		}
	}

	async registeremail(email, pass) {
		try {
			if(email.length === 0) throw new Error('missing emailaddress')
			if(pass.length === 0) throw new Error('missing password')
			let sql = `SELECT COUNT(id) as records FROM users WHERE emailaddress="${email}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`email "${email}" already in use`)
			pass = await bcrypt.hash(pass, saltRounds)
			const userHash = Mailer.createHash(email)
			sql = `INSERT INTO users(emailaddress, userHash, pass) VALUES("${email}","${userHash}", "${pass}")`
			await this.db.run(sql)
			return true
		} catch(err) {
			throw err
		}
	}

	// async uploadPicture(path, mimeType) {
	// 	const extension = mime.extension(mimeType)
	// 	console.log(`path: ${path}`)
	// 	console.log(`extension: ${extension}`)
	// 	//await fs.copy(path, `public/avatars/${username}.${fileExtension}`)
	// }

	async login(username, password) {
		try {
			let sql = `SELECT count(id) AS count FROM users WHERE user="${username}";`
			const records = await this.db.get(sql)
			//TODO: redirect to login page with message and not error
			if(!records.count) throw new Error(`username "${username}" not found`)
			sql = `SELECT user, userHash, pass FROM users WHERE user = "${username}";`
			const record = await this.db.get(sql)
			const valid = await bcrypt.compare(password, record.pass)
			const userName = record.userHash
			if(valid === false) throw new Error(`invalid password for account "${username}"`)
			return userName

		} catch(err) {
			throw err
		}
	}

	async registeremail(user, pass) {
		try {
			if(user.length === 0) throw new Error('missing emailaddress')
			if(pass.length === 0) throw new Error('missing password')
			let sql = `SELECT COUNT(id) as records FROM users WHERE emailaddress="${user}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`emailaddress "${user}" already in use`)
			pass = await bcrypt.hash(pass, saltRounds)
			sql = `INSERT INTO users(emailaddress, pass) VALUES("${user}", "${pass}")`
			await this.db.run(sql)
			return true
		} catch(err) {
			throw err
		}
	}

	// eslint-disable-next-line max-lines-per-function
	async UserFileDisplay(ctx, dbName, Database,username) {
		try {
			//console.log(dbName)
			let sql = `SELECT FileName, FileType, FilePath, Size, Date, ExpDate FROM Files
						WHERE user LIKE "%${username}%"`
			let querystring = ''

			 if (ctx.query !== undefined && ctx.query.q !== undefined) {
				sql = `SELECT  user, FileName, FileType, FilePath, Size, Date, ExpDate  FROM Files 
					 WHERE upper(FileName) LIKE "%${ctx.query.q}%"
						OR upper(FileType) LIKE upper("%${ctx.query.q}%")
                        OR upper(Size) LIKE upper("%${ctx.query.q}%")
						OR upper(Date) LIKE upper("%${ctx.query.q}%")
						OR upper(ExpDate) LIKE upper("%${ctx.query.q}%")
						AND user LIKE "%${username}%"`

				querystring = ctx.query.q

			 }
			const db = await Database.open(dbName)
			let data = await db.all(sql)
			await db.close()
			if (ctx.query !== undefined && ctx.query.q !== undefined) {
				data = data.filter( data => {
					if (data.user === username) return true
				})
			}
			//console.log(data)

			const msgData = {}
			if (ctx.query.msg) msgData.msg = ctx.query.msg

			await ctx.render('myfiles', { file: data, query: querystring, msg: msgData })

		} catch (err) {
			await ctx.render('error', { message: err.message })
		}


	}

	/* async getUserInfo(_userId) {
		const [logged, _userId] = getUserInfo()


	} */

	/* istanbul ignore next */
	async tearDown() {
		await this.db.close()
	}

	async countItems() {
		try {
			const sql = 'SELECT COUNT(*) AS count FROM users'

			let count = await this.db.all(sql)
			count = count[0]['count']
			return count

		} catch (err) {
			/* istanbul ignore next */
			throw err
		}
	}
}
