const express = require('express')
const cors = require('cors')
const { register, login } = require('./controllers/users');
const { getAllCustomers, getCustomerById, createNewCustomer, updateCustomer, deleteCustomer } = require('./controllers/customers');
const { createNewTransaction, getAllTransaction, updateTransaction, deleteTransaction } = require('./controllers/transaction-customers-sales');
const app = express()

//middlewares

app.use(express.json());
app.use(cors())

//root
app.get('/', function (req, res) {
  res.send('Hello World')
})

//users
app.post('/api/register', register);
app.post('/api/login', login);

//customers
app.get('/api/getAllCustomers', getAllCustomers)
app.get('/api/getCustomerById/:id', getCustomerById)
app.post('/api/createNewCustomer', createNewCustomer)
app.put('/api/updateCustomer/:id', updateCustomer)
app.delete('/api/deleteCustomer/:id', deleteCustomer)

//transaction customers-sales
app.get('/api/getAllTransaction', getAllTransaction)
app.post('/api/createNewTransaction', createNewTransaction)
app.put('/api/updateTransaction/:id', updateTransaction)
app.delete('/api/deleteTransaction/:id', deleteTransaction)


app.listen(process.env.PORT)