/*
Sources:
https://www.w3schools.com/nodejs/nodejs_email.asp
https://www.youtube.com/watch?v=FbDRGpB2eJ8
*/

'use strict'

const nodemailer = require('nodemailer')
const crypto = require('crypto')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const createHash = function(userString) {
	if (userString === '' || userString === undefined) throw new Error('String cannot be empty.')
	const hash = crypto.createHash('md5').update(userString).digest('hex')
	return hash
}

// eslint-disable-next-line max-lines-per-function
const sendMail = function(toAddress, link, userMessage) {
	// eslint-disable-next-line max-len
	const mailText = `A user decided to share a file with you! Here is the link:\n ${link}\n\nUser message: ${userMessage}`
	if (!toAddress.includes('@')) throw new Error('Email invalid')

	/* istanbul ignore next */
	if (!link.includes('/localhost:8080/')) {
		throw new Error('Wrong download link')
	}

	/* istanbul ignore next */
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'filesharingproject2@gmail.com',
			//TODO: store pass in seperate file
			pass: 'passpasspass'
		}
	}) /* istanbul ignore next */
	const mailOptions = {
		from: 'filesharingproject2@gmail.com',
		to: toAddress,
		subject: 'Sharing a download link',
		text: mailText

	}	/* istanbul ignore next */
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error)
			throw new Error('Email not sent')
		} else {
			console.log(`Email sent: ${info.response}`)
		}
	})

}


// eslint-disable-next-line max-lines-per-function
const emailContact = function(fullName, email2, phone, userMessage) {
	const mailText = (fullName, email2, phone, userMessage)

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'filesharingproject2@gmail.com',
			pass: 'passpasspass'
		}
	})
	const mailOptions = {
		from: 'filesharingproject2@gmail.com',
		to: 'filesharingproject3@gmail.com',
		subject: 'Customer Query',
		text: mailText
	}

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error)
		} else {
			console.log(`Email sent: ${info.response}`)
		}
	})

}

module.exports = {
	sendMail,
	createHash,
	emailContact,
}
