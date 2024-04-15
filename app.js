const express = require('express')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const {format, isValid} = require('date-fns')

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
const app = express()
app.use(express.json())

const validateParams = (req, res, next) => {
  let {status, priority, category, dueDate, date} = {}
  if (Object.keys(req.body).length === 0) {
    ;({status = '', priority = '', category = '', date} = req.query)
  } else {
    ;({status = '', priority = '', category = '', dueDate} = req.body)
  }
  let statusVals = ['TO DO', 'IN PROGRESS', 'DONE', '']
  let priorityVals = ['HIGH', 'MEDIUM', 'LOW', '']
  let categoryVals = ['WORK', 'HOME', 'LEARNING', '']

  if (!statusVals.includes(status)) {
    res.status(400)
    res.send('Invalid Todo Status')
  } else if (!priorityVals.includes(priority)) {
    res.status(400)
    res.send('Invalid Todo Priority')
  } else if (!categoryVals.includes(category)) {
    res.status(400)
    res.send('Invalid Todo Category')
  } else if (
    (!isValid(new Date(dueDate)) && dueDate !== undefined) ||
    (!isValid(new Date(date)) && date !== undefined)
  ) {
    res.status(400)
    res.send('Invalid Due Date')
  } else {
    next()
  }
}

const initializeServerAndDB = async () => {
  try {
    db = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Started At http://localhost:3000/')
    })
  } catch (e) {
    console.log('Error :' + e.message())
    process.exit(1)
  }
}

initializeServerAndDB()

//1
app.get('/todos/', validateParams, async (req, res) => {
  let {status = '', priority = '', search_q = '', category = ''} = req.query
  query = `select id,todo,priority,status,category,due_date as dueDate from todo where status like "%${status}%" and priority like "%${priority}%" and todo like "%${search_q}%" and category like "%${category}%";`
  let results = await db.all(query)
  res.send(results)
})

//2
app.get('/todos/:todoId', async (req, res) => {
  let query = `select id,todo,priority,status,category,due_date as dueDate from todo where id=${req.params.todoId};`
  let result = await db.get(query)
  res.send(result)
})

//3
app.get('/agenda/', validateParams, async (req, res) => {
  let newDate = format(new Date(req.query.date), 'yyyy-MM-dd')
  let query = `select id,todo,priority,status,category,due_date as dueDate from todo where due_date="${newDate}";`
  let result = await db.all(query)
  res.send(result)
})

//4
app.post('/todos/', validateParams, async (req, res) => {
  let query = `insert into todo(id,todo,category,priority,status,due_date) values
  (${req.body.id},"${req.body.todo}","${req.body.category}","${req.body.priority}","${req.body.status}","${req.body.dueDate}")`
  await db.run(query)
  res.send('Todo Successfully Added')
})

//5
app.put('/todos/:todoId', validateParams, async (req, res) => {
  if (req.body.status !== undefined) {
    await db.run(
      `update todo set status="${req.body.status}" where id=${req.params.todoId}`,
    )
    res.send('Status Updated')
  } else if (req.body.priority !== undefined) {
    await db.run(
      `update todo set priority="${req.body.priority}" where id=${req.params.todoId}`,
    )
    res.send('Priority Updated')
  } else if (req.body.todo !== undefined) {
    await db.run(
      `update todo set todo="${req.body.todo}" where id=${req.params.todoId}`,
    )
    res.send('Todo Updated')
  } else if (req.body.category !== undefined) {
    await db.run(
      `update todo set category="${req.body.category}" where id=${req.params.todoId}`,
    )
    res.send('Category Updated')
  } else if (req.body.dueDate !== undefined) {
    await db.run(
      `update todo set due_date="${req.body.dueDate}" where id=${req.params.todoId}`,
    )
    res.send('Due Date Updated')
  }
})

//6
app.delete('/todos/:todoId/', async (req, res) => {
  let query = `delete from todo where id=${req.params.todoId};`
  await db.run(query)
  res.send('Todo Deleted')
})

module.exports = app
