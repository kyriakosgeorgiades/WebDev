'use strict'

const hashes = require('../modules/mailer.js')

describe('createHash()', () => {
	// block of tests
	beforeEach(async() => {
		// runs after each test completes
	})
	afterEach(async() => {
		// runs after each test completes
	})
	test('create hash', async done => {
		expect.assertions(2)
		//ACT
		const hash = hashes.createHash('string')
		//ASSERT
		expect(hash).not.toBe('string')
		expect(hash).toHaveLength(32)
		done()
	})

	test('string must not be empty', async done => {
		expect.assertions(1)
		try {
			//ACT
			hashes.createHash('')
			//ASSERT
			done.fail('test failed')
		} catch (err) {
			expect(err.message).toBe('String cannot be empty.')
		} finally {
			done()
		}
	})
})

describe('sendMail()', () => {
	/* // block of tests
	beforeEach(async () => {
		// runs after each test completes
	})
	afterEach(async () => {
		// runs after each test completes
	}) */

	test('Valid email', async done => {
		expect.assertions(1)
		try {
			//ACT
			hashes.sendMail('test', 'link/localhost:8080/', 'message')
			//ASSERT
			done.fail('test failed')
		} catch (err) {
			expect(err.message).toBe('Email invalid')
		} finally {
			done()
		}
	})

	test('Valid link', async done => {
		expect.assertions(1)
		try {
			//ACT
			hashes.sendMail('test@', 'link', 'message')
			//ASSERT
			done.fail('test failed')
		} catch (err) {
			expect(err.message).toBe('Wrong download link')
		} finally {
			done()
		}
	})
})

