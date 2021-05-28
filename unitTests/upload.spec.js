'use strict'

const Uploads = require('../modules/upload.js')


describe('upload()', () => {
	test('File Name missing', async done => {
		expect.assertions(1)
		const todo = await new Uploads()
		await expect(todo.upload(
			'png','',200,'Wed 20/20/19 15:20:20','path','Userpath')).rejects.toEqual(Error('String cannot be empty.'))
		done()
	})

	test('File Not bigger than a GB', async done => {
		expect.assertions(1)
		const todo = await new Uploads()
		await expect(todo.upload(
			'png','name',1073741824,'Wed 20/20/19 15:20:20',
			'path','Userpath')).rejects.toEqual(Error('Size cannot be equal or greater than a GB'))
		done()
	})

	test('File Name string too long', async done => {
		expect.assertions(1)
		const todo = await new Uploads()
		await expect(todo.upload(
			'png','K8DbQxhva2qECr7urmCOVOayGnf6OUh2MCjYC9VaO04m9SXLui',
			10750,'Wed 20/20/19 15:20:20','path','Userpath')).rejects.toEqual(Error('String size too big'))
		done()
	})

	test('File added to table', async done => {
		expect.assertions(1)
		// ARRANGE
		const file = await new Uploads()
		//ACT
		await file.upload('png', 'cool', 200, 'test', 'public/images/cool.png')
		const count = await file.countItems()
		// ASSERT
		expect(count).toBe(1)
		done()

	})

})

describe('deleteExpired()', () => {

	test('File deleted from table when expired', async done => {
		expect.assertions(1)
		//ARRANGE
		const file = await new Uploads()
		//ACT
		await file.upload('png', 'name', 200, 'test', 'public/images/cool.png')
		const sql = 'UPDATE Files SET Date="2018-03-11" WHERE FileName LIKE "name"'
		await file.db.run(sql)
		await file.deleteExpired()
		const count = await file.countItems()
		// ASSERT
		expect(count).toBe(0)
		done()
	})

	test('File deleted from table when downloaded', async done => {
		expect.assertions(1)
		//ARRANGE
		const file = await new Uploads()
		//ACT
		await file.upload('png', 'name', 200, 'test', 'public/images/cool.png')
		const sql = 'UPDATE Files SET Downloaded=true WHERE FileName LIKE "name"'
		await file.db.run(sql)
		await file.deleteExpired()
		const count = await file.countItems()
		// ASSERT
		expect(count).toBe(0)
		done()
	})

	/* test('Connection to database fail', async done => {
		expect.assertions(1)
		try {
		//ARRANGE
			const file = await new Uploads()
			//ACT
			const sql='SELECT * FROM Files'
			const data = await this.dba.all(sql)
			done.fail('test failed')
		} catch (err) {
		// ASSERT
			expect(err).toBeDefined()
		} finally {
			done()
		}

	}) */

})

describe('updateValue()', () => {

	test('Value changed', async done => {
		expect.assertions(1)
		//ARRANGE
		const file = await new Uploads()
		//ACT
		await file.upload('png', 'name', 200, 'test', 'public/images/cool.png')
		await file.updateValue('name')
		const sql='SELECT Downloaded FROM Files WHERE FileName LIKE "name"'
		let data = await file.db.all(sql)
		data = data[0]['Downloaded']
		// ASSERT
		expect(data).toBe('1')
		done()
	})
})

describe('generateLink()', () => {

	test('Short link generated', async done => {
		expect.assertions(1)
		//ARRANGE
		const file = await new Uploads()
		//ACT
		await file.upload('png', 'name', 200, 'test', 'public/images/cool.png')
		const link = await file.generateLink('name', 'test', false)
		// ASSERT
		expect(link).toMatch('/test/')
		done()
	})

	test('Long link generated', async done => {
		expect.assertions(2)
		//ARRANGE
		const file = await new Uploads()
		//ACT
		await file.upload('png', 'name', 200, 'test', 'public/images/cool.png')
		const link = await file.generateLink('name', 'test', true)
		// ASSERT
		expect(link).toMatch('/test/')
		expect(link).toMatch('/localhost:8080/')
		done()
	})
})


describe('getFileInfo()', () => {

	test('Values match', async done => {
		expect.assertions(4)
		//ARRANGE
		const file = await new Uploads()
		//ACT
		await file.upload('png', 'name', 200, 'test', 'public/images/cool.png')
		const data = await file.getFileInfo('name', 'test')
		// ASSERT
		expect(data[0]['FileName']).toBe('name')
		expect(data[0]['FileType']).toBe('png')
		expect(data[0]['Size']).toBe(0.2)
		expect(data[0]['FilePath']).toBe('/test/b068931cc450442b63f5b3d276ea4297.png')
		done()
	})
})
