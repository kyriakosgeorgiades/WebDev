#!/usr/bin/env node
//Routes File

'use strict'

/* MODULE IMPORTS */
const Koa = require('koa')
const Router = require('koa-router')
const views = require('koa-views')
const staticDir = require('koa-static')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')({multipart: true, uploadDir: '.'})
const session = require('koa-session')
const Database = require('sqlite-async')

/* IMPORT CUSTOM MODULES */
const User = require('./modules/user')
const Mailer = require('./modules/mailer')
const File = require('./modules/upload')
const app = new Koa()
const router = new Router()

/* CONFIGURING THE MIDDLEWARE */
app.keys = ['darkSecret']
app.use(staticDir('public'))
app.use(staticDir('private'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}/views`, { extension: 'handlebars' }, {map: { handlebars: 'handlebars' }}))

const defaultPort = 8080
const port = process.env.PORT || defaultPort
const dbName = 'website.db'

let user
let file
/**
 * The secure home page.
 *
 * @name Home Page
 * @route {GET} /
 * @authentication This route requires cookie-based authentication.
 */
router.get('/', async ctx => {
	try {
		// if(ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')
		const data = {}
		if(ctx.query.msg) data.msg = ctx.query.msg
		 await ctx.render('home')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
/**
 * The Users Interaction Page and Script
 * @name User Page
 * @route {GET} /myfiles
 */

// eslint-disable-next-line max-lines-per-function
router.get('/myfiles', async ctx => {
	try {
		if(ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')

		file = await new File(dbName)

		//delete button
		if(ctx.query.del) {
			let fileName = ctx.query.name
			const userName = ctx.session.userName
			const data = await file.getFileInfo(fileName, userName)
			fileName = data[0]['FileHash']
			await file.updateValue(fileName)
		}
		await file.deleteExpired()

		user = await new User(dbName)
		const username = ctx.session.userName
		await user.UserFileDisplay(ctx, dbName, Database,username)

	} catch (err) {
		await ctx.render('error', {message: err.message})
	} finally {
		if(ctx.session.authorised !== true) return ctx.redirect('/login?msg=You need to log in')

		file.tearDown()
		user.tearDown()
	}
})


router.post('/myfiles', koaBody, async ctx => {
	try {
		const userName = ctx.session.userName
		// extract the data from the request
		// eslint-disable-next-line no-unused-vars
		const { path, type } = ctx.request.files._file
		const name = ctx.request.files._file.name
		const size = ctx.request.files._file.size

		file = await new File(dbName)
		await file.upload(name, size, userName, path)

		ctx.redirect('/myfiles?msg=Your file has been uploaded!')
	} catch (err) {
		await ctx.render('error', { message: err.message })
	} finally {
		file.tearDown()
	}
})


router.get('/about', async ctx => {
	try {
		await ctx.render('AboutUs')
	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})

router.get('/ContactUs', async ctx => {
	try {
		await ctx.render('ContactUs')
	} catch (err) {
		await ctx.render('error', { message: err.message })


	}
})

router.post('/ContactUs', koaBody, async ctx => {

	try{
		//extracts data from request
		const fullName = ctx.request.body.fullName
		const email2 = ctx.request.body.email2
		const phone = ctx.request.body.phone
		const userMessage = ctx.request.body.userMessage

		await Mailer.emailContact(fullName, email2, phone, userMessage)
		ctx.redirect('/ContactUs?msg=Your query has been sent')

	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})

/**
 * The user registration page.
 *
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => {
	await ctx.render('register')
})

/**
 * The script to process new user registrations.
 *
 * @name Register Script
 * @route {POST} /register
 */
router.post('/register', koaBody, async ctx => {
	try {
		// extract the data from the request
		const body = ctx.request.body
		// call the functions in the module
		user = await new User(dbName)
		await user.register(body.user, body.pass)
		// await user.uploadPicture(path, type)
		// redirect to the home page
		ctx.redirect(`/?msg=new user "${body.name}" added`)
	} catch(err) {
		await ctx.render('error', {message: err.message})
	} finally {
		user.tearDown()
	}
})

/**
 * The script to process new user registrations with emailaddress.
 *
 * @name Register Script
 * @route {POST} /registeremail
 */
router.post('/registeremail', koaBody, async ctx => {
	try {
		// extract the data from the request
		const body = ctx.request.body
		// call the functions in the module
		user = new User(dbName)
		await user.registeremail(body.email, body.pass)
		// await user.uploadPicture(path, type)
		// redirect to the home page
		ctx.redirect(`/?msg=new user "${body.email}" added`)
	} catch(err) {
		await ctx.render('error', {message: err.message})
	} finally {
		user.tearDown()
	}
})


router.get('/login', async ctx => {
	if(ctx.session.authorised === true) return ctx.redirect('myfiles')
	const data = {}
	if(ctx.query.msg) data.msg = ctx.query.msg
	if(ctx.query.user) data.user = ctx.query.user
	await ctx.render('login', data)
})

router.post('/login', async ctx => {
	try {
		const body = ctx.request.body
		user = await new User(dbName)
		const _userName = await user.login(body.user, body.pass)
		ctx.session.authorised = true
		ctx.session.userName = _userName
		return ctx.redirect('/myfiles')
		// return ctx.redirect('/?msg=you are now logged in...')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	} finally {
		user.tearDown()
	}
})

router.get('/account', async ctx => {

	try {
		const userName = ctx.session.userName
		const sql = `SELECT id, user, userHash, pass FROM users WHERE userHash = "${userName}"`
		const db = await
		Database.open(dbName)
		const data = await db.all(sql)
		await db.close()
		await ctx.render('account',{user: data})

	} catch (err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/logout', async ctx => {
	ctx.session.authorised = null
	ctx.redirect('/')
	// ctx.redirect('/?msg=you are now logged out')
})

router.get('/transfer', async ctx => {
	try {
		const data = {}
		if (ctx.query.name) data.cleanFileName = ctx.query.name
		if (ctx.query.ex) data.fileType = ctx.query.ex
		if (ctx.query.msg) data.msg = ctx.query.msg
		await ctx.render('transfer', data)
	} catch (err) {
		await ctx.render('error', { message: err.message })
	}
})

router.post('/transfer', koaBody, async ctx => {
	try {
		const userName = ctx.session.userName
		// extract the data from the request
		const filename = ctx.request.body.fileName
		const userMessage = ctx.request.body.message
		const email = ctx.request.body.targetMail

		file = await new File(dbName)
		//Generate the link to download page
		const link = await file.generateLink(filename, userName, true)
		console.log(`Download link: ${link}`)

		//TODO: username passed in email
		//Send the link in email
		 await Mailer.sendMail(email, link, userMessage)

		ctx.redirect('/myfiles?msg=Your file has been transfered!')

	} catch (err) {
		await ctx.render('error', { message: err.message })
	} finally {
		file.tearDown()
	}
})

router.get('/download/:usrName/:name', async ctx => {
	try {
		const fileName = ctx.params.name
		const userName = ctx.params.usrName

		// console.log(ctx.request.url)

		file = await new File(dbName)

		const fileData = await file.getFileInfo(fileName, userName)
		//generate link with a direct path to file
		const link = await file.generateLink(fileName, userName, false)

		const data = {}
		data.fileName = `${fileData[0]['FileName']}.${fileData[0]['FileType']}`
		data.fileHash = fileData[0]['FileHash']

		await ctx.render('download', { link: link, file: data })
	} catch (err) {
		await ctx.render('error', { message: err.message })
	} finally {
		file.tearDown()
	}
})

router.post('/download', async ctx => {
	try {
		const downloaded = ctx.request.body.downloaded
		const fileHash = ctx.request.body.fileHash

		if (downloaded) {
			file = await new File(dbName)
			await file.updateValue(fileHash)
		}

		return ctx.redirect('back')
	} catch (err) {
		await ctx.render('error', { message: err.message })
	} finally {
		file.tearDown()
	}
})


app.use(router.routes())
module.exports = app.listen(port, async() => console.log(`listening on port ${port}`))

router.get('/registeremail', async ctx => {
	await ctx.render('registeremail')
})
