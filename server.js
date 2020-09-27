const express = require('express')
const app = express()

app.get('/', (req, res) => res.send("Running API"))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`server running on ${PORT}`))