/* eslint-disable max-lines-per-function */

'use strict'
const fs = require('fs-extra')
const sqlite = require('sqlite-async')
const Mailer = require('./mailer')

function addDays(date, days) {
	const copy = new Date(Number(date))
	copy.setDate(date.getDate() + days)
	return copy
}

module.exports = class File {

	constructor(dbName = ':memory:') {
		return (async() => {
			try{
				this.db = await sqlite.open(dbName)
			}catch(err) {
				/* istanbul ignore next */
				throw Error('Unable to connect to sqlite db')
			}

			const sql = `CREATE TABLE IF NOT EXISTS Files (
							id INTEGER PRIMARY KEY AUTOINCREMENT, FileName TEXT, FileType BLOB, 
							FilePath TEXT, Size INT, Date DATE NOT NULL DEFAULT (date('now')), 
							FileHash TEXT, ExpDate TEXT, Downloaded TEXT DEFAULT false,
							user TEXT,
							FOREIGN KEY (user)
								REFERENCES users (user));`
			try{
				await this.db.run(sql)
				// CURRENT_TIMESTAMP
			}catch(err) {
				/* istanbul ignore next */
				throw Error(err)
			}
			return this
		})()
	}

	// eslint-disable-next-line max-statements
	async upload(_name,_size, _userName, path) {
		try{
			if (_name === '') throw new Error('String cannot be empty.')
			const nameLimit = 50
			if(_name.length >= nameLimit) throw new Error('String size too big')
			const oneGig = 1073741824
			if (_size >= oneGig) throw new Error('Size cannot be equal or greater than a GB')
			const toKB = 1000
			const size = _size/toKB

			const UserName = _userName
			const nameHash = Mailer.createHash(_name)

			const extension = _name.split('.').pop()
			const nameExt = `${nameHash}.${extension}`
			_name = _name.replace(`.${extension}`, '')


			let targetPath = `/${ _userName }/${ nameExt}`

			//calculate expiry date
			const today = new Date()

			const expiredAfterThree = 3
			const later = addDays(today, expiredAfterThree)
			const expire = `${later.getFullYear()}-${later.getMonth() + 1}-${later.getDate()}`


			const sql = `INSERT INTO Files(FileName,FileType,FilePath,Size, FileHash, ExpDate,user) 
			VALUES( "${_name}","${extension}", "${targetPath}", "${size}","${nameHash}","${expire}","${UserName}")`
			await this.db.run(sql)

			//save to directory on server
			targetPath = `private${targetPath}`
			await fs.copy(path, targetPath)
			console.log('File saved on server')

			return true
		}catch(err) {
			/* istanbul ignore next */
			throw err
		}

	}
	async deleteExpired() {
		try{
			// eslint-disable-next-line quotes
			let sql = `SELECT FileHash, FilePath FROM Files WHERE date('now') > date(Date, '+3 days')
							OR Downloaded LIKE true`
			const data = await this.db.all(sql)

			for (const key in data) {
				fs.unlinkSync(`private${data[key]['FilePath']}`)

				sql = `DELETE FROM Files WHERE FileHash LIKE '${data[key]['FileHash']}'`
				await this.db.run(sql)

			}
			console.log('Expired files deleted')

			return true
		}catch(err) {
			/* istanbul ignore next */
			throw err
		}

	}

	async updateValue(_fileHash) {
		try {
			// eslint-disable-next-line quotes
			const sql = `UPDATE Files SET Downloaded=true WHERE FileHash LIKE '${_fileHash}'
							 OR FileName LIKE '${_fileHash}'`

			await this.db.run(sql)

			return true
		} catch (err) {
			/* istanbul ignore next */
			throw err
		}

	}


	async generateLink(_fileName, username, fullLink) {
		try {
			const sql = `SELECT FilePath, FileHash FROM Files 
							WHERE FileName LIKE '${_fileName}' OR
							FileHash LIKE '${_fileName}' AND user LIKE '${username}'`

			const data = await this.db.all(sql)
			let link = data[0]['FilePath']

			if (fullLink) {
				link = `http://localhost:8080/download/${ username}/${data[0]['FileHash']}`
			}
			return link

		} catch (err) {
			/* istanbul ignore next */
			throw err
		}
	}
	async delFromDir(path) {
		try {
			// eslint-disable-next-line prefer-template
			// targetPath = 'private/' + targetPath
			fs.unlinkSync(path)
			console.log('File deleted from server')
		} catch(err) {
			throw err
		}
	}

	async countItems() {
		try {
			const sql = 'SELECT COUNT(*) AS count FROM Files'

			let count = await this.db.all(sql)
			count = count[0]['count']
			return count

		} catch (err) {
			/* istanbul ignore next */
			throw err
		}
	}


	async getFileInfo(_fileName, _userName) {
		try {
			const sql = `SELECT * FROM Files 
							WHERE FileHash LIKE '${_fileName}' OR
							 FileName LIKE '${_fileName}' AND user LIKE '${_userName}'`

			const data = await this.db.all(sql)

			return data

		} catch (err) {
			/* istanbul ignore next */
			throw err
		}
	}

	async deleteRecord(fileName) {
		try {
			const sql = `DELETE FROM Files 
					WHERE FileName = '${fileName}'`
			await this.db.run(sql)

		} catch (err) {
			throw err
		}
	}

	/* istanbul ignore next */
	async tearDown() {
		await this.db.close()
	}
}


