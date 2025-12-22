const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const CATEGORIES_PATH = path.join(__dirname, '..', 'src', 'features', 'budget', 'categories.json')

app.post('/api/categories', (req, res) => {
  const body = req.body
  if (!body) return res.status(400).json({ error: 'empty body' })
  try {
    const data = JSON.stringify(body, null, 2)
    fs.writeFileSync(CATEGORIES_PATH, data, 'utf8')
    return res.json({ ok: true })
  } catch (err) {
    console.error('Failed to write categories.json', err)
    return res.status(500).json({ error: 'write failed' })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Categories server listening on ${PORT}`))
