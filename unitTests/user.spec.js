
'use strict'

const Accounts = require('../modules/user.js')


describe('register()', () => {

	test('register a valid account', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		const register = await account.register('doej', 'password')
		expect(register).toBe(true)
		done()
	})

	test('register a duplicate username', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await account.register('doej', 'password')
		await expect( account.register('doej', 'password') )
			.rejects.toEqual( Error('username "doej" already in use') )
		done()
	})

	test('error if blank username', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect( account.register('', 'password') )
			.rejects.toEqual( Error('missing username') )
		done()
	})

	test('error if blank password', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect( account.register('doej', '') )
			.rejects.toEqual( Error('missing password') )
		done()
	})


})

describe('uploadPicture()', () => {
	// this would have to be done by mocking the file system
	// perhaps using mock-fs?
})

describe('login()', () => {
	test('log in with valid credentials', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		const usrName = 'doej'
		await account.register(usrName, 'password')
		const valid = await account.login(usrName, 'password')
		expect(valid).toHaveLength(32)
		done()
	})

	test('invalid username', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await account.register('doej', 'password')
		await expect( account.login('roej', 'password') )
			.rejects.toEqual( Error('username "roej" not found') )
		done()
	})

	test('invalid password', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await account.register('doej', 'password')
		await expect( account.login('doej', 'bad') )
			.rejects.toEqual( Error('invalid password for account "doej"') )
		done()
	})


})

describe('registermail()', () => {
	test('missing username', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect(account.registeremail('', 'password'))
			.rejects.toEqual(Error('missing emailaddress'))
		done()
	})

	test('missing password', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect(account.registeremail('doej', ''))
			.rejects.toEqual(Error('missing password'))
		done()
	})

	test('register user', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await account.register('doej', 'password')
		const count = await account.countItems()
		expect(count).toBe(1)
		done()
	})

})

/* describe('UserFileDisplay()', () => {

})
 */
